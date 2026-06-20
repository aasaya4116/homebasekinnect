import { getWeeklyMeals, getTodaySchedule, getGroceryList, getFullDaySchedule } from "@/lib/data";
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
  return { bg: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", label: "Both" };
}

const curatedFoodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543"
];

// Cycle through curated stock images based on the day's index
function getMealImage(index: number): string {
  const base = curatedFoodImages[index % curatedFoodImages.length];
  return `${base}?auto=format&fit=crop&w=250&h=250&q=80`;
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
  const monthlyEvents = view === "month" ? await getFullDaySchedule(30) : [];

  const days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

    const targetDateStr = d.getFullYear() + "-" + 
                          String(d.getMonth() + 1).padStart(2, '0') + "-" + 
                          String(d.getDate()).padStart(2, '0');

    const meal = allMeals.find(m => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, '/');
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === d.getDate() && mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear();
    }) || null;

    const dayEvents = monthlyEvents.filter(e => e.date === targetDateStr);

    return {
      index: i,
      dayNameShort, dayNum, monthShort, meal,
      color: dayColors[i % dayColors.length],
      cook: meal?.cook || "Both",
      isToday: i === 0,
      targetDateStr,
    };
  });

  // Apply cook filter
  const filteredDays = cookFilter === "all" 
    ? days 
    : days.filter(d => d.cook.toLowerCase() === cookFilter.toLowerCase());

  // Pre-calculate Weeks for Month View Grid
  const calendarWeeks: { days: any[], events: any[] }[] = [];
  if (view === "month") {
    const startPadding = new Date().getDay();
    let currentWeekDays: any[] = [];
    
    for (let i = 0; i < startPadding; i++) currentWeekDays.push(null);
    
    days.forEach(day => {
      const mappedDay = { ...day };
      if (cookFilter !== "all" && mappedDay.cook.toLowerCase() !== cookFilter.toLowerCase()) {
         mappedDay.meal = null;
      }
      currentWeekDays.push(mappedDay);
      if (currentWeekDays.length === 7) {
        calendarWeeks.push({ days: currentWeekDays, events: [] });
        currentWeekDays = [];
      }
    });
    
    if (currentWeekDays.length > 0) {
      while (currentWeekDays.length < 7) currentWeekDays.push(null);
      calendarWeeks.push({ days: currentWeekDays, events: [] });
    }

    calendarWeeks.forEach(week => {
      const validDays = week.days.filter(d => d !== null);
      if (validDays.length === 0) return;
      
      const weekStartStr = validDays[0].targetDateStr;
      const weekEndStr = validDays[validDays.length - 1].targetDateStr;
      const weekStartD = new Date(weekStartStr);
      const weekEndD = new Date(weekEndStr);
      
      const overlappingEvents = monthlyEvents.filter(evt => {
         if (!evt.date) return false;
         const eStartD = new Date(evt.date);
         const eEndD = evt.endDate ? new Date(evt.endDate) : new Date(evt.date);
         return eStartD <= weekEndD && eEndD >= weekStartD;
      });

      let occupiedSlots: { [slot: number]: boolean[] } = {};
      
      week.events = overlappingEvents.map(evt => {
        const eStartD = new Date(evt.date!);
        const eEndD = evt.endDate ? new Date(evt.endDate) : new Date(evt.date!);
        
        let startCol = 1;
        if (eStartD > weekStartD) {
          const matchIdx = week.days.findIndex(d => d && d.targetDateStr === evt.date);
          if (matchIdx !== -1) startCol = matchIdx + 1;
        }

        let endCol = 7;
        if (eEndD < weekEndD) {
          const eEndStr = eEndD.toISOString().split('T')[0];
          const matchIdx = week.days.findIndex(d => d && d.targetDateStr === eEndStr);
          if (matchIdx !== -1) endCol = matchIdx + 1;
        }

        const span = endCol - startCol + 1;

        let slot = 0;
        while (true) {
          if (!occupiedSlots[slot]) occupiedSlots[slot] = Array(8).fill(false);
          let canFit = true;
          for (let c = startCol; c <= endCol; c++) {
            if (occupiedSlots[slot][c]) canFit = false;
          }
          if (canFit) {
            for (let c = startCol; c <= endCol; c++) occupiedSlots[slot][c] = true;
            break;
          }
          slot++;
        }

        return { ...evt, startCol, span, slot };
      });
      
      week.events.sort((a, b) => a.slot - b.slot);
    });
  }

  const todaysMeal = days[0].meal;
  const tomorrowsMeal = days.length > 1 ? days[1].meal : null;

  // Grocery summary
  const toBuyCount = groceryItems.filter(i => i.status === "To Buy").length;
  const restockCount = groceryItems.filter(i => i.status === "Restock").length;
  const groceryCategories = [...new Set(groceryItems.map(i => i.category))];

  async function handleGenerate() {
    "use server";
    try {
      await generateSchedule(30);
      revalidatePath("/");
    } catch (error) {
      console.error("Failed to generate schedule:", error);
    }
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
                      background: getCookBadge(tomorrowsMeal.cook || "Both").bg, 
                      color: getCookBadge(tomorrowsMeal.cook || "Both").color,
                      fontSize: '0.55rem', padding: '2px 6px',
                    }}>
                      {getCookBadge(tomorrowsMeal.cook || "Both").label}
                    </span>
                  </div>
                )}
              </div>
              <img 
                src={getMealImage(0)} 
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0', letterSpacing: '0.05em' }}>
                    {d}
                  </div>
                ))}
              </div>
              
              {/* Weeks */}
              {calendarWeeks.map((week, wIdx) => {
                 return (
                   <div key={wIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'min-content', gap: '4px', marginBottom: '4px' }}>
                     {/* Backgrounds */}
                     {week.days.map((day, dIdx) => {
                       if (!day) return <div key={`pad-${dIdx}`} style={{ gridColumn: dIdx + 1, gridRow: '1 / span 10' }} />;
                       
                       const badge = getCookBadge(day.cook);
                       return (
                         <div key={`bg-${day.index}`} style={{
                           gridColumn: dIdx + 1,
                           gridRow: '1 / span 10',
                           background: day.isToday ? 'var(--accent-blue-glow)' : 'var(--bg-panel-hover)',
                           borderRadius: '8px', padding: '6px', minHeight: '85px',
                           border: day.isToday ? '1.5px solid var(--accent-blue)' : '1px solid transparent',
                           boxShadow: day.isToday ? '0 0 12px rgba(14, 165, 233, 0.2)' : 'none',
                           display: 'flex', flexDirection: 'column'
                         }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                             <span style={{ fontSize: '0.85rem', fontWeight: 700, color: day.isToday ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{day.dayNum}</span>
                             <span style={{ fontSize: '0.5rem', fontWeight: 700, color: badge.color, background: badge.bg, padding: '1px 5px', borderRadius: '4px' }}>
                               {badge.label}
                             </span>
                           </div>
                           {day.meal && day.meal.name !== 'No meal scheduled' ? (
                             <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '4px' }}>
                               <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                 🍽️ {day.meal.name.length > 18 ? day.meal.name.slice(0, 16) + '…' : day.meal.name}
                               </span>
                             </div>
                           ) : (
                             <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>—</div>
                           )}
                           {/* Invisible spacer to reserve height for row 1 so events on row 2 don't overlap the header */}
                           <div style={{ gridRow: 1, gridColumn: '1 / span 7', height: '40px' }} />
                         </div>
                       );
                     })}

                     {/* Invisible row 1 spacer across entire grid to ensure row 1 is exactly 40px */}
                     <div style={{ gridRow: 1, gridColumn: '1 / span 7', height: '40px' }} />

                     {/* Events */}
                     {week.events.map((evt: any, eIdx: number) => (
                       <div key={`evt-${eIdx}`} style={{ 
                         gridColumn: `${evt.startCol} / span ${evt.span}`,
                         gridRow: evt.slot + 2,
                         zIndex: 10,
                         margin: '0 2px 2px 2px',
                         fontSize: '0.55rem', 
                         color: '#fff', 
                         background: evt.color || 'var(--accent-blue)',
                         padding: '2px 6px',
                         borderRadius: '4px',
                         whiteSpace: 'nowrap',
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                         display: 'flex',
                         alignItems: 'center'
                       }}>
                         {evt.time !== "All Day" && <span style={{ opacity: 0.8, marginRight: '4px', fontWeight: 600 }}>{evt.time.split(' ')[0]}</span>}
                         {evt.title}
                       </div>
                     ))}
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
                        src={getMealImage(day.index)} 
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
