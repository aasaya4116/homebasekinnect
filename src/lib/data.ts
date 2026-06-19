import { google } from 'googleapis';
import { getGoogleAuth } from './googleAuth';

export type Meal = {
  id: string;
  name: string;
  type: string;
  prepTime: string;
  ingredients?: string;
  date?: string;
  cookTime?: string;
  cook?: string;
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

const auth = getGoogleAuth([
  'https://www.googleapis.com/auth/spreadsheets.readonly', 
  'https://www.googleapis.com/auth/calendar.readonly'
]);

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';

export async function getRawInventory(): Promise<Meal[]> {
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
    const dinners = dataRows.filter(row => row[0]?.toLowerCase() === 'dinner');
    
    return dinners.map((row, idx) => ({
      id: String(idx),
      name: row[1] || "Eat Out",
      type: "Dinner",
      prepTime: row[4] || "N/A",
      ingredients: row[5] || ""
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
      range: `'Scheduled Meals'!A2:F100`, // Skip header, includes Cook column
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
    
    const timeMin = new Date();
    timeMin.setHours(0,0,0,0);
    const timeMax = new Date();
    timeMax.setHours(23,59,59,999);

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
        const hours = startDate.getHours();
        if (hours >= 16) {
          include = true;
          timeStr = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
    
    const timeMin = new Date();
    timeMin.setHours(0,0,0,0);
    const timeMax = new Date();
    timeMax.setHours(23,59,59,999);
    timeMax.setDate(timeMax.getDate() + daysOut - 1);

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
          endDateStr = event.end.date;
        }
      } else if (!isAllDay && event.start?.dateTime) {
        const startDate = new Date(event.start.dateTime);
        timeStr = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        dateStr = startDate.getFullYear() + "-" + 
                 String(startDate.getMonth() + 1).padStart(2, '0') + "-" + 
                 String(startDate.getDate()).padStart(2, '0');
        if (event.end?.dateTime) {
          const eDate = new Date(event.end.dateTime);
          endDateStr = eDate.getFullYear() + "-" + 
                 String(eDate.getMonth() + 1).padStart(2, '0') + "-" + 
                 String(eDate.getDate()).padStart(2, '0');
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
