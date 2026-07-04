"use server";

import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import { generateSchedule } from "./scheduler";
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
  cook: string = "Both",
  image: string = ""
) {
  try {
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
