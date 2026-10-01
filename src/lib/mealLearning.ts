import { google, sheets_v4 } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import { todayStr } from "./dates";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const FEEDBACK_TAB = "Meal Feedback";
const OUTCOMES_TAB = "Meal Outcomes";
const ALIASES_TAB = "Meal Aliases";

export const MEAL_FEEDBACK_HEADER = [
  "Timestamp",
  "Date",
  "Type",
  "Action",
  "Planned",
  "Previous",
  "Actual",
  "Reason",
  "Source",
  "Status",
  "Cook",
];

export const MEAL_OUTCOMES_HEADER = [
  "Date",
  "Type",
  "Planned",
  "Actual",
  "Category",
  "Cook",
  "Deviated",
  "Status",
  "Reason",
  "Confirmed At",
  "Source",
  "Recipe Key",
];

export const MEAL_ALIASES_HEADER = ["Alias", "Canonical", "Recipe Key"];

export const MEAL_REASON_LABELS = {
  busy: "Too busy",
  "missing-ingredients": "Missing ingredients",
  preference: "Wanted something else",
  leftovers: "Use leftovers",
  "ate-out": "Ate out",
  "schedule-change": "Schedule changed",
  other: "Other",
  "": "Not provided",
} as const;

export type MealReason = keyof typeof MEAL_REASON_LABELS;
export type MealFeedbackAction = "swap" | "confirm";
export type MealFeedbackStatus = "Planned" | "Confirmed";

export type MealFeedbackInput = {
  date: string;
  type: string;
  action: MealFeedbackAction;
  planned: string;
  previous: string;
  actual: string;
  reason?: string;
  source: "Menu" | "Scheduled Meals";
  status: MealFeedbackStatus;
  cook?: string;
};

export type MealOutcome = {
  date: string;
  type: string;
  planned: string;
  actual: string;
  category: string;
  cook: string;
  deviated: boolean;
  status: "Confirmed" | "Assumed" | "Legacy";
  reason: string;
  confirmedAt: string;
  source: string;
  recipeKey: string;
};

const SEEDED_ALIASES = [
  ["Tacos (home)", "Tacos", "tacos"],
  ["Chipotle @Home", "Chipotle at Home", "chipotle-at-home"],
  ["Take a Break / Eat Out", "Eat Out", "eat-out"],
];

function clean(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function canonicalMealName(value: string): string {
  const cleaned = clean(value);
  const normalized = cleaned.toLowerCase();
  if (!cleaned) return "";
  if (normalized === "tacos (home)") return "Tacos";
  if (normalized === "chipotle @home" || normalized === "chipotle at home") return "Chipotle at Home";
  if (normalized === "take a break / eat out" || normalized === "eat out / takeout") return "Eat Out";
  return cleaned;
}

export function mealKey(value: string): string {
  return canonicalMealName(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown-meal";
}

export function classifyMeal(value: string): string {
  const name = canonicalMealName(value).toLowerCase();
  if (name.includes("leftover")) return "Leftovers";
  if (name === "eat out" || name.includes("eating out") || name.includes("restaurant")) return "Eat Out";
  if (name.includes("takeout") || name.includes("take-out") || name.includes("delivery") || name.includes("doordash") || name.includes("uber eats")) return "Takeout";
  return "Home-cooked";
}

function outcomeKey(date: string, type: string): string {
  return `${date.slice(0, 10)}|${type.toLowerCase()}`;
}

async function ensureTab(
  sheets: sheets_v4.Sheets,
  tabName: string,
  header: string[],
  seedRows: string[][] = []
): Promise<void> {
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === tabName);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tabName}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [header, ...seedRows] },
  });
}

async function readOptionalTab(
  sheets: sheets_v4.Sheets,
  range: string
): Promise<string[][]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return (response.data.values || []) as string[][];
  } catch {
    return [];
  }
}

export async function ensureMealLearningTabs(sheets?: sheets_v4.Sheets): Promise<sheets_v4.Sheets> {
  const client = sheets || google.sheets({
    version: "v4",
    auth: getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]),
  });
  await ensureTab(client, FEEDBACK_TAB, MEAL_FEEDBACK_HEADER);
  await ensureTab(client, OUTCOMES_TAB, MEAL_OUTCOMES_HEADER);
  await ensureTab(client, ALIASES_TAB, MEAL_ALIASES_HEADER, SEEDED_ALIASES);
  return client;
}

async function getAliasMap(sheets: sheets_v4.Sheets): Promise<Map<string, string>> {
  const rows = await readOptionalTab(sheets, `'${ALIASES_TAB}'!A2:C1000`);
  const aliases = new Map<string, string>();
  for (const row of rows) {
    const alias = canonicalMealName(row[0] || "").toLowerCase();
    const canonical = canonicalMealName(row[1] || "");
    if (alias && canonical) aliases.set(alias, canonical);
  }
  return aliases;
}

