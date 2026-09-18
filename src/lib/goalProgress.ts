import "server-only";

import { google, type sheets_v4 } from "googleapis";
import { getGoogleAuth } from "./googleAuth";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

export const GOAL_PROGRESS_TAB = "Goal Progress";
export const GOAL_PROGRESS_HEADER = ["Timestamp", "Goal ID", "Person", "Value"];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function ensureGoalProgressTab(sheets: sheets_v4.Sheets): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some(
    (sheet) => sheet.properties?.title === GOAL_PROGRESS_TAB
  );
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: GOAL_PROGRESS_TAB } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${GOAL_PROGRESS_TAB}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [GOAL_PROGRESS_HEADER] },
  });
}

/** The log is append-only; the most recent value for each goal is current. */
export async function getGoalProgress(): Promise<Record<string, number>> {
  if (!SPREADSHEET_ID) return {};

  try {
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${GOAL_PROGRESS_TAB}'!A2:D10000`,
    });

    const progress: Record<string, number> = {};
    for (const row of response.data.values || []) {
      const goalId = String(row[1] || "").trim();
      const value = Number(row[3]);
      if (goalId && Number.isFinite(value)) progress[goalId] = Math.max(0, value);
    }
    return progress;
  } catch (error: unknown) {
    console.log("No Goal Progress tab found:", errorMessage(error));
    return {};
  }
}

export async function appendGoalProgress(
  goalId: string,
  person: string,
  value: number
): Promise<void> {
  if (!SPREADSHEET_ID) throw new Error("GOOGLE_SPREADSHEET_ID is not configured");

  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  const sheets = google.sheets({ version: "v4", auth });
  await ensureGoalProgressTab(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${GOAL_PROGRESS_TAB}'!A:D`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[new Date().toISOString(), goalId, person, value]] },
  });
}
