import { getWeeklyMeals, getTodaySchedule, getGroceryList } from "@/lib/data";
import { generateSchedule } from "@/lib/scheduler";
import { revalidatePath } from "next/cache";
import { Calendar as CalendarIcon, Clock as ClockIcon, Flame, Utensils, Zap, ShoppingCart, RefreshCw, User, ArrowRight } from "lucide-react";
import Clock from "@/components/Clock";
import Weather from "@/components/Weather";

const dayColors = [
  "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#06b6d4",
];

// Cook badge styles
function getCookBadge(cook: string) {
  if (cook === "Dad") return { bg: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9", label: "Dad" };
  if (cook === "Mom") return { bg: "rgba(236, 72, 153, 0.15)", color: "#ec4899", label: "Mom" };
  return { bg: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", label: "Both" };
}

// Map meal names to high-quality Unsplash stock image URLs matching keywords
function getMealImage(mealName: string): string {
  if (!mealName) return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=150&h=150&q=80";
  const name = mealName.toLowerCase();
  
  let id = "photo-1498837167922-ddd27525d352"; // Fallback generic food
  
  if (name.includes("pizza")) id = "photo-1513104890138-7c749659a591";
  else if (name.includes("burger") || name.includes("hamburger") || name.includes("sliders")) id = "photo-1568901346375-23c9450c58cd";
  else if (name.includes("pasta") || name.includes("spaghetti") || name.includes("noodle") || name.includes("lasagna") || name.includes("alfredo") || name.includes("macaroni") || name.includes("mac & cheese") || name.includes("ravioli") || name.includes("penne")) id = "photo-1473093295043-cdd812d0e601";
  else if (name.includes("salad") || name.includes("greens") || name.includes("caesar")) id = "photo-1512621776951-a57141f2eefd";
  else if (name.includes("taco") || name.includes("burrito") || name.includes("quesadilla") || name.includes("fajita") || name.includes("enchilada") || name.includes("mexican") || name.includes("nacho")) id = "photo-1565299585323-38d6b0865b47";
  else if (name.includes("chicken") || name.includes("wings") || name.includes("poultry") || name.includes("curry chicken") || name.includes("breast")) id = "photo-1598514982205-f36b96d1e8d4";
  else if (name.includes("salmon") || name.includes("fish") || name.includes("trout") || name.includes("seafood") || name.includes("tuna") || name.includes("shrimp") || name.includes("prawn") || name.includes("crab") || name.includes("lobster")) id = "photo-1467003909585-2f8a72700288";
  else if (name.includes("steak") || name.includes("beef") || name.includes("ribeye") || name.includes("sirloin") || name.includes("pot roast") || name.includes("meatball") || name.includes("meatloaf")) id = "photo-1546833999-b9f581a1996d";
  else if (name.includes("soup") || name.includes("stew") || name.includes("ramen") || name.includes("chowder") || name.includes("chili")) id = "photo-1547592165-e1d17fed6005";
  else if (name.includes("curry") || name.includes("tikka") || name.includes("masala")) id = "photo-1631515243349-e0cb75fb8d3a";
  else if (name.includes("sushi")) id = "photo-1579871494447-9811cf80d66c";
  else if (name.includes("rice") || name.includes("fried rice") || name.includes("stir fry") || name.includes("stir-fry") || name.includes("bowl")) id = "photo-1512058564366-18510be2db19";
  else if (name.includes("sandwich") || name.includes("sub") || name.includes("panini") || name.includes("wrap") || name.includes("gyro") || name.includes("blt")) id = "photo-1528735602780-2552fd46c7af";
  else if (name.includes("egg") || name.includes("omelette") || name.includes("frittata") || name.includes("quiche")) id = "photo-1533089860892-a7c6f0a88666";
  else if (name.includes("pork") || name.includes("ham") || name.includes("bacon") || name.includes("ribs") || name.includes("chop")) id = "photo-1432139555190-58524dae6a55";
  else if (name.includes("bbq") || name.includes("barbeque") || name.includes("grill") || name.includes("pulled pork")) id = "photo-1529193591184-b1d58069ecdd";
  else if (name.includes("hotdog") || name.includes("hot dog") || name.includes("bratwurst")) id = "photo-1573080496219-bb080dd4f877";
  else if (name.includes("waffle") || name.includes("pancake") || name.includes("french toast")) id = "photo-1528207776546-365bb710ee93";
  else if (name.includes("potato") || name.includes("fries") || name.includes("tater") || name.includes("baked potato")) id = "photo-1573080496219-bb080dd4f877";
  else if (name.includes("cheese") || name.includes("fondue")) id = "photo-1486299267070-83823f5448dd";
  else if (name.includes("veggie") || name.includes("vegetable") || name.includes("tofu") || name.includes("vegan") || name.includes("vegetarian")) id = "photo-1512621776951-a57141f2eefd";
  else if (name.includes("dessert") || name.includes("cake") || name.includes("pie") || name.includes("cookie") || name.includes("ice cream") || name.includes("sweet")) id = "photo-1587314168485-3236d6710814";
  else if (name.includes("bread") || name.includes("toast") || name.includes("garlic bread")) id = "photo-1509440159596-0249088772ff";

  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=250&h=250&q=80`;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string; cook?: string }> }) {
  const params = await searchParams;
  const view = params.view || "week";
  const cookFilter = params.cook || "all";

  const allMeals = await getWeeklyMeals();
  const schedule = await getTodaySchedule();
  const groceryItems = await getGroceryList();

  // Build day array — 7 for week, 30 for month
  const daysCount = view === "month" ? 30 : 7;

  const days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

    const meal = allMeals.find(m => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, '/');
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === d.getDate() && mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear();
    }) || null;

    return {
      dayNameShort, dayNum, monthShort, meal,
      color: dayColors[i % dayColors.length],
      cook: meal?.cook || "Both",
      isToday: i === 0,
    };
  });

  // Apply cook filter
  const filteredDays = cookFilter === "all" 
    ? days 
    : days.filter(d => d.cook.toLowerCase() === cookFilter.toLowerCase());

  const todaysMeal = days[0].meal;
  const tomorrowsMeal = days.length > 1 ? days[1].meal : null;

  // Grocery summary
  const toBuyCount = groceryItems.filter(i => i.status === "To Buy").length;
  const restockCount = groceryItems.filter(i => i.status === "Restock").length;
  const groceryCategories = [...new Set(groceryItems.map(i => i.category))];

  async function handleGenerate() {
    "use server";
    await generateSchedule(30);
    revalidatePath("/");
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 80px)' }}>

      {/* ========================================
          ROW 1: CLOCK BAR (slim)
          ======================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Clock />
          <Weather />
        </div>
        <form action={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="submit" className="btn-primary" style={{ fontSize: '0.7rem', padding: '8px 14px', opacity: 0.6 }}>
            <CalendarIcon size={12} style={{ marginRight: '5px' }}/>
            Regenerate
          </button>
        </form>
      </div>

      {/* ========================================
          ROW 2: HERO ROW — Dinner (60%) + Side Panels (40%)
          ======================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '0.75rem', flex: '0 0 auto' }}>

        {/* LEFT: Tonight's Dinner — HERO */}
        <div className="widget" style={{ padding: 0, overflow: 'hidden' }}>
          {todaysMeal && todaysMeal.name !== 'No meal scheduled' ? (
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, height: '100%' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="widget-badge" style={{ background: 'var(--accent-orange-glow)', color: 'var(--accent-orange)' }}>
                    🍽️ TONIGHT'S DINNER
                  </span>
                  {todaysMeal.cook && (
                    <span className="widget-badge" style={{ background: getCookBadge(todaysMeal.cook).bg, color: getCookBadge(todaysMeal.cook).color }}>
                      <User size={10} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '3px' }}/> 
                      {getCookBadge(todaysMeal.cook).label}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.75rem 0', lineHeight: 1.15, fontWeight: 700 }}>
                  {todaysMeal.name}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <span className="dinner-meta-chip">
                    <ClockIcon size={13} color="var(--accent-blue)"/> {todaysMeal.prepTime}
                  </span>
                  <span className="dinner-meta-chip">
                    <Flame size={13} color="var(--accent-orange)"/> {todaysMeal.type}
                  </span>
                </div>

                {/* Tomorrow Preview */}
                {tomorrowsMeal && tomorrowsMeal.name !== 'No meal scheduled' && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: '8px 12px', borderRadius: '10px',
                    background: 'var(--bg-panel-hover)', 
                    border: '1px solid var(--border-color)',
                    marginTop: 'auto',
                  }}>
                    <ArrowRight size={12} color="var(--text-tertiary)"/>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      Tomorrow:
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {tomorrowsMeal.name}
                    </span>
                    <span className="widget-badge" style={{ 
                      background: getCookBadge(tomorrowsMeal.cook).bg, 
                      color: getCookBadge(tomorrowsMeal.cook).color,
                      fontSize: '0.55rem', padding: '2px 6px',
                    }}>
                      {getCookBadge(tomorrowsMeal.cook).label}
                    </span>
                  </div>
                )}
              </div>
              <img 
                src={getMealImage(todaysMeal.name)} 
                alt={todaysMeal.name} 
                style={{ 
                  width: '180px', 
                  height: '180px', 
                  borderRadius: '12px', 
                  objectFit: 'cover', 
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}
              />
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: '200px' }}>
              <Utensils size={40} />
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>No Meal Scheduled</span>
              <span style={{ fontSize: '0.75rem' }}>Click Regenerate to generate your month</span>
            </div>
          )}
        </div>

        {/* RIGHT: Stacked side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Tonight's Schedule */}
          <div className="widget" style={{ flex: 1 }}>
            <div className="widget-header">
              <div className="widget-title">
                <CalendarIcon size={13} color="var(--accent-blue)"/>
                Tonight's Schedule
              </div>
              <span className="widget-badge" style={{ background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)' }}>
                {schedule.length} Event{schedule.length !== 1 ? 's' : ''}
              </span>
            </div>
            {schedule.length > 0 ? (
              <div>
                {schedule.slice(0, 3).map((event, i) => (
                  <div key={i} className="event-row">
                    <div className="event-dot" style={{ backgroundColor: event.color, boxShadow: `0 0 8px ${event.color}40` }} />
                    <div>
                      <div className="event-title">{event.title}</div>
                      <div className="event-time"><ClockIcon size={11}/> {event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No evening events tonight</div>
            )}
          </div>

          {/* Grocery Summary */}
          <div className="widget" style={{ flex: 1 }}>
            <div className="widget-header">
              <div className="widget-title">
                <ShoppingCart size={13} color="var(--accent-green)"/>
                Grocery List
              </div>
              <span className="widget-badge" style={{ background: 'var(--accent-green-glow)', color: 'var(--accent-green)' }}>
                {toBuyCount + restockCount} Items
              </span>
            </div>
            {groceryItems.length > 0 ? (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.5rem' }}>
                  {groceryCategories.slice(0, 5).map(cat => (
                    <span key={cat} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '3px 8px', borderRadius: '8px', background: 'var(--bg-panel-hover)', color: 'var(--text-secondary)' }}>
                      {cat} ({groceryItems.filter(i => i.category === cat).length})
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>{toBuyCount} to buy</span>
                  {restockCount > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={11}/> {restockCount} restock
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>Schedule meals to generate your list</div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================
          ROW 3: WEEK AHEAD (fills remaining space)
          ======================================== */}
      <div className="widget" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header with toggles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, marginBottom: '0.75rem' }}>
          <div className="widget-title">
            <Zap size={13} color="var(--accent-green)"/>
            {view === "month" ? "The Month Ahead" : "The Week Ahead"}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Cook Filter */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-panel-hover)', borderRadius: '8px', padding: '2px' }}>
              {[
                { key: "all", label: "All" },
                { key: "dad", label: "Dad", color: "#0ea5e9" },
                { key: "mom", label: "Mom", color: "#ec4899" },
              ].map(opt => (
                <a key={opt.key} href={`/?view=${view}&cook=${opt.key}`} style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                  textDecoration: 'none',
                  background: cookFilter === opt.key ? (opt.color || 'var(--accent-blue)') : 'transparent',
                  color: cookFilter === opt.key ? '#fff' : 'var(--text-tertiary)',
                  transition: 'all 0.2s',
                }}>
                  {opt.label}
                </a>
              ))}
            </div>

            {/* View Toggle */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-panel-hover)', borderRadius: '8px', padding: '2px' }}>
              <a href={`/?view=week&cook=${cookFilter}`} style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                textDecoration: 'none',
                background: view === 'week' ? 'var(--accent-green)' : 'transparent',
                color: view === 'week' ? '#fff' : 'var(--text-tertiary)',
              }}>Week</a>
              <a href={`/?view=month&cook=${cookFilter}`} style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                textDecoration: 'none',
                background: view === 'month' ? 'var(--accent-green)' : 'transparent',
                color: view === 'month' ? '#fff' : 'var(--text-tertiary)',
              }}>Month</a>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {view === "month" ? (
            /* ========= MONTH GRID VIEW ========= */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {/* Day headers */}
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0', letterSpacing: '0.05em' }}>
                  {d}
                </div>
              ))}
              {/* Pad to correct starting day */}
              {Array.from({ length: new Date().getDay() }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {/* Day cells */}
              {filteredDays.map((day, idx) => {
                const badge = getCookBadge(day.cook);
                return (
                  <div key={idx} style={{
                    background: day.isToday ? 'var(--accent-blue-glow)' : 'var(--bg-panel-hover)',
                    borderRadius: '8px', padding: '6px', minHeight: '65px',
                    border: day.isToday ? '1.5px solid var(--accent-blue)' : '1px solid transparent',
                    boxShadow: day.isToday ? '0 0 12px rgba(14, 165, 233, 0.2)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: day.isToday ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{day.dayNum}</span>
                      <span style={{ fontSize: '0.5rem', fontWeight: 700, color: badge.color, background: badge.bg, padding: '1px 5px', borderRadius: '4px' }}>
                        {badge.label}
                      </span>
                    </div>
                    {day.meal && day.meal.name !== 'No meal scheduled' ? (
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {day.meal.name.length > 20 ? day.meal.name.slice(0, 18) + '…' : day.meal.name}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>—</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========= WEEK LIST VIEW ========= */
            <div>
              {filteredDays.map((day, idx) => {
                const badge = getCookBadge(day.cook);
                return (
                  <div key={idx} className="meal-row" style={{ 
                    opacity: 1,
                    background: day.isToday ? 'var(--accent-blue-glow)' : 'transparent',
                    borderRadius: day.isToday ? 'var(--radius-sm)' : '0',
                    padding: day.isToday ? '0.85rem 0.75rem' : '0.85rem 0',
                    border: day.isToday ? '1px solid rgba(14, 165, 233, 0.3)' : 'none',
                    borderBottom: day.isToday ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid var(--border-subtle)',
                  }}>
                    <div className="meal-row-day">
                      <div className="meal-row-day-name" style={{ color: day.isToday ? 'var(--accent-blue)' : undefined }}>{day.dayNameShort}</div>
                      <div className="meal-row-day-num" style={{ color: day.isToday ? 'var(--accent-blue)' : undefined }}>{day.dayNum}</div>
                    </div>
                    <div className="meal-row-divider" style={{ backgroundColor: day.isToday ? 'var(--accent-blue)' : day.color }} />
                    
                    {day.meal && day.meal.name !== 'No meal scheduled' && (
                      <img 
                        src={getMealImage(day.meal.name)} 
                        alt={day.meal.name} 
                        className="meal-row-image" 
                      />
                    )}

                    <div className="meal-row-info">
                      {day.meal && day.meal.name !== 'No meal scheduled' ? (
                        <>
                          <div className="meal-row-name">{day.meal.name}</div>
                          <div className="meal-row-meta"><ClockIcon size={11}/> {day.meal.prepTime}</div>
                        </>
                      ) : (
                        <div className="meal-row-name" style={{ color: 'var(--text-tertiary)' }}>No meal scheduled</div>
                      )}
                    </div>
                    {/* Cook Badge */}
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px',
                      background: badge.bg, color: badge.color, flexShrink: 0,
                    }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