function canonicalWithAliases(value: string, aliases: Map<string, string>): string {
  const base = canonicalMealName(value);
  return aliases.get(base.toLowerCase()) || base;
}

function rowToOutcome(row: string[]): MealOutcome | null {
  const date = clean(row[0]).slice(0, 10);
  const type = clean(row[1]) || "Dinner";
  const planned = canonicalMealName(row[2] || "");
  const actual = canonicalMealName(row[3] || "");
  if (!date || !actual) return null;
  const statusValue = clean(row[7]);
  const status: MealOutcome["status"] = statusValue === "Confirmed"
    ? "Confirmed"
    : statusValue === "Assumed"
      ? "Assumed"
      : "Legacy";
  return {
    date,
    type,
    planned: planned || actual,
    actual,
    category: clean(row[4]) || classifyMeal(actual),
    cook: clean(row[5]),
    deviated: clean(row[6]).toLowerCase() === "yes",
    status,
    reason: clean(row[8]),
    confirmedAt: clean(row[9]),
    source: clean(row[10]),
    recipeKey: clean(row[11]) || mealKey(actual),
  };
}

function outcomeToRow(outcome: MealOutcome): string[] {
  return [
    outcome.date,
    outcome.type,
    outcome.planned,
    outcome.actual,
    outcome.category,
    outcome.cook,
    outcome.deviated ? "Yes" : "No",
    outcome.status,
    outcome.reason,
    outcome.confirmedAt,
    outcome.source,
    outcome.recipeKey,
  ];
}

async function upsertOutcomes(
  sheets: sheets_v4.Sheets,
  outcomes: MealOutcome[]
): Promise<{ added: number; updated: number }> {
  const existingRows = await readOptionalTab(sheets, `'${OUTCOMES_TAB}'!A2:L10000`);
  const existingIndex = new Map<string, number>();
  existingRows.forEach((row, index) => existingIndex.set(outcomeKey(row[0] || "", row[1] || "Dinner"), index));

  const updates: { range: string; values: string[][] }[] = [];
  const appends: string[][] = [];
  for (const outcome of outcomes) {
    const key = outcomeKey(outcome.date, outcome.type);
    const row = outcomeToRow(outcome);
    const index = existingIndex.get(key);
    if (index === undefined) {
      appends.push(row);
      continue;
    }
    if (JSON.stringify(existingRows[index] || []) !== JSON.stringify(row)) {
      const sheetRow = index + 2;
      updates.push({ range: `'${OUTCOMES_TAB}'!A${sheetRow}:L${sheetRow}`, values: [row] });
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data: updates },
    });
  }
  if (appends.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${OUTCOMES_TAB}'!A:L`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: appends },
    });
  }
  return { added: appends.length, updated: updates.length };
}

export async function recordMealFeedback(input: MealFeedbackInput): Promise<void> {
  const sheets = await ensureMealLearningTabs();
  const aliases = await getAliasMap(sheets);
  const existingFeedback = await readOptionalTab(sheets, `'${FEEDBACK_TAB}'!A2:K5000`);
  const key = outcomeKey(input.date, input.type);
  const priorForMeal = existingFeedback.filter((row) => outcomeKey(row[1] || "", row[2] || "Dinner") === key);
  const originalPlanned = priorForMeal.find((row) => clean(row[4]))?.[4] || input.planned || input.previous || input.actual;
  const planned = canonicalWithAliases(originalPlanned, aliases);
  const previous = canonicalWithAliases(input.previous, aliases);
  const actual = canonicalWithAliases(input.actual, aliases);
  const reason = MEAL_REASON_LABELS[input.reason as MealReason] || clean(input.reason);
  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${FEEDBACK_TAB}'!A:K`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        timestamp,
        input.date.slice(0, 10),
        input.type || "Dinner",
        input.action,
        planned,
        previous,
        actual,
        reason,
        input.source,
        input.status,
        clean(input.cook),
      ]],
    },
  });

  if (input.status === "Confirmed") {
    await upsertOutcomes(sheets, [{
      date: input.date.slice(0, 10),
      type: input.type || "Dinner",
      planned,
      actual,
      category: classifyMeal(actual),
      cook: clean(input.cook),
      deviated: mealKey(planned) !== mealKey(actual),
      status: "Confirmed",
      reason,
      confirmedAt: timestamp,
      source: input.source,
      recipeKey: mealKey(actual),
    }]);
  }
}

