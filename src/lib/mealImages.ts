// ============================================================================
// KEYWORD SMART MATCHER & IMAGE RESOLVER
// ============================================================================
// Automatically maps meal names to high-resolution, appetizing Unsplash photos
// based on intelligent keyword recognition, with fallback to deterministic hashing
// and support for custom Google Sheets image overrides.
// ============================================================================

export type MealImageInput = {
  name?: string;
  image?: string;
};

const categoryMap: { keywords: string[]; images: string[] }[] = [
  {
    // Mexican / Tacos / Burritos
    keywords: ["taco", "mexican", "burrito", "enchilada", "quesadilla", "fajita", "guacamole", "salsa", "carnitas", "barbacoa", "tortilla", "nacho", "tostada", "tamale", "churros", "elote"],
    images: [
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", // Delicious tacos
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b", // Tacos array
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828", // Tacos on plate
      "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c", // Nachos & guacamole
      "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f"  // Quesadillas
    ]
  },
  {
    // Italian / Pasta / Noodles
    keywords: ["pasta", "spaghetti", "lasagna", "alfredo", "bolognese", "ziti", "ravioli", "carbonara", "macaroni", "mac and cheese", "noodle", "penne", "rigatoni", "parmigiana", "gnocchi", "linguine", "fettuccine", "pesto", "manicotti", "tortellini"],
    images: [
      "https://midwestfoodieblog.com/wp-content/uploads/2023/08/homemade-pasta-sauce-1.jpg", // Midwest Foodie spaghetti bowl
      "https://midwestfoodieblog.com/wp-content/uploads/2023/08/homemade-pasta-sauce.jpg", // Midwest Foodie spaghetti sauce
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", // Gourmet restaurant pasta
      "https://images.unsplash.com/photo-1621996346565-e3d5d6281298", // Rigatoni tomato sauce
      "https://images.unsplash.com/photo-1546549032-9571cd6b27df", // Spaghetti
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", // Lasagna / baked ziti
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141"  // Pasta carbonara
    ]
  },
  {
    // Pizza / Calzone / Flatbread
    keywords: ["pizza", "calzone", "flatbread", "pepperoni", "margherita", "stromboli", "focaccia"],
    images: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591", // Classic pizza
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38", // Pepperoni slice
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002", // Neapolitan pizza
      "https://images.unsplash.com/photo-1590947132387-155cc02f3212"  // Flatbread pizza
    ]
  },
  {
    // Beef / Steaks / Burgers / Meatballs / Pork Chops
    keywords: ["burger", "cheeseburger", "steak", "ribeye", "sirloin", "beef", "meatball", "rib", "roast", "meatloaf", "brisket", "pork chop", "sloppy joe", "patty melt", "beef stroganoff", "prime rib", "pork"],
    images: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", // Juicy cheeseburger
      "https://images.unsplash.com/photo-1544025162-d76694265947", // Ribeye steak
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba", // Grilled steak
      "https://images.unsplash.com/photo-1558030006-450675393462", // Meatballs
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1"  // BBQ ribs / roast
    ]
  },
  {
    // Chicken / Poultry / Wings
    keywords: ["chicken", "poultry", "wing", "turkey", "schnitzel", "tender", "nugget", "hen", "drumstick", "cordon bleu", "marsala", "piccata", "cacciatore", "rotisserie", "parmesan"],
    images: [
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b", // Roast chicken
      "https://images.unsplash.com/photo-1567620832903-9fc6debc209f", // Chicken wings
      "https://images.unsplash.com/photo-1604908554025-aaa87c152c7b", // Grilled chicken breast
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec", // Crispy fried chicken
      "https://images.unsplash.com/photo-1587593810167-a84920ea0781"  // Chicken parmesan / tender
    ]
  },
  {
    // Seafood / Fish / Shrimp / Salmon
    keywords: ["fish", "salmon", "shrimp", "crab", "lobster", "tuna", "cod", "halibut", "seafood", "prawn", "clam", "chowder", "tilapia", "mahi", "scampi", "fish and chips"],
    images: [
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2", // Grilled salmon
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb", // Seafood bowl
      "https://images.unsplash.com/photo-1559742811-822873691df8", // Fish & vegetables
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47", // Garlic shrimp scampi
      "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369"  // Fresh cod / halibut dish
    ]
  },
  {
    // Asian / Stir Fry / Curry / Rice / Sushi / Ramen
    keywords: ["curry", "rice", "stir fry", "teriyaki", "sushi", "dumpling", "pad thai", "ramen", "pho", "wok", "asian", "szechuan", "kung pao", "lo mein", "bao", "edamame", "katsu", "fried rice", "bulgogi", "bibimbap", "spring roll", "noodle bowl"],
    images: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999", // Healthy bowl / salad / greens
      "https://images.unsplash.com/photo-1563245372-f21724e3856d", // Asian stir fry / noodles
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", // Ramen bowl
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c", // Sushi rolls
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0"  // Curry / biryani rice
    ]
  },
  {
    // Soups / Stews / Chili / Broth
    keywords: ["soup", "stew", "chili", "broth", "bisque", "minestrone", "gazpacho", "gumbo", "bouillon", "lentil soup", "tomato soup"],
    images: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd", // Hot bowl of soup
      "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d", // Gourmet tomato soup
      "https://images.unsplash.com/photo-1547592180-85f173990554", // Hearty stew / chili
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd"  // Veggie soup bowl
    ]
  },
  {
    // Salads / Bowls / Greens
    keywords: ["salad", "caesar", "green", "bowl", "veggie", "vegetable", "vegan", "plant", "grain bowl", "quinoa", "cobb", "caprese", "buddha bowl"],
    images: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", // Colorful salad bowl
      "https://images.unsplash.com/photo-1540420773420-3366772f4999", // Grain / veggie bowl
      "https://images.unsplash.com/photo-1505253758473-96b7015fcd40", // Caesar salad
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"  // Gourmet green salad
    ]
  },
  {
    // Breakfast / Brunch / Eggs / Pancakes
    keywords: ["pancake", "waffle", "egg", "bacon", "breakfast", "brunch", "toast", "omelet", "sausage", "hashbrown", "crepes", "cereal", "oatmeal", "benedic", "quiche", "frittata", "french toast"],
    images: [
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666", // Breakfast eggs & toast
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445", // Stack of pancakes with syrup
      "https://images.unsplash.com/photo-1525351484163-7529414344d8", // Waffles
      "https://images.unsplash.com/photo-1509722747041-616f39b57569"  // Omelet / sandwich brunch
    ]
  },
  {
    // Sandwiches / Panini / Wraps / Sliders
    keywords: ["sandwich", "panini", "wrap", "sub", "slider", "blt", "grilled cheese", "club", "gyro", "falafel", "torta", "hoagie"],
    images: [
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af", // Gourmet sandwich
      "https://images.unsplash.com/photo-1509722747041-616f39b57569", // Panini / club sandwich
      "https://images.unsplash.com/photo-1626078436890-d1a733241419", // Wrap / burrito
      "https://images.unsplash.com/photo-1550547660-d9450f859349"  // Sliders / burgers
    ]
  },
  {
    // BBQ / Grill / Smoked / Kebab
    keywords: ["bbq", "barbecue", "grill", "smoked", "pulled pork", "kebab", "skewer", "charcuterie", "roast", "cookout"],
    images: [
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", // BBQ grilled meat
      "https://images.unsplash.com/photo-1544025162-d76694265947", // Grilled steak
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba", // Skewers / kebab
      "https://images.unsplash.com/photo-1558030006-450675393462"  // Smoked ribs
    ]
  }
];

