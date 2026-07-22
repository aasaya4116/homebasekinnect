// ============================================================
// CHORES — kid chore board backed by two Google Sheet tabs
// ============================================================
// The Sheet is the admin panel: parents add/edit chores from the Google
// Sheets app on their phones; the kiosk only reads definitions and appends
// check-off events.
//
//   • "Chores"    — one row per chore definition (who, what, which days,
//                   time slot, allowance value, active flag).
//   • "Chore Log" — append-only events. A check-off appends "done", an
//                   un-check appends "undo"; the LAST event for a
//                   (date, chore) pair wins. Nothing is ever deleted, so
//                   the log doubles as allowance history.
//
// Allowance value is copied into the log row at completion time, so later
// edits to a chore's value never rewrite money already earned.

import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import { dayOfWeek } from "./dates";
import { SLOT_ORDER, type ChoreDef, type ChoreItem, type KidBoard } from "./choreShared";

// Client components import these from choreShared directly; re-exported here
// so server code can keep a single import path.
export { SLOT_ORDER, fmtMoney } from "./choreShared";
export type { ChoreDef, ChoreItem, KidBoard } from "./choreShared";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

export const CHORES_TAB = "Chores";
export const CHORE_LOG_TAB = "Chore Log";
export const BALANCE_LOG_TAB = "Balance Log";

export const CHORES_HEADER = ["ID", "Kid", "Chore", "Emoji", "Days", "Slot", "Allowance", "Active"];
export const CHORE_LOG_HEADER = ["Timestamp", "Date", "Chore ID", "Kid", "Action", "Value"];
export const BALANCE_LOG_HEADER = ["Timestamp", "Kid", "Amount", "New Balance", "Note"];

/** Money math on cents so 0.1 + 0.2 style float drift never reaches the ledger. */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ------------------------------------------------------------
// Tab bootstrap — same pattern as mealLog.ensureTab.
// ------------------------------------------------------------
export async function ensureChoreTabs(sheets: any): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = new Set(
    (meta.data.sheets || []).map((s: any) => s.properties?.title)
  );
  for (const [tab, header] of [
    [CHORES_TAB, CHORES_HEADER],
    [CHORE_LOG_TAB, CHORE_LOG_HEADER],
  ] as [string, string[]][]) {
    if (!existing.has(tab)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${tab}'!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [header] },
      });
    }
  }
}

// ------------------------------------------------------------
// Scheduling — is a chore due on this calendar date?
// ------------------------------------------------------------
const DAY_ABBRS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function isAsNeeded(days: string): boolean {
  return days.trim().toLowerCase().replace(/[^a-z]/g, "").startsWith("asneeded");
}

export function isDueOn(days: string, dateStr: string): boolean {
  const d = days.trim().toLowerCase();
  if (!d || isAsNeeded(d)) return false;
  if (d === "daily" || d === "every day" || d === "everyday") return true;
  const today = DAY_ABBRS[dayOfWeek(dateStr)];
  return d
    .split(/[,/]+/)
    .some((part) => part.trim().slice(0, 3) === today);
}

// ------------------------------------------------------------
// Reads
// ------------------------------------------------------------
export async function getChoreDefs(): Promise<ChoreDef[]> {
  try {
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CHORES_TAB}'!A2:H200`,
    });
    const rows = res.data.values || [];
    return rows
      .filter((r) => r[0] && r[1] && r[2])
      .map((r) => ({
        id: String(r[0]).trim(),
        kid: String(r[1]).trim(),
        name: String(r[2]).trim(),
        emoji: String(r[3] || "✅").trim(),
        days: String(r[4] || "Daily").trim(),
        slot: String(r[5] || "Anytime").trim(),
        allowance: parseFloat(r[6]) || 0,
        active: String(r[7] || "Yes").trim().toLowerCase() !== "no",
      }))
      .filter((c) => c.active);
  } catch (error: any) {
    console.log("No Chores tab found:", error.message);
    return [];
  }
}

type LogState = { date: string; choreId: string; kid: string; done: boolean; value: number };

/** Final per-(date, chore) state from the append-only log — last event wins. */
async function getLogStates(): Promise<Map<string, LogState>> {
  const states = new Map<string, LogState>();
  try {
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CHORE_LOG_TAB}'!A2:F10000`,
    });
    const rows = res.data.values || [];
    for (const r of rows) {
      const date = String(r[1] || "").slice(0, 10);
      const choreId = String(r[2] || "").trim();
      if (!date || !choreId) continue;
      states.set(`${date}|${choreId}`, {
        date,
        choreId,
        kid: String(r[3] || "").trim(),
        done: String(r[4] || "").trim().toLowerCase() === "done",
        value: parseFloat(r[5]) || 0,
      });
    }
  } catch (error: any) {
    console.log("No Chore Log tab found:", error.message);
  }
  return states;
}

