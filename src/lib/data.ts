import { google } from 'googleapis';
import { getGoogleAuth } from './googleAuth';
import { todayStr, dayStr, zonedStartOfDay, zonedEndOfDay, zonedHourFloat, zonedTimeLabel } from './dates';

export type Meal = {
  id: string;
  name: string;
  type: string;
  prepTime: string;
  ingredients?: string;
  date?: string;
  cookTime?: string;
  cook?: string;
  image?: string;
};

export type Event = {
  id: string;
  time: string;
  title: string;
  location?: string;
  color: string;
  person: string;
  date?: string;
  endDate?: string;
};

export type GroceryItem = {
  id: string;
  category: string;
  ingredient: string;
  quantity: string;
  status: string;
  mealSource: string;
};

// A hand-planned day from the "Menu" tab — the richer, five-lane model
// (breakfast + two adult lunches + kids + dinner + cook). This tab is the
// source of truth for months planned by hand; it is NEVER touched by the
// auto-generator (which owns "Scheduled Meals"), so Regenerate can't wipe it.
export type MenuDay = {
  date: string;
  breakfast: string;
  lunchLatoya: string;
  lunchAdebowale: string;
  kids: string;
  dinner: string;
  cook: string; // raw: "Latoya" | "Adebowale" | "" (eat out / none)
};

export const MENU_TAB = "Menu";
export const MENU_HEADER = ["Date", "Breakfast", "Latoya Lunch", "Adebowale Lunch", "Kids", "Dinner", "Cook"];

// Adebowale's personal fitness meal plan — a repeating weekly template (Mon–Sun),
// five eating occasions a day, kept in its own tab and shown on its own page so it
// never crowds the shared family calendar.
export type PlanDay = {
  day: string;        // "Mon" … "Sun"
  focus: string;      // "Workout" | "Rest"
  preWorkout: string;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
};

export const PLAN_TAB = "Adebowale Plan";
export const PLAN_HEADER = ["Day", "Focus", "Pre-Workout", "Breakfast", "Lunch", "Snack", "Dinner"];

/** Normalize a Menu "Cook" value to the app's Dad/Mom coding
 *  (Latoya = Mom/emerald, Adebowale = Dad/gold). "" when nobody cooks. */
export function cookToParent(cook?: string): "Mom" | "Dad" | "" {
  const c = (cook || "").trim().toLowerCase();
  if (c.startsWith("lato") || c === "mom") return "Mom";
  if (c.startsWith("adeb") || c === "dad") return "Dad";
  return "";
}

const auth = getGoogleAuth([
  'https://www.googleapis.com/auth/spreadsheets.readonly', 
  'https://www.googleapis.com/auth/calendar.readonly'
]);

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';

export async function getRawInventory(type?: string): Promise<Meal[]> {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const firstSheetName = meta.data.sheets?.[0]?.properties?.title;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${firstSheetName}!A1:Z100`,
    });

    const rows = res.data.values || [];
    const dataRows = rows.slice(2);
    const filtered = type 
      ? dataRows.filter(row => row[0]?.toLowerCase() === type.toLowerCase())
      : dataRows.filter(row => ['dinner', 'lunch', 'breakfast'].includes(row[0]?.toLowerCase()));
    
    return filtered.map((row, idx) => ({
      id: String(idx),
      name: row[1] || "Eat Out",
      type: row[0] || "Dinner",
      prepTime: row[4] || "N/A",
      ingredients: row[5] || "",
      image: row[6] && row[6].startsWith('http') ? row[6] : undefined,
    }));
  } catch (error) {
    console.error("Failed to fetch raw inventory:", error);
    return [];
  }
}

export async function getWeeklyMeals(): Promise<Meal[]> {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = SPREADSHEET_ID;
    
    // Read from the generated "Scheduled Meals" tab (up to 100 rows for monthly view)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Scheduled Meals'!A2:G100`, // Skip header, includes Cook and Image columns
    });

    const rows = res.data.values || [];
    
    const meals = rows.map((row, idx) => ({
      id: String(idx),
      date: row[0] || "Unknown Date",
      name: row[1] || "No meal scheduled",
      type: row[2] || "Dinner",
      prepTime: row[3] || "N/A",
      cookTime: "See Sheet", 
      ingredients: row[4] || "",
      cook: row[5] || "Both",
      image: row[6] && row[6].startsWith('http') ? row[6] : undefined,
    }));

    return meals;
  } catch (error: any) {
    console.log("No schedule found or error:", error.message);
    return [];
  }
}

export async function getTodaySchedule(): Promise<Event[]> {
  try {
    const calendar = google.calendar({ version: 'v3', auth });

    const timeMin = zonedStartOfDay(todayStr());
    const timeMax = zonedEndOfDay(todayStr());

    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const items = res.data.items || [];
    const filteredEvents: Event[] = [];

    items.forEach(event => {
      const isAllDay = !!event.start?.date;
      let include = false;
      let timeStr = "All Day";

      if (isAllDay) {
        include = true;
      } else if (event.start?.dateTime) {
        const startDate = new Date(event.start.dateTime);
        // "Evening" is judged in the household's timezone, not the server's.
        if (zonedHourFloat(startDate) >= 16) {
          include = true;
          timeStr = zonedTimeLabel(startDate);
        }
      }

      if (include) {
        filteredEvents.push({
          id: event.id || String(Math.random()),
          time: timeStr,
          title: event.summary || "Busy",
          location: event.location || undefined,
          color: isAllDay ? "#f59e0b" : "#10b981",
          person: "Family",
        });
      }
    });

    return filteredEvents;
  } catch (error) {
    console.error("Failed to fetch calendar:", error);
    return [];
  }
}

