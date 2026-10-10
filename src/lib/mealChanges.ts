import { google } from "googleapis";

import { cookForDate } from "./cadence";
import { updateMenuMeal } from "./data";
import { todayStr } from "./dates";
import { getGoogleAuth } from "./googleAuth";
import { recordMealFeedback } from "./mealLearning";
import { logSwap } from "./mealLog";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID ||
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
  "1692O1jGvFv-aB00Xy7jU1kH_X0a0eB_E9nL2Q1b1O8c";

export type MealChangeInput = {
  date: string;
  mealType: string;
  name: string;
  prepTime?: string;
  ingredients?: string;
  image?: string;
  reason?: string;
};

export type MealChangeResult = {
  previousMeal: string;
  actualMeal: string;
  cook: string;
  source: "Menu" | "Scheduled Meals";
};

/**
 * Persist an already-authorized meal change and record it for recommendation
 * learning. Authentication stays at the caller so the web action can use the
 * family cookie while native routes use a Supabase bearer token.
 */
export async function changeMeal({
  date,
  mealType,
  name,
  prepTime = "N/A",
  ingredients = "",
  image = "",
  reason = "",
}: MealChangeInput): Promise<MealChangeResult> {
  const menuUpdate = await updateMenuMeal(date, mealType, name);
  if (menuUpdate.updated) {
    await logSwap(date, mealType, menuUpdate.previousMeal, name);
    try {
      await recordMealFeedback({
        date,
        type: mealType,
        action: "swap",
        planned: menuUpdate.previousMeal,
        previous: menuUpdate.previousMeal,
        actual: name,
        reason,
        source: "Menu",
        status: date <= todayStr() ? "Confirmed" : "Planned",
        cook: menuUpdate.cook,
      });
    } catch (feedbackError) {
      console.error("Menu meal changed, but feedback logging failed:", feedbackError);
    }
    return {
      previousMeal: menuUpdate.previousMeal,
      actualMeal: name,
      cook: menuUpdate.cook,
      source: "Menu",
    };
  }

  const cook = cookForDate(date);
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  const sheets = google.sheets({ version: "v4", auth });
  const tabName = "Scheduled Meals";
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tabName}'!A1:G100`,
  });

  const rows = res.data.values || [];
  let foundIndex = -1;
  let previousMeal = "";

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const rowDate = String(row[0] || "").trim();
    const rowType = String(row[2] || "Dinner").trim().toLowerCase();
    let sameDate = false;
    try {
      const parsedRowDate = new Date(rowDate.replace(/-/g, "/"));
      const parsedTarget = new Date(date.trim().replace(/-/g, "/"));
      sameDate = !Number.isNaN(parsedRowDate.getTime()) && !Number.isNaN(parsedTarget.getTime())
        ? parsedRowDate.getFullYear() === parsedTarget.getFullYear() &&
          parsedRowDate.getMonth() === parsedTarget.getMonth() &&
          parsedRowDate.getDate() === parsedTarget.getDate()
        : rowDate === date.trim();
    } catch {
      sameDate = rowDate === date.trim();
    }

    if (sameDate && rowType === mealType.trim().toLowerCase()) {
      foundIndex = index + 1;
      previousMeal = String(row[1] || "");
      break;
    }
  }

  if (foundIndex !== -1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${tabName}'!B${foundIndex}:G${foundIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, mealType, prepTime, ingredients, cook, image]],
      },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${tabName}'!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date, name, mealType, prepTime, ingredients, cook, image]],
      },
    });
  }

  await logSwap(date, mealType, previousMeal, name);
  try {
    await recordMealFeedback({
      date,
      type: mealType,
      action: "swap",
      planned: previousMeal || name,
      previous: previousMeal,
      actual: name,
      reason,
      source: "Scheduled Meals",
      status: date <= todayStr() ? "Confirmed" : "Planned",
      cook,
    });
  } catch (feedbackError) {
    console.error("Meal changed, but feedback logging failed:", feedbackError);
  }

  return {
    previousMeal,
    actualMeal: name,
    cook,
    source: "Scheduled Meals",
  };
}
