import { getWeeklyMeals, getTodaySchedule, getRawInventory, getPantryStaples, Meal } from './data';
import { buildGroceryList } from './groceryEngine';
import { google } from 'googleapis';
import { getGoogleAuth } from './googleAuth';

const auth = getGoogleAuth([
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.readonly'
]);

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';

// ============================================================
// COOK CADENCE — Who cooks which days
// ============================================================
// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
function getCookForDay(dayOfWeek: number): string {
  if (dayOfWeek === 1 || dayOfWeek === 2) return "Dad";       // Mon, Tue
  if (dayOfWeek >= 3 && dayOfWeek <= 5) return "Mom";         // Wed, Thu, Fri
  return "Both";                                               // Sat, Sun
}

// ============================================================
// MAIN SCHEDULER — Now generates 30 days by default
// ============================================================
export async function generateSchedule(daysOut: number = 30) {
  try {
    // 1. Fetch the raw inventory directly
    const inventory = await getRawInventory();
    
    // Filter out "Eat Out" from the cooking pool
    const cookableMeals = inventory.filter(m => m.name.toLowerCase() !== 'eat out');
    
    // Split into Quick vs Long prep
    const quickMeals = [...cookableMeals.filter(m => m.prepTime.toLowerCase().includes('quick'))];
    const longMeals = [...cookableMeals.filter(m => !m.prepTime.toLowerCase().includes('quick'))];
    
    // 2. Fetch existing schedule to preserve already-cooked meals (Option B)
    let existingSchedule: Meal[] = [];
    try {
      const sheets = google.sheets({ version: 'v4', auth });
      const existingRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'Scheduled Meals'!A2:F100`,
      });
      const rows = existingRes.data.values || [];
      existingSchedule = rows.map((row, idx) => ({
        id: String(idx),
        date: row[0] || "",
        name: row[1] || "",
        type: row[2] || "",
        prepTime: row[3] || "",
        ingredients: row[4] || "",
        cook: row[5] || "",
      }));
    } catch {
      // No existing schedule, that's fine
    }

    // 3. Fetch Calendar Events for the target duration
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

    const events = res.data.items || [];
    
    // 4. Build the schedule
    const schedule: Meal[] = [];
    
    // Shuffle helper to add variety
    const shuffle = (array: Meal[]) => array.sort(() => Math.random() - 0.5);
    shuffle(quickMeals);
    shuffle(longMeals);

    let quickIdx = 0;
    let longIdx = 0;
    let hasEatenOutThisWeek = false;
    let lastProtein = "";
    let weekTracker = -1; // Track which week we're in for the Eat Out reset

    // RULE 11: No-Repeat Meals in a Month
    const usedMeals = new Set<string>();

    const proteinKeywords = ["chicken", "beef", "pork", "fish", "shrimp", "turkey", "tofu", "salmon", "cod", "steak"];

    for (let i = 0; i < daysOut; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const dayOfWeek = targetDate.getDay(); // 0=Sun, 1=Mon, etc.

      // Calculate which week we're in (for resetting hasEatenOutThisWeek)
      const currentWeek = Math.floor(i / 7);
      if (currentWeek !== weekTracker) {
        weekTracker = currentWeek;
        hasEatenOutThisWeek = false;
        // Re-shuffle at the start of each week for variety
        if (currentWeek > 0) {
          shuffle(quickMeals);
          shuffle(longMeals);
        }
      }

      // OPTION B: Check if this day already has a meal in the existing schedule
      const existingMeal = existingSchedule.find(m => {
        if (!m.date) return false;
        const normalizedDate = m.date.replace(/-/g, '/');
        const mDate = new Date(normalizedDate);
        return mDate.getDate() === targetDate.getDate() && mDate.getMonth() === targetDate.getMonth();
      });

      if (existingMeal) {
        // Preserve the existing meal — it was already scheduled/cooked
        schedule.push(existingMeal);
        // Track it in usedMeals so we don't repeat it
        if (existingMeal.name && !existingMeal.name.includes('Leftovers') && !existingMeal.name.includes('Eat Out')) {
          usedMeals.add(existingMeal.name.toLowerCase());
        }
        // Track protein
        const ingStr = existingMeal.ingredients?.toLowerCase() || "";
        lastProtein = proteinKeywords.find(p => ingStr.includes(p)) || "unknown";
        continue;
      }

      // Assign cook based on day cadence
      const cook = getCookForDay(dayOfWeek);

      // RULE 2: Leftover Efficiency
      const yesterday = schedule[i - 1];
      if (yesterday && yesterday.prepTime && yesterday.prepTime.toLowerCase().includes('long')) {
        schedule.push({
          id: String(i),
          date: dateStr,
          name: "Leftovers from " + yesterday.name,
          type: "Dinner",
          prepTime: "0 min (Microwave)",
          ingredients: "Leftovers",
          cook: cook
        });
        continue;
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

            if (hours >= 16) busynessScore += 1;

            // RULE 3: Prime Time Conflict
            if (timeVal >= 16.0 && timeVal <= 18.5) {
              hasPrimeTimeConflict = true;
            }
          }
        }
      });

      // RULE 1: Take a Break
      if ((dayOfWeek === 5 && !hasEatenOutThisWeek) || busynessScore >= 3) {
        schedule.push({
          id: String(i),
          date: dateStr,
          name: "Take a Break / Eat Out",
          type: "Dinner",
          prepTime: "0 min",
          ingredients: "",
          cook: cook
        });
        hasEatenOutThisWeek = true;
        continue;
      }

      // 5. Assign meal based on busyness and rules
      let selectedMeal = null;

      const preferQuick = busynessScore >= 1 || hasPrimeTimeConflict;
      const primaryBucket = preferQuick ? quickMeals : longMeals;
      const backupBucket = preferQuick ? longMeals : quickMeals;

      // Helper: pick a meal with RULE 4 (Protein Variety) + RULE 11 (No Repeats)
      const pickMeal = (bucket: Meal[], startIdx: number) => {
        if (bucket.length === 0) return null;
        
        for (let j = 0; j < bucket.length; j++) {
          const meal = bucket[(startIdx + j) % bucket.length];
          const mealNameLower = meal.name.toLowerCase();
          
          // RULE 11: Skip if already used this month
          if (usedMeals.has(mealNameLower)) continue;
          
          // RULE 4: Protein Variety
          const ingredientsStr = meal.ingredients?.toLowerCase() || "";
          const mealProtein = proteinKeywords.find(p => ingredientsStr.includes(p)) || "unknown";
          
          if (mealProtein !== lastProtein || mealProtein === "unknown") {
            return meal;
          }
        }
        
        // Fallback: If all meals are used (Rule 11 exhausted), reset and pick any
        if (usedMeals.size >= cookableMeals.length) {
          console.log(`Rule 11: All ${cookableMeals.length} meals used. Resetting rotation.`);
          usedMeals.clear();
          // Try again after reset
          for (let j = 0; j < bucket.length; j++) {
            const meal = bucket[(startIdx + j) % bucket.length];
            const ingredientsStr = meal.ingredients?.toLowerCase() || "";
            const mealProtein = proteinKeywords.find(p => ingredientsStr.includes(p)) || "unknown";
            if (mealProtein !== lastProtein || mealProtein === "unknown") {
              return meal;
            }
          }
        }
        
        return bucket[startIdx % bucket.length]; // Ultimate fallback
      };

      if (primaryBucket.length > 0) {
        selectedMeal = pickMeal(primaryBucket, preferQuick ? quickIdx : longIdx);
        if (preferQuick) quickIdx++; else longIdx++;
      }
      if (!selectedMeal && backupBucket.length > 0) {
        selectedMeal = pickMeal(backupBucket, preferQuick ? longIdx : quickIdx);
        if (preferQuick) longIdx++; else quickIdx++;
      }

      // Track protein and used meals
      if (selectedMeal) {
        const ingredientsStr = selectedMeal.ingredients?.toLowerCase() || "";
        lastProtein = proteinKeywords.find(p => ingredientsStr.includes(p)) || "unknown";
        usedMeals.add(selectedMeal.name.toLowerCase());
      } else {
        lastProtein = "unknown";
      }

      schedule.push({
        id: String(i),
        date: dateStr,
        name: selectedMeal?.name || "Free Night / Scrounge",
        type: selectedMeal?.type || "Dinner",
        prepTime: selectedMeal?.prepTime || "N/A",
        ingredients: selectedMeal?.ingredients || "",
        cook: cook
      });
    }

    console.log(`Scheduled ${schedule.length} days. Used ${usedMeals.size}/${cookableMeals.length} unique meals.`);

    // 6. Write back to Google Sheets
    await writeScheduleToSheet(schedule);
    await writeGroceryListToSheet(schedule);

    return schedule;
  } catch (error) {
    console.error("Scheduler Error:", error);
    throw error;
  }
}

async function writeScheduleToSheet(schedule: Meal[]) {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = SPREADSHEET_ID;
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

    // 2. Format Data — now includes Cook column
    const values = [
      ['Date', 'Meal', 'Type', 'Prep Time', 'Ingredients', 'Cook'], // Header
      ...schedule.map(s => [s.date, s.name, s.type, s.prepTime, s.ingredients, s.cook])
    ];

    // 3. Clear existing schedule and rewrite
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${tabName}'!A1:F100`
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
  } catch (error) {
    console.error("Failed to write schedule to sheet:", error);
  }
}

async function writeGroceryListToSheet(schedule: Meal[]) {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = SPREADSHEET_ID;
    const tabName = 'Auto Grocery List';

    // 1. Fetch pantry staples from Google Sheets (Rule 8)
    const pantryStaples = await getPantryStaples();

    // 2. Fetch previous schedule for auto-replenishment (Rule 9)
    let previousSchedule: Meal[] = [];
    try {
      const prevRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'Scheduled Meals'!A2:F100`,
      });
    const prevRows = prevRes.data.values || [];
    previousSchedule = prevRows.map((row, idx) => ({
      id: String(idx),
      date: row[0] || "",
      name: row[1] || "",
      type: row[2] || "",
      prepTime: row[3] || "",
      ingredients: row[4] || "",
    }));
  } catch {
    // No previous schedule exists
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
    ['Category', 'Ingredient', 'Qty', 'Status', 'Meal Source'],
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
  } catch (error) {
    console.error("Failed to write grocery list to sheet:", error);
  }
}
