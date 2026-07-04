// ============================================================
// MEAL LOG — long-term, meal-level history for analytics
// ============================================================
// Backend-only. Nothing here runs on the dashboard render path, so the wall
// experience is untouched. Two append-only logs live in the same Google Sheet:
//
//   • "Swap Log"    — one row per swap, the moment it happens (a timestamped
//                     record of every deviation: From dish -> To dish).
//   • "Meal History"— one row per finalized (date, type): the specific dish we
//                     actually ate vs. what was planned, plus a derived category.
//
// The living plan ("Scheduled Meals") is overwritten on every Regenerate, so
// these logs are what make the record durable.

import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import { todayStr } from "./dates";

const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

const SWAP_LOG_TAB = "Swap Log";
const HISTORY_TAB = "Meal History";
const PLAN_TAB = "Scheduled Meals";

const SWAP_LOG_HEADER = ["Timestamp", "Date", "Type", "From", "To"];
const HISTORY_HEADER = ["Date", "Type", "Planned", "Actual", "Category", "Cook", "Deviated"];

// ------------------------------------------------------------
// Category — a coarse rollup ON TOP of the exact dish name. The dish name is
// always the primary record; this just enables "how many eat-outs" style counts.
// ------------------------------------------------------------
export function classifyMeal(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("leftover")) return "Leftovers";
  if (n.includes("eat out") || n.includes("eating out") || n.includes("take a break")) return "Eat Out";
  if (n.includes("takeout") || n.includes("take-out") || n.includes("delivery") || n.includes("doordash") || n.includes("uber eats")) return "Takeout";
  return "Home-cooked";
}

// ------------------------------------------------------------
// Ensure a tab exists with its header row.
// ------------------------------------------------------------
async function ensureTab(sheets: any, tabName: string, header: string[]): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets?.find((s: any) => s.properties?.title === tabName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${tabName}'!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [header] },
    });
  }
}

// ------------------------------------------------------------
// logSwap — append one row per swap. Never throws (a logging failure must not
// break the swap itself).
// ------------------------------------------------------------
export async function logSwap(dateStr: string, mealType: string, from: string, to: string): Promise<void> {
  try {
    const sheets = google.sheets({ version: "v4", auth });
    await ensureTab(sheets, SWAP_LOG_TAB, SWAP_LOG_HEADER);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SWAP_LOG_TAB}'!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[new Date().toISOString(), dateStr, mealType, from || "", to || ""]] },
    });
  } catch (e) {
    console.error("logSwap failed:", e);
  }
}

// ------------------------------------------------------------
// closeOutDays — snapshot every finalized day (date <= today, in the household
// timezone) into "Meal History". Upserts by (date, type), so re-running is safe
// and later corrections update in place instead of duplicating.
// ------------------------------------------------------------
export async function closeOutDays(): Promise<{ processed: number; added: number; updated: number }> {
  const sheets = google.sheets({ version: "v4", auth });
  const today = todayStr();

  // 1. Read the live plan (still holds past days until the next Regenerate wipes them).
  let planRows: any[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `'${PLAN_TAB}'!A2:G1000` });
    planRows = res.data.values || [];
  } catch {
    planRows = [];
  }

  const candidates = planRows
    .map((r) => ({ date: String(r[0] || "").slice(0, 10), meal: r[1] || "", type: r[2] || "Dinner", cook: r[5] || "" }))
    .filter((c) => c.date && c.meal && c.date <= today);

  if (candidates.length === 0) return { processed: 0, added: 0, updated: 0 };

  // 2. Reconstruct "Planned" from the swap log: the earliest From for a (date, type)
  //    is the originally scheduled dish. No swap → planned == actual.
  let swapRows: any[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `'${SWAP_LOG_TAB}'!A2:E5000` });
    swapRows = res.data.values || [];
  } catch {
    swapRows = [];
  }
  const firstFrom = new Map<string, string>();
  for (const s of swapRows) {
    const key = `${String(s[1] || "").slice(0, 10)}|${String(s[2] || "").toLowerCase()}`;
    if (!firstFrom.has(key) && s[3]) firstFrom.set(key, s[3]);
  }

  // 3. Read existing history to upsert against.
  await ensureTab(sheets, HISTORY_TAB, HISTORY_HEADER);
  let histRows: any[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `'${HISTORY_TAB}'!A2:G10000` });
    histRows = res.data.values || [];
  } catch {
    histRows = [];
  }
  const histIndex = new Map<string, number>();
  histRows.forEach((r, i) => histIndex.set(`${String(r[0] || "").slice(0, 10)}|${String(r[1] || "").toLowerCase()}`, i));

  const toAppend: any[][] = [];
  const updates: { range: string; values: any[][] }[] = [];
  const seen = new Set<string>();
  let added = 0;
  let updated = 0;

  for (const c of candidates) {
    const key = `${c.date}|${c.type.toLowerCase()}`;
    if (seen.has(key)) continue; // one row per (date, type) per run
    seen.add(key);

    const actual = c.meal;
    const planned = firstFrom.get(key) || actual;
    const category = classifyMeal(actual);
    const deviated = planned.trim().toLowerCase() !== actual.trim().toLowerCase() ? "Yes" : "No";
    const rowValues = [c.date, c.type, planned, actual, category, c.cook, deviated];

    if (histIndex.has(key)) {
      const idx = histIndex.get(key)!;
      const existing = histRows[idx] || [];
      const changed = (existing[2] || "") !== planned || (existing[3] || "") !== actual || (existing[4] || "") !== category;
      if (changed) {
        const sheetRow = idx + 2; // +1 header, +1 for 1-based rows
        updates.push({ range: `'${HISTORY_TAB}'!A${sheetRow}:G${sheetRow}`, values: [rowValues] });
        updated++;
      }
    } else {
      toAppend.push(rowValues);
      added++;
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data: updates },
    });
  }
  if (toAppend.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${HISTORY_TAB}'!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: toAppend },
    });
  }

  return { processed: seen.size, added, updated };
}
