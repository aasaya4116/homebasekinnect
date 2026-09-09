import "server-only";

import { google, type sheets_v4 } from "googleapis";
import { getGoogleAuth } from "./googleAuth";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

export const SCHOOL_TASK_LOG_TAB = "School Task Log";
export const SCHOOL_TASK_LOG_HEADER = ["Timestamp", "Task ID", "Child", "Week", "Action"];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function ensureSchoolTaskLogTab(sheets: sheets_v4.Sheets): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some(
    (sheet) => sheet.properties?.title === SCHOOL_TASK_LOG_TAB
  );

  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: SCHOOL_TASK_LOG_TAB } } }],
    },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SCHOOL_TASK_LOG_TAB}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [SCHOOL_TASK_LOG_HEADER] },
  });
}

/** Final completion state for every task. The log is append-only; the most
 * recent done/undo row for a task wins. A missing tab means nothing has been
 * checked off yet and is intentionally treated as an empty state. */
export async function getCompletedSchoolTaskIds(): Promise<string[]> {
  if (!SPREADSHEET_ID) return [];

  try {
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SCHOOL_TASK_LOG_TAB}'!A2:E10000`,
    });

    const states = new Map<string, boolean>();
    for (const row of response.data.values || []) {
      const taskId = String(row[1] || "").trim();
      const action = String(row[4] || "").trim().toLowerCase();
      if (!taskId || (action !== "done" && action !== "undo")) continue;
      states.set(taskId, action === "done");
    }

    return [...states.entries()]
      .filter(([, done]) => done)
      .map(([taskId]) => taskId);
  } catch (error: unknown) {
    console.log("No School Task Log tab found:", errorMessage(error));
    return [];
  }
}

/** Append a completion or undo event. The School Task Log tab is created on
 * the first check-off, matching Homebase's existing chore-log behavior. */
export async function appendSchoolTaskLog(
  taskId: string,
  child: string,
  weekId: string,
  done: boolean
): Promise<void> {
  if (!SPREADSHEET_ID) throw new Error("GOOGLE_SPREADSHEET_ID is not configured");

  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  const sheets = google.sheets({ version: "v4", auth });
  await ensureSchoolTaskLogTab(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SCHOOL_TASK_LOG_TAB}'!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[new Date().toISOString(), taskId, child, weekId, done ? "done" : "undo"]],
    },
  });
}
