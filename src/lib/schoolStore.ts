import "server-only";

import { randomUUID } from "node:crypto";
import { google, type sheets_v4 } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import { SCHOOL_WEEKS, type SchoolChildKey, type SchoolWeek } from "./school";
import type { SchoolImportRecord, SchoolImportStatus } from "./schoolImportTypes";
import { normalizeSchoolWeek } from "./schoolValidation";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
export const SCHOOL_WEEKS_TAB = "School Weeks";
export const SCHOOL_WEEKS_HEADER = [
  "Imported At",
  "Import ID",
  "Message ID",
  "Child",
  "Week ID",
  "Status",
  "Subject",
  "Sender",
  "Source URL",
  "Warnings JSON",
  "Week JSON",
];

function readSheets(): sheets_v4.Sheets {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
  return google.sheets({ version: "v4", auth });
}

function writeSheets(): sheets_v4.Sheets {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  return google.sheets({ version: "v4", auth });
}

async function ensureSchoolWeeksTab(sheets: sheets_v4.Sheets): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((sheet) => sheet.properties?.title === SCHOOL_WEEKS_TAB);
  if (exists) return;

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: SCHOOL_WEEKS_TAB } } }] },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (!message.toLowerCase().includes("already exists")) throw error;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SCHOOL_WEEKS_TAB}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [SCHOOL_WEEKS_HEADER] },
  });
}

function status(value: unknown): SchoolImportStatus | null {
  return value === "draft" || value === "published" || value === "archived" ? value : null;
}

function childKey(value: unknown): SchoolChildKey | null {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "khalil" || normalized === "mekhi" ? normalized : null;
}

function parseRow(row: unknown[], index: number): SchoolImportRecord | null {
  const child = childKey(row[3]);
  const rowStatus = status(String(row[5] || "").trim().toLowerCase());
  if (!child || !rowStatus) return null;

  try {
    const week = normalizeSchoolWeek(JSON.parse(String(row[10] || "{}")), child);
    if (!week) return null;
    const warnings = JSON.parse(String(row[9] || "[]"));
    return {
      rowNumber: index + 2,
      importedAt: String(row[0] || ""),
      importId: String(row[1] || ""),
      messageId: String(row[2] || ""),
      childKey: child,
      weekId: String(row[4] || week.weekId),
      status: rowStatus,
      subject: String(row[6] || ""),
      sender: String(row[7] || ""),
      sourceUrl: String(row[8] || "") || undefined,
      warnings: Array.isArray(warnings) ? warnings.filter((item): item is string => typeof item === "string").slice(0, 12) : [],
      week,
    };
  } catch {
    return null;
  }
}

export async function getSchoolImportRecords(): Promise<SchoolImportRecord[]> {
  if (!SPREADSHEET_ID) return [];
  try {
    const response = await readSheets().spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SCHOOL_WEEKS_TAB}'!A2:K1000`,
    });
    return (response.data.values || [])
      .map((row, index) => parseRow(row, index))
      .filter((record): record is SchoolImportRecord => Boolean(record));
  } catch {
    return [];
  }
}

export async function getPublishedSchoolWeeks(): Promise<Record<SchoolChildKey, SchoolWeek>> {
  const records = await getSchoolImportRecords();
  return publishedWeeksFromRecords(records);
}

function publishedWeeksFromRecords(records: SchoolImportRecord[]): Record<SchoolChildKey, SchoolWeek> {
  const result: Record<SchoolChildKey, SchoolWeek> = { ...SCHOOL_WEEKS };
  for (const child of ["khalil", "mekhi"] as const) {
    const latest = records
      .filter((record) => record.childKey === child && record.status === "published")
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt))[0];
    if (latest) result[child] = latest.week;
  }
  return result;
}

export async function getPendingSchoolDrafts(): Promise<SchoolImportRecord[]> {
  const records = await getSchoolImportRecords();
  return pendingDraftsFromRecords(records);
}

function pendingDraftsFromRecords(records: SchoolImportRecord[]): SchoolImportRecord[] {
  return records
    .filter((record) => record.status === "draft")
    .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function getSchoolDashboardData(): Promise<{
  weeks: Record<SchoolChildKey, SchoolWeek>;
  drafts: SchoolImportRecord[];
}> {
  const records = await getSchoolImportRecords();
  return { weeks: publishedWeeksFromRecords(records), drafts: pendingDraftsFromRecords(records) };
}

export async function saveSchoolDraft(input: {
  messageId: string;
  childKey: SchoolChildKey;
  subject: string;
  sender: string;
  sourceUrl?: string;
  warnings: string[];
  week: SchoolWeek;
}): Promise<{ record: SchoolImportRecord; duplicate: boolean }> {
  if (!SPREADSHEET_ID) throw new Error("GOOGLE_SPREADSHEET_ID is not configured");
  const existing = (await getSchoolImportRecords()).find(
    (record) => record.messageId === input.messageId && record.childKey === input.childKey
  );
  if (existing) return { record: existing, duplicate: true };

  const sheets = writeSheets();
  await ensureSchoolWeeksTab(sheets);
  const importedAt = new Date().toISOString();
  const importId = randomUUID();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SCHOOL_WEEKS_TAB}'!A:K`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        importedAt,
        importId,
        input.messageId,
        input.childKey,
        input.week.weekId,
        "draft",
        input.subject,
        input.sender,
        input.sourceUrl || "",
        JSON.stringify(input.warnings.slice(0, 12)),
        JSON.stringify(input.week),
      ]],
    },
  });

  return {
    duplicate: false,
    record: {
      rowNumber: 0,
      importedAt,
      importId,
      messageId: input.messageId,
      childKey: input.childKey,
      weekId: input.week.weekId,
      status: "draft",
      subject: input.subject,
      sender: input.sender,
      sourceUrl: input.sourceUrl,
      warnings: input.warnings,
      week: input.week,
    },
  };
}

export async function setSchoolDraftStatus(importId: string, nextStatus: "published" | "archived"): Promise<void> {
  if (!SPREADSHEET_ID) throw new Error("GOOGLE_SPREADSHEET_ID is not configured");
  const records = await getSchoolImportRecords();
  const target = records.find((record) => record.importId === importId && record.status === "draft");
  if (!target) throw new Error("School update draft not found");

  const updates: { range: string; values: string[][] }[] = [];
  if (nextStatus === "published") {
    for (const record of records) {
      if (record.childKey === target.childKey && record.status === "published") {
        updates.push({ range: `'${SCHOOL_WEEKS_TAB}'!F${record.rowNumber}`, values: [["archived"]] });
      }
    }
  }
  updates.push({ range: `'${SCHOOL_WEEKS_TAB}'!F${target.rowNumber}`, values: [[nextStatus]] });

  await writeSheets().spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: "RAW", data: updates },
  });
}
