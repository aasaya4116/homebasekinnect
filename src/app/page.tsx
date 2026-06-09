import "./page.module.css";
import { getWeeklyMeals, getTodaySchedule } from "@/lib/data";
import { generateSchedule } from "@/lib/scheduler";
import { revalidatePath } from "next/cache";
import { Calendar as CalendarIcon, Clock, Flame, Utensils, Zap } from "lucide-react";

const foodImages = [
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
  
  const days = [
    { name: "Mon", date: "1", meal: weeklyMeals[0] },
    { name: "Tue", date: "2", meal: weeklyMeals[1] },
    { name: "Wed", date: "3", meal: weeklyMeals[2] },
    { name: "Thu", date: "4", meal: weeklyMeals[3] },
    { name: "Fri", date: "5", meal: weeklyMeals[4] },
    { name: "Sat", date: "6", meal: weeklyMeals[5] },
    { name: "Sun", date: "7", meal: weeklyMeals[6] }
  ];

  const todaysMeal = weeklyMeals.length > 0 ? weeklyMeals[0] : null;

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
            Auto-Schedule Week
          </button>
        </form>
      </header>
      
      {/* TOP ROW: Tonight's Focus (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        
        {/* Left: Tonight's Meal */}
        <div className="glass-card" style={{ padding: 0, minHeight: '250px' }}>
          {todaysMeal && todaysMeal.name !== 'No meal scheduled' ? (
            <>
              <img src={foodImages[0]} alt="Food" className="glass-card-image" style={{ height: '100%', maskImage: 'linear-gradient(to right, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 100%)' }} />
              <div className="glass-card-content" style={{ padding: '2rem', justifyContent: 'center', width: '60%' }}>
                <span style={{ backgroundColor: 'var(--accent-orange)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: '1rem' }}>TONIGHT'S DINNER</span>
                <h2 style={{ fontSize: '2.2rem', margin: '0 0 1rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{todaysMeal.name}</h2>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> {todaysMeal.prepTime}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Flame size={16}/> {todaysMeal.type}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
              <img src={foodImages[idx]} alt="Food" className="glass-card-image" style={{ height: '120px' }} />
              <div className="glass-card-content" style={{ paddingTop: '100px', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{day.name}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>{day.date}</span>
                </div>
                
                {day.meal && day.meal.name !== 'No meal scheduled' ? (
                  <>
                    <p style={{ fontWeight: '600', fontSize: '1rem', margin: '0.5rem 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
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
