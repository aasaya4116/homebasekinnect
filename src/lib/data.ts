// Mock data functions that will later be replaced by Google Sheets / Calendar API calls

export type Meal = {
  id: string;
  date: string;
  name: string;
  prepTime: string;
  cookTime: string;
  type: string;
};

export type Event = {
  id: string;
  time: string;
  title: string;
  location?: string;
  color: string;
  person: string;
};

export async function getWeeklyMeals(): Promise<Meal[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return [
    { id: "1", date: "2026-06-01", name: "Grilled Lemon Chicken", prepTime: "15m", cookTime: "25m", type: "Dinner" },
    { id: "2", date: "2026-06-02", name: "Taco Tuesday", prepTime: "20m", cookTime: "15m", type: "Dinner" },
    { id: "3", date: "2026-06-03", name: "Spaghetti & Meatballs", prepTime: "10m", cookTime: "30m", type: "Dinner" },
    { id: "4", date: "2026-06-04", name: "Leftovers", prepTime: "5m", cookTime: "5m", type: "Dinner" },
    { id: "5", date: "2026-06-05", name: "Homemade Pizza", prepTime: "30m", cookTime: "15m", type: "Dinner" },
    { id: "6", date: "2026-06-06", name: "Burgers", prepTime: "15m", cookTime: "15m", type: "Dinner" },
    { id: "7", date: "2026-06-07", name: "Roast Beef", prepTime: "20m", cookTime: "120m", type: "Dinner" },
  ];
}

export async function getTodaySchedule(): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return [
    { id: "1", time: "8:00 AM", title: "School Drop-off", color: "#10b981", person: "Kids" },
    { id: "2", time: "4:00 PM", title: "Soccer Practice", location: "Field 3", color: "#10b981", person: "Son (9)" },
    { id: "3", time: "5:30 PM", title: "Gymnastics", location: "Main Gym", color: "#8b5cf6", person: "Son (6)" },
    { id: "4", time: "7:00 PM", title: "Parents Dinner Out", color: "#f59e0b", person: "Parents" },
  ];
}
