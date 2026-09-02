import "server-only";

import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import {
  CHESS_PLAYERS,
  emptyChessSnapshot,
  emptyMastery,
  emptyPlayerProgress,
  type ChessLearningSnapshot,
  type ChessPlayerProgress,
  type ChessSessionInput,
  type ChessSkill,
} from "./chessShared";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const PROGRESS_TAB = "Chess Progress";
const SESSIONS_TAB = "Chess Sessions";
const PROGRESS_HEADER = [
  "Player",
  "Total XP",
  "Completed Quests",
  "Current Streak",
  "Last Practice",
  "Knight Mastery",
  "Rook Mastery",
  "Bishop Mastery",
  "Fork Mastery",
  "Fundamentals Mastery",
  "Total Sessions",
];
const SESSIONS_HEADER = [
  "Timestamp",
  "Date",
  "Player",
  "Quest",
  "Skill",
  "Score",
  "Out Of",
  "Attempts",
  "XP Earned",
];
const SKILLS: ChessSkill[] = ["Knight", "Rook", "Bishop", "Fork", "Fundamentals"];

function numberCell(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseProgressRow(row: string[]): ChessPlayerProgress {
  return {
    xp: numberCell(row[1]),
    completed: String(row[2] || "").split(",").map((item) => item.trim()).filter(Boolean),
    streak: numberCell(row[3]),
    lastPractice: String(row[4] || ""),
    mastery: {
      Knight: numberCell(row[5]),
      Rook: numberCell(row[6]),
      Bishop: numberCell(row[7]),
      Fork: numberCell(row[8]),
      Fundamentals: numberCell(row[9]),
    },
    totalSessions: numberCell(row[10]),
  };
}

function startOfWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

function previousDay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

async function ensureChessTabs() {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  const sheets = google.sheets({ version: "v4", auth });
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const titles = new Set((metadata.data.sheets || []).map((sheet) => sheet.properties?.title || ""));
  const missing = [PROGRESS_TAB, SESSIONS_TAB].filter((title) => !titles.has(title));

  if (missing.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `'${PROGRESS_TAB}'!A1:K1`, values: [PROGRESS_HEADER] },
        { range: `'${SESSIONS_TAB}'!A1:I1`, values: [SESSIONS_HEADER] },
      ],
    },
  });

  return sheets;
}

export async function getChessLearningSnapshot(today: string): Promise<ChessLearningSnapshot> {
  const snapshot = emptyChessSnapshot();
  if (!SPREADSHEET_ID) return snapshot;

  try {
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"]);
    const sheets = google.sheets({ version: "v4", auth });
    const result = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`'${PROGRESS_TAB}'!A2:K100`, `'${SESSIONS_TAB}'!B2:I2000`],
    });
    const progressRows = (result.data.valueRanges?.[0]?.values || []) as string[][];
    const sessionRows = (result.data.valueRanges?.[1]?.values || []) as string[][];

    for (const row of progressRows) {
      const player = String(row[0] || "");
      if (CHESS_PLAYERS.includes(player as (typeof CHESS_PLAYERS)[number])) {
        snapshot.players[player] = parseProgressRow(row);
      }
    }

    const weekStart = startOfWeek(today);
    for (const row of sessionRows) {
      const sessionDate = String(row[0] || "");
      if (sessionDate >= weekStart && sessionDate <= today) {
        snapshot.weeklySessions += 1;
        snapshot.weeklyXp += numberCell(row[7]);
      }
    }
  } catch (error) {
    console.log("Chess learning tabs not available yet:", error instanceof Error ? error.message : "Unknown error");
  }

  return snapshot;
}

export async function recordChessSession(input: ChessSessionInput): Promise<ChessLearningSnapshot> {
  if (!SPREADSHEET_ID) throw new Error("GOOGLE_SPREADSHEET_ID is not configured");
  if (!CHESS_PLAYERS.includes(input.player)) throw new Error("Unknown chess player");
  if (!SKILLS.includes(input.skill)) throw new Error("Unknown chess skill");

  const sheets = await ensureChessTabs();
  const progressResult = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${PROGRESS_TAB}'!A2:K100`,
  });
  const rows = (progressResult.data.values || []) as string[][];
  const rowIndex = rows.findIndex((row) => String(row[0] || "") === input.player);
  const existing = rowIndex >= 0 ? parseProgressRow(rows[rowIndex]) : emptyPlayerProgress();
  const mastery = { ...emptyMastery(), ...existing.mastery };
  const sessionPercent = Math.round((Math.max(0, input.score) / Math.max(1, input.maxScore)) * 100);
  const previousMastery = mastery[input.skill];
  mastery[input.skill] = previousMastery === 0
    ? sessionPercent
    : Math.round(previousMastery * 0.65 + sessionPercent * 0.35);

  const streak = existing.lastPractice === input.practicedOn
    ? existing.streak
    : existing.lastPractice === previousDay(input.practicedOn)
      ? existing.streak + 1
      : 1;
  const updated: ChessPlayerProgress = {
    xp: Math.max(existing.xp, input.totalXp),
    completed: Array.from(new Set([...existing.completed, ...input.completedQuests])),
    streak,
    lastPractice: input.practicedOn,
    mastery,
    totalSessions: existing.totalSessions + 1,
  };
  const progressRow = [
    input.player,
    updated.xp,
    updated.completed.join(", "),
    updated.streak,
    updated.lastPractice,
    ...SKILLS.map((skill) => updated.mastery[skill]),
    updated.totalSessions,
  ];

  if (rowIndex >= 0) {
    const sheetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${PROGRESS_TAB}'!A${sheetRow}:K${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [progressRow] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${PROGRESS_TAB}'!A:K`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [progressRow] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SESSIONS_TAB}'!A:I`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        new Date().toISOString(),
        input.practicedOn,
        input.player,
        input.questId,
        input.skill,
        Math.max(0, input.score),
        Math.max(1, input.maxScore),
        Math.max(1, input.attempts),
        Math.max(0, input.xpEarned),
      ]],
    },
  });

  return getChessLearningSnapshot(input.practicedOn);
}
