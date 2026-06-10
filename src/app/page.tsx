import "./page.module.css";
import { getWeeklyMeals, getTodaySchedule } from "@/lib/data";
import { generateSchedule } from "@/lib/scheduler";
import { revalidatePath } from "next/cache";
import { Calendar as CalendarIcon, Clock as ClockIcon, Flame, Utensils, Zap, ChefHat } from "lucide-react";
import Clock from "@/components/Clock";

const curatedFoodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=200&h=200",
];

// Color palette for the weekly meal accent bars
const dayColors = [
  "#0ea5e9", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export default async function Home() {
  const weeklyMeals = await getWeeklyMeals();
  const schedule = await getTodaySchedule();

  // Build 7-day array matched to real dates
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();

    // Loose date matching for Google Sheets
    const meal = weeklyMeals.find(m => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, '/');
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === d.getDate() && mDate.getMonth() === d.getMonth();
    }) || null;

    const imageUrl = curatedFoodImages[i % curatedFoodImages.length];
    const accentColor = dayColors[i % dayColors.length];

    return { dayNameShort, dayNum, meal, image: imageUrl, color: accentColor };
  });

  const todaysMeal = days[0].meal;

  async function handleGenerate() {
    "use server";
    await generateSchedule(7);
    revalidatePath("/");
  }

  return (
    <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ========================================
          ROW 1: CLOCK + ACTION BUTTON
          ======================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Clock />
        <form action={handleGenerate}>
          <button type="submit" className="btn-primary">
            <CalendarIcon size={16} style={{ marginRight: '6px' }}/>
            Auto-Schedule Week
          </button>
        </form>
      </div>

      {/* ========================================
          ROW 2: TONIGHT'S DINNER + TONIGHT'S SCHEDULE
          ======================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Tonight's Dinner */}
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <ChefHat size={14} color="var(--accent-orange)"/>
              Tonight's Dinner
            </div>
            <span className="widget-badge" style={{ background: 'var(--accent-orange-glow)', color: 'var(--accent-orange)' }}>
              {todaysMeal ? todaysMeal.type : 'Dinner'}
            </span>
          </div>

          {todaysMeal && todaysMeal.name !== 'No meal scheduled' ? (
            <div className="dinner-hero">
              <img src={days[0].image} alt="Food" className="dinner-hero-image" />
              <div>
                <h2 className="dinner-hero-name">{todaysMeal.name}</h2>
                <div className="dinner-hero-meta">
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
            <div className="empty-state">
              <Utensils size={36} />
              <span style={{ fontSize: '0.9rem' }}>No Meal Scheduled</span>
              <span style={{ fontSize: '0.75rem' }}>Click Auto-Schedule to generate your week</span>
            </div>
          )}
        </div>

        {/* Tonight's Schedule */}
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <CalendarIcon size={14} color="var(--accent-blue)"/>
              Tonight's Schedule
            </div>
            <span className="widget-badge" style={{ background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)' }}>
              {schedule.length} Event{schedule.length !== 1 ? 's' : ''}
            </span>
          </div>

          {schedule.length > 0 ? (
            <div>
              {schedule.map((event, i) => (
                <div key={i} className="event-row">
                  <div className="event-dot" style={{ backgroundColor: event.color, boxShadow: `0 0 8px ${event.color}40` }} />
                  <div>
                    <div className="event-title">{event.title}</div>
                    <div className="event-time">
                      <ClockIcon size={11}/> {event.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CalendarIcon size={36} />
              <span style={{ fontSize: '0.9rem' }}>No evening events</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================
          ROW 3: THE WEEK AHEAD (Vertical List)
          ======================================== */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Zap size={14} color="var(--accent-green)"/>
            The Week Ahead
          </div>
          <span className="widget-badge" style={{ background: 'var(--accent-green-glow)', color: 'var(--accent-green)' }}>
            7 Days
          </span>
        </div>

        <div>
          {days.map((day, idx) => (
            <div key={idx} className="meal-row" style={{ opacity: idx === 0 ? 0.5 : 1 }}>
              {/* Day Number Block */}
              <div className="meal-row-day">
                <div className="meal-row-day-name">{day.dayNameShort}</div>
                <div className="meal-row-day-num">{day.dayNum}</div>
              </div>

              {/* Colored Accent Bar */}
              <div className="meal-row-divider" style={{ backgroundColor: day.color }} />

              {/* Meal Info */}
              <div className="meal-row-info">
                {day.meal && day.meal.name !== 'No meal scheduled' ? (
                  <>
                    <div className="meal-row-name">{day.meal.name}</div>
                    <div className="meal-row-meta">
                      <ClockIcon size={11}/> {day.meal.prepTime}
                    </div>
                  </>
                ) : (
                  <div className="meal-row-name" style={{ color: 'var(--text-tertiary)' }}>No meal scheduled</div>
                )}
              </div>

              {/* Thumbnail */}
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
