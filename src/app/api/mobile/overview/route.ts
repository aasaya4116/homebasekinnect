import { cookForDate } from "@/lib/cadence";
import { getChoreBoards } from "@/lib/chores";
import { cookToParent, getFullDaySchedule, getMenuDetail, getRawInventory, getWeeklyMeals } from "@/lib/data";
import { dayParts, dayStr } from "@/lib/dates";
import { getSmartMealImage } from "@/lib/mealImages";
import { privateJson, requireMobileUser } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (auth.response) return auth.response;

  const daysCount = 7;
  const [allMeals, menuDetail, events, chores, inventory] = await Promise.all([
    getWeeklyMeals(),
    getMenuDetail(),
    getFullDaySchedule(daysCount),
    getChoreBoards(dayStr(0)),
    getRawInventory(),
  ]);

  const days = Array.from({ length: daysCount }, (_, index) => {
    const date = dayStr(index);
    const parts = dayParts(date);
    const generatedMeals = allMeals.filter(
      (meal) => meal.date && meal.date !== "Unknown Date" && meal.date.slice(0, 10) === date
    );
    const menu = menuDetail.get(date);
    const lunch = menu
      ? menu.kids
        ? { name: menu.kids, prepTime: "" }
        : null
      : generatedMeals.find((meal) => (meal.type || "").toLowerCase() === "lunch") || null;
    const dinner = menu
      ? menu.dinner
        ? { name: menu.dinner, prepTime: "" }
        : null
      : generatedMeals.find((meal) => (meal.type || "Dinner").toLowerCase() === "dinner") || null;
    const cook = (menu && cookToParent(menu.cook)) || cookForDate(date);
    const dayEvents = events
      .filter((event) => {
        const start = event.date || "";
        const end = event.endDate || event.date || "";
        return start && start <= date && date <= end;
      })
      .sort((a, b) => Number(a.time !== "All Day") - Number(b.time !== "All Day"));

    return {
      date,
      dayName: parts.weekdayShort,
      month: parts.monthShort,
      dayNumber: parts.dayNum,
      isToday: index === 0,
      lunch,
      dinner: dinner
        ? { ...dinner, image: getSmartMealImage(dinner, index) }
        : null,
      cook,
      events: dayEvents,
    };
  });

  const seenMealNames = new Set<string>();
  const mealOptions = inventory.filter((meal) => {
    const key = meal.name.trim().toLowerCase();
    if (!key || seenMealNames.has(key)) return false;
    seenMealNames.add(key);
    return true;
  });

  return privateJson({ generatedAt: new Date().toISOString(), today: dayStr(0), days, chores, mealOptions });
}