export async function getFullDaySchedule(daysOut: number = 1): Promise<Event[]> {
  try {
    const calendar = google.calendar({ version: 'v3', auth });

    const timeMin = zonedStartOfDay(todayStr());
    const timeMax = zonedEndOfDay(dayStr(daysOut - 1));

    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const items = res.data.items || [];
    const events: Event[] = [];

    items.forEach(event => {
      const isAllDay = !!event.start?.date;
      let timeStr = "All Day";
      let dateStr = "";
      let endDateStr: string | undefined = undefined;

      if (isAllDay && event.start?.date) {
        dateStr = event.start.date;
        if (event.end?.date) {
          const endD = new Date(event.end.date);
          endD.setUTCDate(endD.getUTCDate() - 1);
          endDateStr = endD.toISOString().split('T')[0];
        }
      } else if (!isAllDay && event.start?.dateTime) {
        // The date portion of an RFC3339 dateTime is already the event's local
        // calendar day; use it directly rather than re-deriving in server time.
        timeStr = zonedTimeLabel(new Date(event.start.dateTime));
        dateStr = event.start.dateTime.split('T')[0];
        if (event.end?.dateTime) {
          endDateStr = event.end.dateTime.split('T')[0];
        }
      }

      // Parse person from title (e.g. "Mekhi: Golf" -> person="Mekhi", title="Golf")
      let person = "Family";
      let title = event.summary || "Busy";
      
      const match = title.match(/^([a-zA-Z]+)\s*[:-]\s*(.*)$/);
      if (match) {
        person = match[1];
        title = match[2];
      }

      events.push({
        id: event.id || String(Math.random()),
        time: timeStr,
        title: title,
        location: event.location || undefined,
        color: isAllDay ? "#f59e0b" : "#10b981",
        person: person,
        date: dateStr,
        endDate: endDateStr,
      });
    });

    return events;
  } catch (error) {
    console.error("Failed to fetch full day calendar:", error);
    return [];
  }
}

export async function getPantryStaples(): Promise<Set<string>> {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = SPREADSHEET_ID;
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Pantry Staples'!A2:A100`, // Skip header
    });

    const rows = res.data.values || [];
    const staples = new Set<string>();
    rows.forEach(row => {
      if (row[0]) staples.add(row[0].toLowerCase().trim());
    });
    
    return staples;
  } catch (error: any) {
    console.log("No Pantry Staples tab found, using defaults:", error.message);
    return new Set<string>();
  }
}

/** Read the hand-planned "Menu" tab into a date → MenuDay map. Missing tab
 *  is not an error — months without a detailed menu simply fall back to the
 *  auto-generated Scheduled Meals plan. */
export async function getMenuDetail(): Promise<Map<string, MenuDay>> {
  const map = new Map<string, MenuDay>();
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${MENU_TAB}'!A2:G400`,
    });
    const rows = res.data.values || [];
    for (const row of rows) {
      const date = String(row[0] || "").slice(0, 10);
      if (!date) continue;
      map.set(date, {
        date,
        breakfast: (row[1] || "").trim(),
        lunchLatoya: (row[2] || "").trim(),
        lunchAdebowale: (row[3] || "").trim(),
        kids: (row[4] || "").trim(),
        dinner: (row[5] || "").trim(),
        cook: (row[6] || "").trim(),
      });
    }
  } catch (error: any) {
    console.log("No Menu tab found (using generated schedule):", error.message);
  }
  return map;
}

/** Read Adebowale's weekly plan template (Mon–Sun) from its tab. Missing tab
 *  returns an empty array (page then shows an empty state). */
export async function getAdebowalePlan(): Promise<PlanDay[]> {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${PLAN_TAB}'!A2:G20`,
    });
    return (res.data.values || [])
      .filter((r) => r[0])
      .map((r) => ({
        day: String(r[0]).trim(),
        focus: (r[1] || "").trim(),
        preWorkout: (r[2] || "").trim(),
        breakfast: (r[3] || "").trim(),
        lunch: (r[4] || "").trim(),
        snack: (r[5] || "").trim(),
        dinner: (r[6] || "").trim(),
      }));
  } catch (error: any) {
    console.log("No Adebowale Plan tab found:", error.message);
    return [];
  }
}

/** Update a hand-planned day's Dinner (or Kids lunch) cell in the Menu tab.
 *  Returns true if the date was menu-managed and updated, false otherwise —
 *  letting the caller fall back to the generated Scheduled Meals path. */
export async function updateMenuMeal(dateStr: string, mealType: string, value: string): Promise<boolean> {
  try {
    const writeAuth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
    const sheets = google.sheets({ version: 'v4', auth: writeAuth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${MENU_TAB}'!A2:A400`,
    });
    const dates = res.data.values || [];
    const idx = dates.findIndex((r) => String(r[0] || "").slice(0, 10) === dateStr);
    if (idx === -1) return false; // not a menu-managed date

    const sheetRow = idx + 2; // +1 header, +1 to 1-based
    const col = mealType.trim().toLowerCase() === "lunch" ? "E" : "F"; // Kids vs Dinner
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${MENU_TAB}'!${col}${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[value]] },
    });
    return true;
  } catch (error: any) {
    console.error("updateMenuMeal failed:", error.message);
    return false;
  }
}

export async function getGroceryList(): Promise<GroceryItem[]> {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = SPREADSHEET_ID;
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Auto Grocery List'!A2:E500`, // Skip header
    });

    const rows = res.data.values || [];
    
    return rows.map((row, idx) => ({
      id: String(idx),
      category: row[0] || "Other",
      ingredient: row[1] || "",
      quantity: row[2] || "",
      status: row[3] || "To Buy",
      mealSource: row[4] || "",
    }));
  } catch (error: any) {
    console.log("No Grocery List tab found:", error.message);
    return [];
  }
}