export async function syncMealOutcomes(): Promise<{ processed: number; added: number; updated: number }> {
  const sheets = await ensureMealLearningTabs();
  const aliases = await getAliasMap(sheets);
  const today = todayStr();
  const outcomes = new Map<string, MealOutcome>();

  const legacyRows = await readOptionalTab(sheets, "'Meal History'!A2:G10000");
  for (const row of legacyRows) {
    const date = clean(row[0]).slice(0, 10);
    const type = clean(row[1]) || "Dinner";
    if (!date || date >= today) continue;
    const planned = canonicalWithAliases(row[2] || row[3] || "", aliases);
    const actual = canonicalWithAliases(row[3] || row[2] || "", aliases);
    if (!actual) continue;
    outcomes.set(outcomeKey(date, type), {
      date,
      type,
      planned: planned || actual,
      actual,
      category: clean(row[4]) || classifyMeal(actual),
      cook: clean(row[5]),
      deviated: mealKey(planned || actual) !== mealKey(actual),
      status: "Legacy",
      reason: "",
      confirmedAt: "",
      source: "Scheduled Meals",
      recipeKey: mealKey(actual),
    });
  }

  const scheduledRows = await readOptionalTab(sheets, "'Scheduled Meals'!A2:G1000");
  for (const row of scheduledRows) {
    const date = clean(row[0]).slice(0, 10);
    const type = clean(row[2]) || "Dinner";
    const actual = canonicalWithAliases(row[1] || "", aliases);
    const key = outcomeKey(date, type);
    if (!date || date >= today || !actual || outcomes.has(key)) continue;
    outcomes.set(key, {
      date,
      type,
      planned: actual,
      actual,
      category: classifyMeal(actual),
      cook: clean(row[5]),
      deviated: false,
      status: "Assumed",
      reason: "",
      confirmedAt: "",
      source: "Scheduled Meals",
      recipeKey: mealKey(actual),
    });
  }

  const menuRows = await readOptionalTab(sheets, "'Menu'!A2:G1000");
  for (const row of menuRows) {
    const date = clean(row[0]).slice(0, 10);
    if (!date || date >= today) continue;
    const menuMeals = [
      { type: "Lunch", name: row[4] || "" },
      { type: "Dinner", name: row[5] || "" },
    ];
    for (const menuMeal of menuMeals) {
      const actual = canonicalWithAliases(menuMeal.name, aliases);
      if (!actual) continue;
      const key = outcomeKey(date, menuMeal.type);
      outcomes.set(key, {
        date,
        type: menuMeal.type,
        planned: actual,
        actual,
        category: classifyMeal(actual),
        cook: clean(row[6]),
        deviated: false,
        status: "Assumed",
        reason: "",
        confirmedAt: "",
        source: "Menu",
        recipeKey: mealKey(actual),
      });
    }
  }

  const feedbackRows = await readOptionalTab(sheets, `'${FEEDBACK_TAB}'!A2:K5000`);
  const feedbackByMeal = new Map<string, string[][]>();
  for (const row of feedbackRows) {
    const date = clean(row[1]).slice(0, 10);
    const type = clean(row[2]) || "Dinner";
    if (!date || date >= today) continue;
    const key = outcomeKey(date, type);
    const group = feedbackByMeal.get(key) || [];
    group.push(row);
    feedbackByMeal.set(key, group);
  }

  for (const [key, events] of feedbackByMeal) {
    const ordered = [...events].sort((a, b) => clean(a[0]).localeCompare(clean(b[0])));
    const first = ordered[0];
    const latest = ordered.at(-1)!;
    const date = clean(first[1]).slice(0, 10);
    const type = clean(first[2]) || "Dinner";
    const planned = canonicalWithAliases(first[4] || first[5] || first[6] || "", aliases);
    const actual = canonicalWithAliases(latest[6] || latest[5] || planned, aliases);
    const confirmedEvent = [...ordered].reverse().find((row) => clean(row[9]) === "Confirmed");
    const previous = outcomes.get(key);
    outcomes.set(key, {
      date,
      type,
      planned: planned || actual,
      actual,
      category: classifyMeal(actual),
      cook: clean(latest[10]) || previous?.cook || "",
      deviated: mealKey(planned || actual) !== mealKey(actual),
      status: confirmedEvent ? "Confirmed" : "Assumed",
      reason: clean(latest[7]),
      confirmedAt: confirmedEvent ? clean(confirmedEvent[0]) : "",
      source: clean(latest[8]) || previous?.source || "Scheduled Meals",
      recipeKey: mealKey(actual),
    });
  }

  const result = await upsertOutcomes(sheets, [...outcomes.values()]);
  return { processed: outcomes.size, ...result };
}

export async function getMealOutcomes(sync = false): Promise<MealOutcome[]> {
  if (sync) await syncMealOutcomes();
  const sheets = await ensureMealLearningTabs();
  const rows = await readOptionalTab(sheets, `'${OUTCOMES_TAB}'!A2:L10000`);
  return rows.map(rowToOutcome).filter((row): row is MealOutcome => row !== null);
}
