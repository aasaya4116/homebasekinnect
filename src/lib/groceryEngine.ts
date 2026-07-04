// ============================================================
// GROCERY ENGINE — Smart Shopping List Intelligence
// ============================================================
// Rules 7-10: Aisle Grouping, Pantry Filtering, Auto-Replenishment, Meal Source Tracking

// ============================================================
// CATEGORY MAP — Maps ingredients to grocery store aisles
// ============================================================

const CATEGORY_MAP: Record<string, string> = {
  // --- Meat & Seafood ---
  "chicken thighs": "Meat & Seafood",
  "chicken breasts": "Meat & Seafood",
  "chicken": "Meat & Seafood",
  "ground beef": "Meat & Seafood",
  "beef": "Meat & Seafood",
  "steak": "Meat & Seafood",
  "ribeye": "Meat & Seafood",
  "ny strip steak": "Meat & Seafood",
  "pork": "Meat & Seafood",
  "ground turkey": "Meat & Seafood",
  "turkey": "Meat & Seafood",
  "salmon": "Meat & Seafood",
  "cod fillets": "Meat & Seafood",
  "cod": "Meat & Seafood",
  "shrimp": "Meat & Seafood",
  "baked salmon": "Meat & Seafood",
  "chicken or steak": "Meat & Seafood",
  "ground beef or chicken": "Meat & Seafood",

  // --- Produce ---
  "lettuce": "Produce",
  "romaine lettuce": "Produce",
  "tomato": "Produce",
  "tomatoes": "Produce",
  "onion": "Produce",
  "onions": "Produce",
  "bell peppers": "Produce",
  "bell pepper": "Produce",
  "broccoli": "Produce",
  "asparagus": "Produce",
  "broccoli or asparagus": "Produce",
  "cucumber": "Produce",
  "lime": "Produce",
  "lemon": "Produce",
  "avocado": "Produce",
  "cilantro": "Produce",
  "parsley": "Produce",
  "jalapeño": "Produce",
  "scotch bonnet": "Produce",
  "ginger": "Produce",
  "corn": "Produce",
  "cauliflower rice": "Produce",
  "mushrooms": "Produce",
  "spinach": "Produce",
  "green onions": "Produce",
  "scallions": "Produce",
  "cabbage": "Produce",
  "carrots": "Produce",
  "potatoes": "Produce",
  "sweet potatoes": "Produce",
  "zucchini": "Produce",

  // --- Dairy ---
  "cheese": "Dairy",
  "sour cream": "Dairy",
  "yogurt": "Dairy",
  "yogurt marinade": "Dairy",
  "milk": "Dairy",
  "cream cheese": "Dairy",
  "heavy cream": "Dairy",
  "eggs": "Dairy",
  "guacamole": "Dairy",

  // --- Grains & Carbs ---
  "rice": "Grains & Carbs",
  "white rice": "Grains & Carbs",
  "brown rice": "Grains & Carbs",
  "pasta": "Grains & Carbs",
  "tortillas": "Grains & Carbs",
  "taco shells": "Grains & Carbs",
  "pita": "Grains & Carbs",
  "bread": "Grains & Carbs",
  "naan": "Grains & Carbs",
  "tortilla strips": "Grains & Carbs",
  "flour tortillas": "Grains & Carbs",
  "corn tortillas": "Grains & Carbs",

  // --- Canned & Jarred ---
  "black beans": "Canned & Jarred",
  "salsa": "Canned & Jarred",
  "soy sauce": "Canned & Jarred",
  "tahini": "Canned & Jarred",
  "capers": "Canned & Jarred",
  "coconut milk": "Canned & Jarred",
  "tomato sauce": "Canned & Jarred",
  "diced tomatoes": "Canned & Jarred",
  "hot sauce": "Canned & Jarred",
  "sriracha": "Canned & Jarred",
  "bbq sauce": "Canned & Jarred",
  "teriyaki sauce": "Canned & Jarred",
  "fish sauce": "Canned & Jarred",
  "sesame oil": "Canned & Jarred",

  // --- Spices & Seasonings ---
  "taco seasoning": "Spices & Seasonings",
  "fajita seasoning": "Spices & Seasonings",
  "jerk seasoning": "Spices & Seasonings",
  "shawarma spice blend": "Spices & Seasonings",
  "cumin": "Spices & Seasonings",
  "paprika": "Spices & Seasonings",
  "chili powder": "Spices & Seasonings",
  "oregano": "Spices & Seasonings",
  "thyme": "Spices & Seasonings",
  "rosemary": "Spices & Seasonings",
  "allspice": "Spices & Seasonings",
  "cayenne": "Spices & Seasonings",
  "cinnamon": "Spices & Seasonings",
  "brown sugar": "Spices & Seasonings",
  "sugar": "Spices & Seasonings",
};

// ============================================================
// DEFAULT PANTRY STAPLES — Items you always have at home
// Used as a fallback if the Google Sheets tab doesn't exist yet
// ============================================================

const DEFAULT_PANTRY_STAPLES = new Set([
  "salt",
  "pepper",
  "olive oil",
  "butter",
  "garlic",
  "cooking spray",
  "water",
  "ice",
]);

// ============================================================
// TYPES
// ============================================================

