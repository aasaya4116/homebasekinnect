// ============================================================
// CHORE HISTORY — read-only views over the two append-only logs
// ============================================================
// Powers the /history page: the Sun–Sat week grid per kid, and the
// per-kid ledger (chore completions + balance adjustments) with a
// running balance replayed chronologically. Nothing here writes, and
// the chore check-off path doesn't import from this file.
//
// The ledger replays every event in timestamp order, so its final
// running total always reconciles with getKidBalance()'s math
// (final done-state values + adjustment sum).

import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import { getChoreDefs, isDueOn, isAsNeeded, CHORE_LOG_TAB, BALANCE_LOG_TAB } from "./chores";
import { zonedDateStr } from "./dates";
import type { ChoreDef } from "./choreShared";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

const round2 = (v: number) => Math.round(v * 100) / 100;

/** A calendar date `n` days from `ds` (YYYY-MM-DD, noon-anchored UTC math). */
export function addDays(ds: string, n: number): string {
  const d = new Date(`${ds}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------
// Raw log reads
// ------------------------------------------------------------
export type ChoreLogRow = {
  ts: string;      // ISO timestamp of the event
  date: string;    // the calendar day the chore was for
  choreId: string;
  kid: string;
  done: boolean;
  value: number;
};

export type BalanceLogRow = {
  ts: string;
  kid: string;
  amount: number;  // cash-outs negative
  note: string;
};

async function readTab(range: string): Promise<string[][]> {
  try {
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
    return (res.data.values || []) as string[][];
  } catch (error: any) {
    console.log(`History read failed for ${range}:`, error.message);
    return [];
  }
}

export async function getChoreLogRows(): Promise<ChoreLogRow[]> {
  const rows = await readTab(`'${CHORE_LOG_TAB}'!A2:F10000`);
  return rows
    .filter((r) => r[0] && r[1] && r[2])
    .map((r) => ({
      ts: String(r[0]).trim(),
      date: String(r[1]).slice(0, 10),
      choreId: String(r[2]).trim(),
      kid: String(r[3] || "").trim(),
      done: String(r[4] || "").trim().toLowerCase() === "done",
      value: parseFloat(r[5]) || 0,
    }));
}

export async function getBalanceLogRows(): Promise<BalanceLogRow[]> {
  const rows = await readTab(`'${BALANCE_LOG_TAB}'!A2:E10000`);
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({
      ts: String(r[0]).trim(),
      kid: String(r[1]).trim(),
      amount: parseFloat(r[2]) || 0,
      note: String(r[4] || "").trim(),
    }));
}

/** Final state per (date, chore) — the last event wins, keeping its row
 *  (and therefore the timestamp of the winning check-off). */
export function finalStates(rows: ChoreLogRow[]): Map<string, ChoreLogRow> {
  const m = new Map<string, ChoreLogRow>();
  for (const r of rows) m.set(`${r.date}|${r.choreId}`, r);
  return m;
}

// ------------------------------------------------------------
// Week grid — chores × Sun..Sat per kid
// ------------------------------------------------------------
export type DayStatus = "done" | "missed" | "due-today" | "upcoming" | "none";

export type WeekGridRow = { def: ChoreDef; days: DayStatus[] };

export type KidWeekGrid = {
  kid: string;
  rows: WeekGridRow[];
  doneCount: number;   // done cells so far this week
  dueSoFar: number;    // cells due through today (done + missed + due-today)
};

export function buildWeekGrids(
  defs: ChoreDef[],
  states: Map<string, ChoreLogRow>,
  weekStartStr: string,
  today: string
): KidWeekGrid[] {
  const kids: string[] = [];
  for (const def of defs) if (!kids.includes(def.kid)) kids.push(def.kid);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartStr, i));

  return kids.map((kid) => {
    const mine = defs.filter((d) => d.kid === kid);
    const rows: WeekGridRow[] = [];

    for (const def of mine) {
      const asNeeded = isAsNeeded(def.days);
      const days: DayStatus[] = weekDays.map((ds) => {
        const done = states.get(`${ds}|${def.id}`)?.done || false;
        if (done) return "done";
        // Not-due days stay blank; an as-needed chore is never "missed".
        if (asNeeded || !isDueOn(def.days, ds)) return "none";
        if (ds < today) return "missed";
        if (ds === today) return "due-today";
        return "upcoming";
      });

      // As-needed chores only earn a row in weeks they were actually done,
      // so quiet weeks don't render a wall of blanks.
      if (asNeeded && !days.includes("done")) continue;
      rows.push({ def, days });
    }

    let doneCount = 0;
    let dueSoFar = 0;
    for (const row of rows) {
      for (const st of row.days) {
        if (st === "done") { doneCount++; dueSoFar++; }
        else if (st === "missed" || st === "due-today") dueSoFar++;
      }
    }

    return { kid, rows, doneCount, dueSoFar };
  });
}

// ------------------------------------------------------------
// Ledger — chore completions + adjustments, newest first,
// with a running balance after each event
// ------------------------------------------------------------
export type LedgerItem = {
  ts: string;
  kind: "chore" | "adjust";
  label: string;
  emoji: string;          // chore emoji, or 💰 for adjustments
  amount: number;
  running: number;        // balance after this event
  forDate?: string;       // chore's calendar day when it differs from the check-off day
};

export function buildLedgers(
  defs: ChoreDef[],
  choreRows: ChoreLogRow[],
  balRows: BalanceLogRow[]
): Map<string, LedgerItem[]> {
  const byId = new Map(defs.map((d) => [d.id, d]));

  type Raw = Omit<LedgerItem, "running">;
  const perKid = new Map<string, Raw[]>();
  const push = (kid: string, item: Raw) => {
    if (!perKid.has(kid)) perKid.set(kid, []);
    perKid.get(kid)!.push(item);
  };

  // Only final done states hit the ledger — a done→undo pair nets zero and
  // would just be noise in a kid-facing money feed.
  for (const r of finalStates(choreRows).values()) {
    if (!r.done) continue;
    const def = byId.get(r.choreId);
    push(r.kid, {
      ts: r.ts,
      kind: "chore",
      label: def?.name || r.choreId,
      emoji: def?.emoji || "✅",
      amount: r.value,
      forDate: r.date !== zonedDateStr(new Date(r.ts)) ? r.date : undefined,
    });
  }

  for (const b of balRows) {
    push(b.kid, {
      ts: b.ts,
      kind: "adjust",
      label: b.note || (b.amount < 0 ? "Cash out" : "Balance adjustment"),
      emoji: "💰",
      amount: b.amount,
    });
  }

  // Replay oldest→newest for running totals, then flip for display.
  const out = new Map<string, LedgerItem[]>();
  for (const [kid, items] of perKid) {
    items.sort((a, b) => a.ts.localeCompare(b.ts));
    let running = 0;
    const withRunning = items.map((it) => {
      running = round2(running + it.amount);
      return { ...it, running };
    });
    out.set(kid, withRunning.reverse());
  }
  return out;
}

/** Everything the /history page needs in one round of fetches. */
export async function getHistoryData(): Promise<{
  defs: ChoreDef[];
  states: Map<string, ChoreLogRow>;
  ledgers: Map<string, LedgerItem[]>;
}> {
  const [defs, choreRows, balRows] = await Promise.all([
    getChoreDefs(),
    getChoreLogRows(),
    getBalanceLogRows(),
  ]);
  return {
    defs,
    states: finalStates(choreRows),
    ledgers: buildLedgers(defs, choreRows, balRows),
  };
}
