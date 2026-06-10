import "./page.module.css";
import { getWeeklyMeals, getTodaySchedule } from "@/lib/data";
import { generateSchedule } from "@/lib/scheduler";
import { revalidatePath } from "next/cache";
import { Calendar as CalendarIcon, Clock, Flame, Utensils, Zap } from "lucide-react";

const curatedFoodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600&h=300",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600&h=300",
  "https://images.unsplash.com/photo-1490818387583-1b5ba4197aab?auto=format&fit=crop&q=80&w=600&h=300",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&q=80&w=600&h=300",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600&h=300",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=600&h=300",
  "https://images.unsplash.com/photo-1484723091791-0063154a858d?auto=format&fit=crop&q=80&w=600&h=300"
];

export default async function Home() {
  const weeklyMeals = await getWeeklyMeals();
  const schedule = await getTodaySchedule();

  // Fix Day Awareness by mapping exactly to the scheduled date string
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    
    // Format date as "YYYY-MM-DD" to match the database date string
    // Note: To match local timezone dates reliably, we construct it manually
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Format display as "Tuesday - JUN 09"
    const dayNameFull = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayDate = String(d.getDate()).padStart(2, '0');
    
    // Find the exact meal scheduled for this date in the database!
    // Google Sheets might return "6/9/2026" or "2026-06-09".
    // If it's "2026-06-09", new Date() treats it as UTC, shifting it back to the 8th in US timezones!
    // Replacing dashes with slashes forces new Date() to treat it as local time.
    const meal = weeklyMeals.find(m => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, '/');
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === d.getDate() && mDate.getMonth() === d.getMonth();
    }) || null;
    
    const curatedFoodImages = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600&h=300",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600&h=300",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&q=80&w=600&h=300",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600&h=300",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=600&h=300"
    ];

    const imageUrl = curatedFoodImages[i % curatedFoodImages.length];

    return { 
      name: dayNameFull, 
      displayDate: `${monthName} ${dayDate}`, 
      meal: meal, 
      image: imageUrl 
    };
  });

  const todaysMeal = days[0].meal;

  async function handleGenerate() {
    "use server";
    await generateSchedule(7);
    revalidatePath("/");
  }
  
  return (
    <div style={{ padding: '0 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <header className="flex-between">
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>Asaya Dashboard</h1>
          <p style={{ color: 'var(--accent-purple)', fontSize: '1.1rem', marginTop: '0.25rem', fontWeight: 500 }}>
            <Zap size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/>
            Smart Family Planner
          </p>
        </div>
        <form action={handleGenerate}>
          <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-purple)' }}>
            <CalendarIcon size={18} style={{ marginRight: '8px' }}/>
            Wipe & Auto-Schedule Week
          </button>
        </form>
      </header>
      
      {/* TOP ROW: Tonight's Focus (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        
        {/* Left: Tonight's Meal */}
        <div className="glass-card" style={{ padding: 0, minHeight: '250px', display: 'flex' }}>
          {todaysMeal && todaysMeal.name !== 'No meal scheduled' ? (
            <>
              <div style={{ width: '40%', position: 'relative' }}>
                <img src={days[0].image} alt="Food" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '60%' }}>
                <span style={{ backgroundColor: 'var(--accent-purple-glow)', color: 'var(--accent-blue)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: '1rem' }}>TONIGHT'S DINNER</span>
                <h2 style={{ fontSize: '2.2rem', margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>{todaysMeal.name}</h2>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><Clock size={16} color="var(--accent-blue)"/> {todaysMeal.prepTime}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><Flame size={16} color="var(--accent-orange)"/> {todaysMeal.type}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <Utensils size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }}/>
              <h3 style={{ color: 'var(--text-secondary)' }}>No Meal Scheduled</h3>
            </div>
          )}
        </div>

        {/* Right: Evening Schedule */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <CalendarIcon size={18} color="var(--accent-blue)"/> Tonight's Schedule
          </h3>
          
          {schedule.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {schedule.map((event, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ width: '4px', height: '30px', backgroundColor: event.color, borderRadius: '4px', boxShadow: `0 0 8px ${event.color}40` }} />
                  <div>
                    <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{event.title}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>
                      {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              No evening events.
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM ROW: 7-Column Weekly Calendar */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>The Week Ahead</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem' }}>
          {days.map((day, idx) => (
            <div key={day.name} className="glass-card" style={{ padding: 0, opacity: idx === 0 ? 0.6 : 1 }}>
              <div style={{ height: '120px', position: 'relative' }}>
                <img src={day.image} alt="Food" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{day.name}</h3>
                  <span style={{ color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '2px' }}>{day.displayDate}</span>
                </div>
                
                {day.meal && day.meal.name !== 'No meal scheduled' ? (
                  <>
                    <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: '0.5rem 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {day.meal.name}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                      <Clock size={12}/> {day.meal.prepTime}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '0.5rem 0' }}>No meal scheduled</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