// Fallback high-end gourmet food photos for unlisted or unique meals
const fallbackGourmetImages = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  "https://images.unsplash.com/photo-1540420773420-3366772f4999",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
];

/**
 * Returns a high-quality, relevant food image URL for a given meal.
 * 1. Checks if a custom Google Sheets image URL is specified.
 * 2. Scans meal name for category keywords (taco, pasta, chicken, steak, etc.).
 * 3. Uses deterministic string hashing so the same meal name always outputs the same picture.
 */
export function getSmartMealImage(meal?: MealImageInput | null, fallbackIndex: number = 0): string {
  // 1. Check for custom override URL from Google Sheets (Column G)
  if (meal?.image && (meal.image.startsWith("http://") || meal.image.startsWith("https://"))) {
    return meal.image;
  }

  const mealName = (meal?.name || "").trim().toLowerCase();

  // If no meal scheduled or empty, return default gourmet plate
  if (!mealName || mealName === "no meal scheduled" || mealName === "eat out") {
    const defaultBase = fallbackGourmetImages[fallbackIndex % fallbackGourmetImages.length];
    return `${defaultBase}?auto=format&fit=crop&w=400&h=300&q=80`;
  }

  // 2. Scan keyword map for matching food categories
  for (const category of categoryMap) {
    if (category.keywords.some(kw => mealName.includes(kw))) {
      // Deterministically select image from this category based on string hash
      let hash = 0;
      for (let i = 0; i < mealName.length; i++) {
        hash = (hash << 5) - hash + mealName.charCodeAt(i);
        hash |= 0;
      }
      const absHash = Math.abs(hash);
      const chosenBase = category.images[absHash % category.images.length];
      return `${chosenBase}?auto=format&fit=crop&w=400&h=300&q=80`;
    }
  }

  // 3. Fallback: Deterministic selection from fallback gourmet gallery
  let hash = 0;
  for (let i = 0; i < mealName.length; i++) {
    hash = (hash << 5) - hash + mealName.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const fallbackBase = fallbackGourmetImages[(absHash + fallbackIndex) % fallbackGourmetImages.length];
  return `${fallbackBase}?auto=format&fit=crop&w=400&h=300&q=80`;
}