export type GroceryItem = {
  ingredient: string;
  category: string;
  quantity: string;
  status: "To Buy" | "Restock" | "Have";
  mealSources: string[];
};

export type StructuredGroceryList = {
  items: GroceryItem[];
  categories: string[];
  totalItems: number;
  filteredStaples: string[];
};

// ============================================================
// INGREDIENT PARSER
// Splits "2 lbs chicken thighs" → { quantity: "2 lbs", name: "chicken thighs" }
// ============================================================

const QUANTITY_PATTERN = /^(\d+[\d./\s]*(lbs?|oz|cups?|tbsp|tsp|cans?|cloves?|bunch|head|pkg|bag|jar|bottle|dozen|pint|quart|gallon|sticks?|slices?|pieces?|fillets?)?\.?\s*)/i;

export function parseIngredient(raw: string): { quantity: string; name: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(QUANTITY_PATTERN);
  
  if (match && match[1]) {
    return {
      quantity: match[1].trim(),
      name: trimmed.slice(match[1].length).trim(),
    };
  }
  
  return { quantity: "", name: trimmed };
}

// ============================================================
// CATEGORY LOOKUP
// Fuzzy matches an ingredient name to a grocery aisle
// ============================================================

export function getCategory(ingredientName: string): string {
  const lower = ingredientName.toLowerCase().trim();
  
  // Direct match
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  
  // Partial match — check if any key is contained in the ingredient
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return category;
    }
  }
  
  return "Other";
}

// ============================================================
// BUILD GROCERY LIST (Main Function)
// Rules 7-10 all execute here
// ============================================================

export function buildGroceryList(
  schedule: any[],
  pantryStaples: Set<string>,
  previousSchedule: any[] = [],
  today: string = "" // YYYY-MM-DD in the household timezone; gates Rule 9
): StructuredGroceryList {
  
  const itemMap = new Map<string, GroceryItem>();
  const filteredStaples: string[] = [];
  
  // Merge default staples with user-managed staples from Google Sheets
  const allStaples = new Set([...DEFAULT_PANTRY_STAPLES, ...pantryStaples]);

  // --- Process current week's schedule ---
  schedule.forEach(day => {
    if (!day.ingredients || day.ingredients === "Leftovers" || day.ingredients === "") return;
    
    const rawItems = day.ingredients.split(',').map((i: string) => i.trim()).filter(Boolean);
    
    rawItems.forEach((raw: string) => {
      const { quantity, name } = parseIngredient(raw);
      const normalizedName = name.toLowerCase().trim();
      
      // Rule 8: Pantry Staples Filter
      if (allStaples.has(normalizedName)) {
        if (!filteredStaples.includes(name)) {
          filteredStaples.push(name);
        }
        return; // Skip — you already have this at home
      }
      
      // Rule 7: Aisle Grouping
      const category = getCategory(normalizedName);
      
      const key = normalizedName;
      
      if (itemMap.has(key)) {
        // Deduplicate — merge quantities and add meal source
        const existing = itemMap.get(key)!;
        if (quantity && !existing.quantity.includes(quantity)) {
          existing.quantity = existing.quantity ? `${existing.quantity} + ${quantity}` : quantity;
        }
        // Rule 10: Meal Source Tracking
        if (!existing.mealSources.includes(day.name)) {
          existing.mealSources.push(day.name);
        }
      } else {
        itemMap.set(key, {
          ingredient: name,
          category,
          quantity,
          status: "To Buy",
          mealSources: [day.name],
        });
      }
    });
  });
  
  // --- Rule 9: Auto-Replenishment from previous week ---
  previousSchedule.forEach(day => {
    if (!day.ingredients || day.ingredients === "Leftovers" || day.ingredients === "") return;

    // Only meals whose date is strictly before today count as "cooked". Compare
    // as YYYY-MM-DD strings so it doesn't depend on the server's timezone.
    // (If `today` wasn't supplied, skip replenishment rather than guess.)
    if (!day.date || !today || day.date.slice(0, 10) >= today) return;
    
    const rawItems = day.ingredients.split(',').map((i: string) => i.trim()).filter(Boolean);
    
    rawItems.forEach((raw: string) => {
      const { quantity, name } = parseIngredient(raw);
      const normalizedName = name.toLowerCase().trim();
      
      // Skip pantry staples
      if (allStaples.has(normalizedName)) return;
      
      const key = normalizedName;
      
      // Only add as "Restock" if it's NOT already in this week's list
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          ingredient: name,
          category: getCategory(normalizedName),
          quantity,
          status: "Restock",
          mealSources: [`Prev: ${day.name}`],
        });
      }
    });
  });
  
  // --- Sort by category, then alphabetically within category ---
  const categoryOrder = [
    "Produce",
    "Meat & Seafood",
    "Dairy",
    "Grains & Carbs",
    "Canned & Jarred",
    "Spices & Seasonings",
    "Frozen",
    "Other",
  ];
  
  const items = Array.from(itemMap.values()).sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    const orderA = catA === -1 ? 999 : catA;
    const orderB = catB === -1 ? 999 : catB;
    
    if (orderA !== orderB) return orderA - orderB;
    return a.ingredient.localeCompare(b.ingredient);
  });
  
  const categories = [...new Set(items.map(i => i.category))];
  
  return {
    items,
    categories,
    totalItems: items.length,
    filteredStaples,
  };
}
