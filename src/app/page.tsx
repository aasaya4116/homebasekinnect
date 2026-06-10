import "./page.module.css";
import { getWeeklyMeals, getTodaySchedule, getGroceryList } from "@/lib/data";
import { generateSchedule } from "@/lib/scheduler";
import { revalidatePath } from "next/cache";
import { Calendar as CalendarIcon, Clock as ClockIcon, Flame, Utensils, Zap, ChefHat, ShoppingCart, RefreshCw } from "lucide-react";
import Clock from "@/components/Clock";

const curatedFoodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=400&h=400",
];

const dayColors = [
  "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#06b6d4",
];

export default async function Home() {
  const weeklyMeals = await getWeeklyMeals();
  const schedule = await getTodaySchedule();
  const groceryItems = await getGroceryList();

  // Build 7-day array matched to real dates
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();

    const meal = weeklyMeals.find(m => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, '/');
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === d.getDate() && mDate.getMonth() === d.getMonth();
    }) || null;

    return { dayNameShort, dayNum, meal, image: curatedFoodImages[i % curatedFoodImages.length], color: dayColors[i % dayColors.length] };
  });

  const todaysMeal = days[0].meal;

  // Grocery summary
  const toBuyCount = groceryItems.filter(i => i.status === "To Buy").length;
  const restockCount = groceryItems.filter(i => i.status === "Restock").length;
  const groceryCategories = [...new Set(groceryItems.map(i => i.category))];

  async function handleGenerate() {
    "use server";
    await generateSchedule(7);
    revalidatePath("/");
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 80px)' }}>

      {/* ========================================
          ROW 1: CLOCK BAR (slim)
          ======================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Clock />
        <form action={handleGenerate}>
          <button type="submit" className="btn-primary">
            <CalendarIcon size={14} style={{ marginRight: '6px' }}/>
            Auto-Schedule Week
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
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ width: '45%', position: 'relative', minHeight: '200px' }}>
                <img src={days[0].image} alt="Food" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '55%' }}>
                <span className="widget-badge" style={{ background: 'var(--accent-orange-glow)', color: 'var(--accent-orange)', alignSelf: 'flex-start', marginBottom: '0.75rem' }}>
                  TONIGHT'S DINNER
                </span>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.75rem 0', lineHeight: 1.15, fontWeight: 700 }}>{todaysMeal.name}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span className="dinner-meta-chip">
                    <ClockIcon size={13} color="var(--accent-blue)"/> {todaysMeal.prepTime}
                  </span>
                  <span className="dinner-meta-chip">
                    <Flame size={13} color="var(--accent-orange)"/> {todaysMeal.type}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: '200px' }}>
              <Utensils size={40} />
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>No Meal Scheduled</span>
              <span style={{ fontSize: '0.75rem' }}>Click Auto-Schedule to generate your week</span>
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
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                No evening events tonight
              </div>
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
                {/* Category summary chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.5rem' }}>
                  {groceryCategories.slice(0, 5).map(cat => {
                    const count = groceryItems.filter(i => i.category === cat).length;
                    return (
                      <span key={cat} style={{
                        fontSize: '0.65rem', fontWeight: 600, padding: '3px 8px', borderRadius: '8px',
                        background: 'var(--bg-panel-hover)', color: 'var(--text-secondary)',
                      }}>
                        {cat} ({count})
                      </span>
                    );
                  })}
                </div>
                {/* Status bar */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                    {toBuyCount} to buy
                  </span>
                  {restockCount > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={11}/> {restockCount} restock
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                Schedule meals to generate your list
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================
          ROW 3: WEEK AHEAD (fills remaining space)
          ======================================== */}
      <div className="widget" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="widget-header" style={{ flexShrink: 0 }}>
          <div className="widget-title">
            <Zap size={13} color="var(--accent-green)"/>
            The Week Ahead
          </div>
          <span className="widget-badge" style={{ background: 'var(--accent-green-glow)', color: 'var(--accent-green)' }}>
            7 Days
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {days.map((day, idx) => (
            <div key={idx} className="meal-row" style={{ opacity: idx === 0 ? 0.45 : 1 }}>
              <div className="meal-row-day">
                <div className="meal-row-day-name">{day.dayNameShort}</div>
                <div className="meal-row-day-num">{day.dayNum}</div>
              </div>
              <div className="meal-row-divider" style={{ backgroundColor: day.color }} />
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
              {day.meal && day.meal.name !== 'No meal scheduled' && (
                <img src={day.image} alt="Food" className="meal-row-image" />
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
