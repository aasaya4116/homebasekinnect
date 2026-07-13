"use server";

import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import { generateSchedule } from "./scheduler";
import { cookForDate } from "./cadence";
import { logSwap } from "./mealLog";
import { appendChoreLog } from "./chores";
import { todayStr } from "./dates";
import { revalidatePath } from "next/cache";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "1692O1jGvFv-aB00Xy7jU1kH_X0a0eB_E9nL2Q1b1O8c";

/** Regenerate the rolling month of meals, then refresh the dashboard.
 *  Returns void so it can be used directly as a <form action>. */
export async function regenerateAction(): Promise<void> {
  try {
    await generateSchedule(30);
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/monthly");
    revalidatePath("/groceries");
  } catch (error: any) {
    console.error("Failed to regenerate schedule:", error);
  }
}

export async function swapMealAction(
  dateStr: string,
  mealType: string,
  newMealName: string,
  prepTime: string = "N/A",
  ingredients: string = "",
  image: string = ""
) {
  try {
    // The cadence decides who cooks — a swap changes the dish, not the cook.
    const cook = cookForDate(dateStr);
    const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
    const sheets = google.sheets({ version: "v4", auth });

    const tabName = "Scheduled Meals";

    // Fetch existing schedule
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${tabName}'!A1:G100`,
    });

    const rows = res.data.values || [];
    let foundIndex = -1;
    let previousMeal = ""; // the dish being replaced — captured for the swap log

    // Search for matching date and meal type (1-indexed in Sheets)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rDate = (row[0] || "").trim();
      const rType = (row[2] || "Dinner").trim().toLowerCase();
      
      let isSameDate = false;
      try {
        const parsedRDate = new Date(rDate.replace(/-/g, '/'));
        const parsedTarget = new Date(dateStr.trim().replace(/-/g, '/'));
        if (!isNaN(parsedRDate.getTime()) && !isNaN(parsedTarget.getTime())) {
          isSameDate = parsedRDate.getFullYear() === parsedTarget.getFullYear() &&
                       parsedRDate.getMonth() === parsedTarget.getMonth() &&
                       parsedRDate.getDate() === parsedTarget.getDate();
        } else {
          isSameDate = rDate === dateStr.trim();
        }
      } catch {
        isSameDate = rDate === dateStr.trim();
      }

      if (isSameDate && rType === mealType.trim().toLowerCase()) {
        foundIndex = i + 1; // 1-indexed sheet row number
        previousMeal = row[1] || "";
        break;
      }
    }

    if (foundIndex !== -1) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${tabName}'!B${foundIndex}:G${foundIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[newMealName, mealType, prepTime, ingredients, cook, image]],
        },
      });
    } else {
      // Append new row if date/type didn't exist
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${tabName}'!A:G`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[dateStr, newMealName, mealType, prepTime, ingredients, cook, image]],
        },
      });
    }

    // Record the deviation for long-term analytics (never blocks the swap).
    await logSwap(dateStr, mealType, previousMeal, newMealName);

    // Invalidate Next.js cache so dashboard updates immediately
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/monthly");
    revalidatePath("/groceries");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to swap meal:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/** Kid taps a chore on the kiosk — check off (done=true) or undo (done=false).
 *  Always logged against today in the household timezone; past days stay
 *  immutable from the wall. */
export async function toggleChoreAction(
  choreId: string,
  kid: string,
  done: boolean,
  value: number
) {
  try {
    await appendChoreLog(todayStr(), choreId, kid, done, value);

    revalidatePath("/chores");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle chore:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
