import { getWeeklyMeals, getTodaySchedule, getRawInventory, getPantryStaples } from './data';
import { buildGroceryList } from './groceryEngine';
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
    let hasEatenOutThisWeek = false;
    let lastProtein = "";

    const proteinKeywords = ["chicken", "beef", "pork", "fish", "shrimp", "turkey", "tofu"];

    for (let i = 0; i < daysOut; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const dayOfWeek = targetDate.getDay(); // 0 is Sun, 1 is Mon, etc.

      // RULE 2: Leftover Efficiency
      // If yesterday's meal was a "Long" prep meal (like a crockpot or roast), today is Leftovers.
      const yesterday = schedule[i - 1];
      if (yesterday && yesterday.prepTime && yesterday.prepTime.toLowerCase().includes('long')) {
        schedule.push({
          date: dateStr,
          mealName: "Leftovers from " + yesterday.mealName,
          type: "Dinner",
          prepTime: "0 min (Microwave)",
          ingredients: "Leftovers"
        });
        continue; // Skip the rest of the logic for today
      }

      // Count events and evaluate Prime Time Conflicts
      let busynessScore = 0;
      let hasPrimeTimeConflict = false;

      events.forEach(event => {
        const isAllDay = !!event.start?.date;
        const eventDateStr = isAllDay ? event.start?.date : event.start?.dateTime?.split('T')[0];
        
        if (eventDateStr === dateStr) {
          if (isAllDay) {
            busynessScore += 2; 
          } else if (event.start?.dateTime) {
            const startDate = new Date(event.start.dateTime);
            const hours = startDate.getHours();
            const minutes = startDate.getMinutes();
            const timeVal = hours + (minutes / 60);

            if (hours >= 16) busynessScore += 1; // Evening events make it busy

            // RULE 3: Prime Time Conflict
            // If event is between 4:00 PM (16.0) and 6:30 PM (18.5)
            if (timeVal >= 16.0 && timeVal <= 18.5) {
              hasPrimeTimeConflict = true;
            }
          }
        }
      });

      // RULE 1: Take a Break
      // Ensure at least 1 Eat Out night M-F. If it's Friday (5) and we haven't eaten out yet, force it.
      // Or if the day is insanely busy (Score >= 3), force an Eat Out.
      if ((dayOfWeek === 5 && !hasEatenOutThisWeek) || busynessScore >= 3) {
        schedule.push({
          date: dateStr,
          mealName: "Take a Break / Eat Out",
          type: "Dinner",
          prepTime: "0 min",
          ingredients: ""
        });
        hasEatenOutThisWeek = true;
        continue;
      }

      // 4. Assign meal based on busyness and rules
      let selectedMeal = null;
      let attempts = 0;

      // Decide which bucket to pick from
      const preferQuick = busynessScore >= 1 || hasPrimeTimeConflict;
      const primaryBucket = preferQuick ? quickMeals : longMeals;
      const backupBucket = preferQuick ? longMeals : quickMeals;

      // Helper to pick a meal with RULE 4: Protein Variety
      const pickMealWithVariety = (bucket: any[], startIdx: number) => {
        if (bucket.length === 0) return null;
        for (let j = 0; j < bucket.length; j++) {
          const meal = bucket[(startIdx + j) % bucket.length];
          const ingredientsStr = meal.ingredients?.toLowerCase() || "";
          const mealProtein = proteinKeywords.find(p => ingredientsStr.includes(p)) || "unknown";
          
          if (mealProtein !== lastProtein || mealProtein === "unknown") {
            return meal; // Found a meal with a different protein!
          }
        }
        return bucket[startIdx % bucket.length]; // Fallback if all meals have the same protein
      };

      if (primaryBucket.length > 0) {
        selectedMeal = pickMealWithVariety(primaryBucket, preferQuick ? quickIdx : longIdx);
        if (preferQuick) quickIdx++; else longIdx++;
      } else if (backupBucket.length > 0) {
        selectedMeal = pickMealWithVariety(backupBucket, preferQuick ? longIdx : quickIdx);
        if (preferQuick) longIdx++; else quickIdx++;
      }

      // Track protein for tomorrow
      if (selectedMeal) {
        const ingredientsStr = selectedMeal.ingredients?.toLowerCase() || "";
        lastProtein = proteinKeywords.find(p => ingredientsStr.includes(p)) || "unknown";
      } else {
        lastProtein = "unknown";
      }

      schedule.push({
        date: dateStr,
        mealName: selectedMeal?.name || "Free Night / Scrounge",
        type: selectedMeal?.type || "Dinner",
        prepTime: selectedMeal?.prepTime || "N/A",
        ingredients: selectedMeal?.ingredients || ""
      });
    }

    // 5. Write back to Google Sheets
    await writeScheduleToSheet(schedule);
    await writeGroceryListToSheet(schedule);

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

async function writeGroceryListToSheet(schedule: any[]) {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw';
  const tabName = 'Auto Grocery List';

  // 1. Fetch pantry staples from Google Sheets (Rule 8)
  const pantryStaples = await getPantryStaples();

  // 2. Fetch previous week's schedule for auto-replenishment (Rule 9)
  let previousSchedule: any[] = [];
  try {
    const prevRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Scheduled Meals'!A2:E15`,
    });
    const prevRows = prevRes.data.values || [];
    previousSchedule = prevRows.map(row => ({
      date: row[0] || "",
      mealName: row[1] || "",
      type: row[2] || "",
      prepTime: row[3] || "",
      ingredients: row[4] || "",
    }));
  } catch {
    // No previous schedule exists, that's fine
  }

  // 3. Run the Grocery Engine (Rules 7-10)
  const groceryList = buildGroceryList(schedule, pantryStaples, previousSchedule);

  console.log(`Grocery Engine: ${groceryList.totalItems} items across ${groceryList.categories.length} aisles`);
  console.log(`Filtered ${groceryList.filteredStaples.length} pantry staples: ${groceryList.filteredStaples.join(', ')}`);

  // 4. Check if tab exists, if not create it
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

  // 5. Format Data with enhanced columns
  const values = [
    ['Category', 'Ingredient', 'Qty', 'Status', 'Meal Source'], // Header
    ...groceryList.items.map(item => [
      item.category,
      item.ingredient,
      item.quantity,
      item.status,
      item.mealSources.join(', '),
    ])
  ];

  // 6. Clear existing list and rewrite
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${tabName}'!A1:E500`
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}