/** The most recent Sunday on or before `dateStr` — allowance weeks run Sun–Sat. */
export function weekStart(dateStr: string): string {
  const anchor = new Date(`${dateStr}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay());
  return anchor.toISOString().slice(0, 10);
}

/** Every calendar date from `start` to `end` inclusive (YYYY-MM-DD strings). */
function datesFromTo(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T12:00:00Z`);
  const stop = new Date(`${end}T12:00:00Z`);
  while (d <= stop) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// ------------------------------------------------------------
// Balances — lifetime chore earnings plus manual adjustments.
// "Balance Log" is append-only, same philosophy as Chore Log: every
// cash-out / correction is a timestamped row, nothing is ever edited.
// ------------------------------------------------------------

/** Sum of all balance adjustments per kid (cash-outs are negative rows). */
async function getAdjustmentSums(): Promise<Map<string, number>> {
  const sums = new Map<string, number>();
  try {
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${BALANCE_LOG_TAB}'!A2:E10000`,
    });
    for (const r of res.data.values || []) {
      const kid = String(r[1] || "").trim();
      const amt = parseFloat(r[2]);
      if (!kid || isNaN(amt)) continue;
      sums.set(kid, round2((sums.get(kid) || 0) + amt));
    }
  } catch (error: any) {
    console.log("No Balance Log tab found:", error.message);
  }
  return sums;
}

/** Lifetime done-chore earnings for one kid from the final log states. */
function lifetimeEarned(states: Map<string, LogState>, kid: string): number {
  let total = 0;
  for (const s of states.values()) {
    if (s.done && s.kid === kid) total += s.value;
  }
  return round2(total);
}

/** Current balance = lifetime chore earnings + adjustment sum. */
export async function getKidBalance(kid: string): Promise<number> {
  const [states, sums] = await Promise.all([getLogStates(), getAdjustmentSums()]);
  return round2(lifetimeEarned(states, kid) + (sums.get(kid) || 0));
}

/** Append one balance adjustment (cash-out = negative). With `zeroOut`, the
 *  amount is computed server-side as -currentBalance at write time so a stale
 *  client can never over- or under-cash. Returns what was written. */
export async function appendBalanceAdjustment(
  kid: string,
  amount: number,
  note: string,
  zeroOut: boolean
): Promise<{ amount: number; newBalance: number }> {
  const current = await getKidBalance(kid);
  const delta = zeroOut ? round2(-current) : round2(amount);
  const newBalance = round2(current + delta);

  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  const sheets = google.sheets({ version: "v4", auth });
  await ensureBalanceTab(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${BALANCE_LOG_TAB}'!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[new Date().toISOString(), kid, delta, newBalance, note || ""]],
    },
  });

  return { amount: delta, newBalance };
}

/** Create the Balance Log tab on first use. Kept separate from
 *  ensureChoreTabs so the chore check-off write path is untouched. */
async function ensureBalanceTab(sheets: any): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some(
    (s: any) => s.properties?.title === BALANCE_LOG_TAB
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: BALANCE_LOG_TAB } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${BALANCE_LOG_TAB}'!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [BALANCE_LOG_HEADER] },
    });
  }
}

// ------------------------------------------------------------
// The board — everything the kiosk page needs for one day.
// Kids appear in the order they first appear in the Chores tab.
// ------------------------------------------------------------
export async function getChoreBoards(dateStr: string): Promise<KidBoard[]> {
  const [defs, states, adjSums] = await Promise.all([getChoreDefs(), getLogStates(), getAdjustmentSums()]);
  const wkStart = weekStart(dateStr);

  const kids: string[] = [];
  for (const def of defs) {
    if (!kids.includes(def.kid)) kids.push(def.kid);
  }

  return kids.map((kid) => {
    const mine = defs.filter((d) => d.kid === kid);
    const toItem = (d: ChoreDef): ChoreItem => ({
      ...d,
      asNeeded: isAsNeeded(d.days),
      done: states.get(`${dateStr}|${d.id}`)?.done || false,
    });

    const scheduled = mine
      .filter((d) => isDueOn(d.days, dateStr))
      .map(toItem)
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
    const asNeeded = mine.filter((d) => isAsNeeded(d.days)).map(toItem);

    let earnedToday = 0;
    let earnedWeek = 0;
    for (const s of states.values()) {
      if (!s.done || s.kid !== kid) continue;
      if (s.date === dateStr) earnedToday += s.value;
      if (s.date >= wkStart && s.date <= dateStr) earnedWeek += s.value;
    }

    // Week tally: how many scheduled chores were due Sun → today, and how
    // many got done. As-needed chores earn money but don't count against
    // the tally — you can't miss a chore nobody asked for.
    let weekDone = 0;
    let weekTotal = 0;
    for (const d of datesFromTo(wkStart, dateStr)) {
      for (const def of mine) {
        if (!isDueOn(def.days, d)) continue;
        weekTotal++;
        if (states.get(`${d}|${def.id}`)?.done) weekDone++;
      }
    }

    return {
      kid,
      scheduled,
      asNeeded,
      doneCount: scheduled.filter((c) => c.done).length,
      totalScheduled: scheduled.length,
      earnedToday,
      earnedWeek,
      weekDone,
      weekTotal,
      balance: round2(lifetimeEarned(states, kid) + (adjSums.get(kid) || 0)),
    };
  });
}

/** Append one check-off / undo event. Value is only banked on "done". */
export async function appendChoreLog(
  dateStr: string,
  choreId: string,
  kid: string,
  done: boolean,
  value: number
): Promise<void> {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  const sheets = google.sheets({ version: "v4", auth });
  await ensureChoreTabs(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${CHORE_LOG_TAB}'!A:F`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[new Date().toISOString(), dateStr, choreId, kid, done ? "done" : "undo", done ? value : 0]],
    },
  });
}
