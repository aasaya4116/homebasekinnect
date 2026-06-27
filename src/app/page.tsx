import { getWeeklyMeals, getTodaySchedule, getGroceryList } from "@/lib/data";
import { generateSchedule } from "@/lib/scheduler";
import { revalidatePath } from "next/cache";
import { Calendar as CalendarIcon, Clock as ClockIcon, Flame, Utensils, Zap, ShoppingCart, RefreshCw, User, ArrowRight } from "lucide-react";
import Clock from "@/components/Clock";
import Weather from "@/components/Weather";

export const revalidate = 1800; // 30 minutes ISR caching

const dayColors = [
  "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#06b6d4",
];

// Cook badge styles
function getCookBadge(cook: string) {
  if (cook === "Dad") return { bg: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9", label: "Dad" };
  if (cook === "Mom") return { bg: "rgba(236, 72, 153, 0.15)", color: "#ec4899", label: "Mom" };
  if (cook === "Family") return { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", label: "Family" };
  return { bg: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", label: "Both" };
}

const curatedFoodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543"
];

function getMealImage(index: number): string {
  const base = curatedFoodImages[index % curatedFoodImages.length];
  return `${base}?auto=format&fit=crop&w=250&h=250&q=80`;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ cook?: string }> }) {
  const params = await searchParams;
  const cookFilter = params.cook || "all";

  const allMeals = await getWeeklyMeals();
  const schedule = await getTodaySchedule();
  const groceryItems = await getGroceryList();

  const daysCount = 7; // Rolling 7-day view

  const days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

    const targetDateStr = d.getFullYear() + "-" + 
                          String(d.getMonth() + 1).padStart(2, '0') + "-" + 
                          String(d.getDate()).padStart(2, '0');

    const dayMeals = allMeals.filter(m => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, '/');
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === d.getDate() && mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear();
    });

    const lunch = dayMeals.find(m => (m.type || '').toLowerCase() === 'lunch') || null;
    const dinner = dayMeals.find(m => (m.type || 'Dinner').toLowerCase() === 'dinner') || null;

    return {
      index: i,
      dayNameShort, dayNum, monthShort, 
      lunch, dinner,
      color: dayColors[i % dayColors.length],
      isToday: i === 0,
      targetDateStr,
    };
  });

  const filteredDays = cookFilter === "all" 
    ? days 
    : days.filter(d => 
        (d.dinner && d.dinner.cook?.toLowerCase() === cookFilter.toLowerCase()) || 
        (d.lunch && d.lunch.cook?.toLowerCase() === cookFilter.toLowerCase())
      );

  const todaysDinner = days[0].dinner;
  const tomorrowsDinner = days.length > 1 ? days[1].dinner : null;
  const todaysLunch = days[0].lunch;

  const toBuyCount = groceryItems.filter(i => i.status === "To Buy").length;
  const restockCount = groceryItems.filter(i => i.status === "Restock").length;
  const groceryCategories = [...new Set(groceryItems.map(i => i.category))];

  async function handleGenerate() {
    "use server";
    try {
      await generateSchedule(30); // Generate a full month
      revalidatePath("/");
    } catch (error) {
      console.error("Failed to generate schedule:", error);
    }
  }

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Clock />
          <Weather />
        </div>
        <form action={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="submit" className="btn-primary" style={{ fontSize: '0.9rem', padding: '12px 20px', opacity: 0.8 }}>
            <CalendarIcon size={16} style={{ marginRight: '8px' }}/>
            Regenerate
          </button>
        </form>
      </div>

      <div className="hero-row">
        <div className="widget" style={{ padding: 0, overflow: 'hidden' }}>
          {todaysDinner && todaysDinner.name !== 'No meal scheduled' ? (
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, height: '100%' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="widget-badge" style={{ background: 'var(--accent-orange-glow)', color: 'var(--accent-orange)', fontSize: '0.75rem' }}>
                    🍽️ TONIGHT'S DINNER
                  </span>
                  {todaysDinner.cook && (
                    <span className="widget-badge" style={{ background: getCookBadge(todaysDinner.cook).bg, color: getCookBadge(todaysDinner.cook).color, fontSize: '0.75rem' }}>
                      <User size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '3px' }}/> 
                      {getCookBadge(todaysDinner.cook).label}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '2.2rem', margin: '0 0 0.75rem 0', lineHeight: 1.15, fontWeight: 700 }}>
                  {todaysDinner.name}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <span className="dinner-meta-chip" style={{ fontSize: '1rem' }}>
                    <ClockIcon size={16} color="var(--accent-blue)"/> {todaysDinner.prepTime}
                  </span>
                </div>
                {tomorrowsDinner && tomorrowsDinner.name !== 'No meal scheduled' && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '10px 16px', borderRadius: '12px',
                    background: 'var(--bg-panel-hover)', 
                    border: '1px solid var(--border-color)',
                    marginTop: 'auto',
                  }}>
                    <ArrowRight size={14} color="var(--text-tertiary)"/>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      Tomorrow:
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {tomorrowsDinner.name}
                    </span>
                    <span className="widget-badge" style={{ 
                      background: getCookBadge(tomorrowsDinner.cook || "Both").bg, 
                      color: getCookBadge(tomorrowsDinner.cook || "Both").color,
                      fontSize: '0.7rem', padding: '3px 8px',
                    }}>
                      {getCookBadge(tomorrowsDinner.cook || "Both").label}
                    </span>
                  </div>
                )}
              </div>
              <img 
                src={getMealImage(0)} 
                alt={todaysDinner.name} 
                style={{ 
                  width: '200px', 
                  height: '200px', 
                  borderRadius: '16px', 
                  objectFit: 'cover', 
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}
              />
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: '200px' }}>
              <Utensils size={40} />
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>No Dinner Scheduled</span>
              <span style={{ fontSize: '0.75rem' }}>Click Regenerate to generate your month</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="widget" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <div className="widget-header" style={{ marginBottom: '0.5rem' }}>
              <div className="widget-title">
                <Utensils size={15} color="var(--accent-green)"/>
                Today's Lunch
              </div>
            </div>
            {todaysLunch ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="meal-type-badge lunch" style={{ fontSize: '0.75rem' }}>🥗 LUNCH</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{todaysLunch.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}><ClockIcon size={12} style={{ display: 'inline', marginRight: '4px' }}/>{todaysLunch.prepTime}</div>
                </div>
                {todaysLunch.cook && (
                   <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                    background: getCookBadge(todaysLunch.cook).bg, color: getCookBadge(todaysLunch.cook).color, flexShrink: 0,
                  }}>
                    {getCookBadge(todaysLunch.cook).label}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No lunch scheduled today</div>
            )}
          </div>

          <div className="widget" style={{ flex: 1 }}>
            <div className="widget-header" style={{ marginBottom: '0.5rem' }}>
              <div className="widget-title">
                <CalendarIcon size={15} color="var(--accent-blue)"/>
                Tonight's Schedule
              </div>
              <span className="widget-badge" style={{ background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', fontSize: '0.75rem' }}>
                {schedule.length} Event{schedule.length !== 1 ? 's' : ''}
              </span>
            </div>
            {schedule.length > 0 ? (
              <div>
                {schedule.slice(0, 2).map((event, i) => (
                  <div key={i} className="event-row" style={{ padding: '0.5rem 0' }}>
                    <div className="event-dot" style={{ backgroundColor: event.color, boxShadow: `0 0 8px ${event.color}40`, height: '24px' }} />
                    <div>
                      <div className="event-title" style={{ fontSize: '0.95rem' }}>{event.title}</div>
                      <div className="event-time" style={{ fontSize: '0.8rem' }}><ClockIcon size={12}/> {event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No evening events tonight</div>
            )}
          </div>

          <div className="widget" style={{ flex: 1 }}>
            <div className="widget-header" style={{ marginBottom: '0.5rem' }}>
              <div className="widget-title">
                <ShoppingCart size={15} color="var(--accent-green)"/>
                Grocery List
              </div>
              <span className="widget-badge" style={{ background: 'var(--accent-green-glow)', color: 'var(--accent-green)', fontSize: '0.75rem' }}>
                {toBuyCount + restockCount} Items
              </span>
            </div>
            {groceryItems.length > 0 ? (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', fontWeight: 600 }}>{toBuyCount} to buy</span>
                  {restockCount > 0 && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={14}/> {restockCount} restock
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Schedule meals to generate your list</div>
            )}
          </div>
        </div>
      </div>

      <div className="widget" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div className="widget-title" style={{ fontSize: '1rem' }}>
            <Zap size={18} color="var(--accent-green)"/>
            The Week Ahead
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-panel-hover)', borderRadius: '10px', padding: '4px' }}>
            {[
              { key: "all", label: "All" },
              { key: "dad", label: "Dad", color: "#0ea5e9" },
              { key: "mom", label: "Mom", color: "#ec4899" },
            ].map(opt => (
              <a key={opt.key} href={`/?cook=${opt.key}`} style={{
                fontSize: '0.85rem', fontWeight: 700, padding: '6px 14px', borderRadius: '8px',
                textDecoration: 'none',
                background: cookFilter === opt.key ? (opt.color || 'var(--accent-blue)') : 'transparent',
                color: cookFilter === opt.key ? '#fff' : 'var(--text-tertiary)',
                transition: 'all 0.2s',
              }}>
                {opt.label}
              </a>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          {filteredDays.map((day, idx) => {
            return (
              <div key={idx} className="day-group">
                <div className="day-group-header">
                  <div className="meal-row-day" style={{ width: '56px' }}>
                    <div className="meal-row-day-name" style={{ color: day.isToday ? 'var(--accent-blue)' : undefined, fontSize: '0.95rem' }}>{day.dayNameShort}</div>
                    <div className="meal-row-day-num" style={{ color: day.isToday ? 'var(--accent-blue)' : undefined, fontSize: '1.8rem' }}>{day.dayNum}</div>
                  </div>
                  <div className="meal-row-divider" style={{ backgroundColor: day.isToday ? 'var(--accent-blue)' : day.color, height: '48px', width: '4px' }} />
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: day.isToday ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {day.isToday ? 'Today' : `${day.monthShort} ${day.dayNum}`}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div className="day-group-meals" style={{ flex: 1, paddingLeft: '76px' }}>
                    {/* Lunch Row */}
                    {day.lunch && (
                      <div className="day-meal-row">
                        <span className="meal-type-badge lunch">🥗 LUNCH</span>
                        <div className="meal-row-info">
                          <div className="meal-row-name" style={{ fontSize: '1.1rem' }}>{day.lunch.name}</div>
                          <div className="meal-row-meta" style={{ fontSize: '0.85rem' }}><ClockIcon size={12}/> {day.lunch.prepTime}</div>
                        </div>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                          background: getCookBadge(day.lunch.cook || 'Both').bg, color: getCookBadge(day.lunch.cook || 'Both').color, flexShrink: 0,
                        }}>
                          {getCookBadge(day.lunch.cook || 'Both').label}
                        </span>
                      </div>
                    )}
                    
                    {/* Dinner Row */}
                    {day.dinner && (
                      <div className="day-meal-row">
                        <span className="meal-type-badge dinner">🍽️ DINNER</span>
                        <div className="meal-row-info">
                          <div className="meal-row-name" style={{ fontSize: '1.1rem' }}>{day.dinner.name}</div>
                          <div className="meal-row-meta" style={{ fontSize: '0.85rem' }}><ClockIcon size={12}/> {day.dinner.prepTime}</div>
                        </div>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                          background: getCookBadge(day.dinner.cook || 'Both').bg, color: getCookBadge(day.dinner.cook || 'Both').color, flexShrink: 0,
                        }}>
                          {getCookBadge(day.dinner.cook || 'Both').label}
                        </span>
                      </div>
                    )}

                    {!day.lunch && !day.dinner && (
                      <div className="day-meal-row">
                         <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>No meals scheduled</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Food Image Thumbnail */}
                  {day.dinner && day.dinner.name !== 'No meal scheduled' && (
                    <img 
                      src={getMealImage(idx)} 
                      alt={day.dinner.name} 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '12px', 
                        objectFit: 'cover', 
                        border: '1px solid var(--border-color)',
                        flexShrink: 0
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
