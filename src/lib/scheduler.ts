import { getWeeklyMeals, getTodaySchedule, getRawInventory } from './data';
import { google } from 'googleapis';
import path from 'path';

// Need auth to fetch calendar and write to sheets
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'google-credentials.json'),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets', // Need write access
    'https://www.googleapis.com/auth/calendar.readonly'
  ],
});

export async function generateSchedule(daysOut: number = 7) {
  try {
    // 1. Fetch the raw inventory directly
    const inventory = await getRawInventory();
    
    // Split into Quick vs Long prep
    // User's sheet says things like "Quick (<15 min)"
    const quickMeals = [...inventory.filter(m => m.prepTime.toLowerCase().includes('quick'))];
    const longMeals = [...inventory.filter(m => !m.prepTime.toLowerCase().includes('quick'))];
    
    // 2. Fetch Calendar Events for the target duration
    const calendar = google.calendar({ version: 'v3', auth });
    
    const timeMin = new Date();
    timeMin.setHours(0,0,0,0);
    const timeMax = new Date();
    timeMax.setHours(23,59,59,999);
    timeMax.setDate(timeMax.getDate() + daysOut - 1);

    const res = await calendar.events.list({
      calendarId: 'aasay412@gmail.com',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = res.data.items || [];
    
    // 3. Calculate Busyness Score per day
    const schedule = [];
    
    // Shuffle helper to add variety
    const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);
    shuffle(quickMeals);
    shuffle(longMeals);

    let quickIdx = 0;
    let longIdx = 0;

    for (let i = 0; i < daysOut; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Count events for this specific day (after 4pm)
      let busynessScore = 0;
      events.forEach(event => {
        const isAllDay = !!event.start?.date;
        const eventDateStr = isAllDay ? event.start?.date : event.start?.dateTime?.split('T')[0];
        
        if (eventDateStr === dateStr) {
          if (isAllDay) {
            busynessScore += 2; // All day events or travel make the day busy
          } else if (event.start?.dateTime) {
            const hours = new Date(event.start.dateTime).getHours();
            if (hours >= 16) busynessScore += 1; // Evening events make it busy
          }
        }
      });

      // 4. Assign meal based on busyness
      let selectedMeal;
      
      // If score is 2 or more, or if it's a weekday, prefer quick meals if we have lots of events
      if (busynessScore >= 1) {
        // High busyness -> Pick Quick meal
        if (quickMeals.length > 0) {
          selectedMeal = quickMeals[quickIdx % quickMeals.length];
          quickIdx++;
        } else if (longMeals.length > 0) {
          selectedMeal = longMeals[longIdx % longMeals.length];
          longIdx++;
        }
      } else {
        // Low busyness -> Pick Long prep meal
        if (longMeals.length > 0) {
          selectedMeal = longMeals[longIdx % longMeals.length];
          longIdx++;
        } else if (quickMeals.length > 0) {
          selectedMeal = quickMeals[quickIdx % quickMeals.length];
          quickIdx++;
        }
      }

      schedule.push({
        date: dateStr,
        mealName: selectedMeal?.name || "Free Night / Leftovers",
        type: selectedMeal?.type || "Dinner",
        prepTime: selectedMeal?.prepTime || "N/A",
        ingredients: selectedMeal?.ingredients || ""
      });
    }

    // 5. Write back to Google Sheets
    await writeScheduleToSheet(schedule);

    return schedule;
  } catch (error) {
    console.error("Scheduler Error:", error);
    throw error;
  }
}

async function writeScheduleToSheet(schedule: any[]) {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw';
  const tabName = 'Scheduled Meals';

  // 1. Check if tab exists, if not create it
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetExists = meta.data.sheets?.find(s => s.properties?.title === tabName);

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: { properties: { title: tabName } }
        }]
      }
    });
  }

  // 2. Format Data
  const values = [
    ['Date', 'Meal', 'Type', 'Prep Time', 'Ingredients'], // Header
    ...schedule.map(s => [s.date, s.mealName, s.type, s.prepTime, s.ingredients])
  ];

  // 3. Clear existing schedule and rewrite
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${tabName}'!A1:E100`
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}
