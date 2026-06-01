import "./page.module.css";
import { getWeeklyMeals, getTodaySchedule } from "@/lib/data";

export default async function Home() {
  const weeklyMeals = await getWeeklyMeals();
  const todaySchedule = await getTodaySchedule();
  
  const days = [
    { name: "Mon", date: "1", meal: weeklyMeals[0] },
    { name: "Tue", date: "2", meal: weeklyMeals[1] },
    { name: "Wed", date: "3", meal: weeklyMeals[2] },
    { name: "Thu", date: "4", meal: weeklyMeals[3] },
    { name: "Fri", date: "5", meal: weeklyMeals[4] },
    { name: "Sat", date: "6", meal: weeklyMeals[5] },
    { name: "Sun", date: "7", meal: weeklyMeals[6] }
  ];

  const todaysMeal = weeklyMeals[0];
  
  return (
    <div style={{ padding: '0 2rem 2rem' }}>
      
      {/* Bento Box Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '3fr 1fr', 
        gridTemplateRows: '1fr 1fr',
        gap: '1.5rem', 
        height: 'calc(100vh - 100px)' 
      }}>
        
        {/* Featured Weekly Calendar (Spans 2 rows on the left) */}
        <main className="glass-panel" style={{ gridRow: 'span 2', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <header className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <h2>This Week</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>June 1 - June 7</p>
            </div>
            <button className="btn-primary">Sync Calendar</button>
          </header>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', flexGrow: 1 }}>
            {days.map((day, idx) => (
              <div key={day.name} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', opacity: idx < 1 ? 0.6 : 1 }}>
                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{day.name}</span>
                  <span style={{ fontSize: '1.5rem' }}>{day.date}</span>
                </h3>
                
                {/* Meal in Calendar */}
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-hover)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{day.meal?.type}</p>
                  <p style={{ fontSize: '0.9rem' }}>{day.meal?.name}</p>
                </div>

                {/* Activity Indicators */}
                <div style={{ marginTop: 'auto' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
                    {idx === 0 ? `${todaySchedule.length} Events` : idx % 2 === 0 ? '1 Event' : 'Free'}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    {idx === 0 ? (
                      todaySchedule.slice(0, 3).map(event => (
                        <div key={event.id} style={{ width: '8px', height: '8px', borderRadius: '50%', background: event.color }}></div>
                      ))
                    ) : (
                      idx % 2 === 0 && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Small Widget 1: Today's Overview (Top Right) */}
        <aside className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Today</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monday, June 1</p>
          </div>
          
          <div className="glass-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-hover)' }}>Menu</h3>
            <p style={{ fontWeight: 'bold', marginTop: '0.5rem', fontSize: '0.95rem' }}>{todaysMeal.name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Prep: {todaysMeal.prepTime} | Cook: {todaysMeal.cookTime}</p>
          </div>

          <div className="glass-card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-hover)', marginBottom: '0.75rem' }}>Schedule</h3>
            {todaySchedule.map(event => (
              <div key={event.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: event.color, marginTop: '5px' }}></div>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{event.time}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{event.title}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Small Widget 2: Next Prep / Groceries (Bottom Right) */}
        <aside className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
           <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Quick Actions</h2>
           <div className="glass-card" style={{ marginBottom: '1rem', padding: '1rem', cursor: 'pointer' }}>
             <h3 style={{ fontSize: '1rem', color: 'var(--success-color)' }}>Groceries</h3>
             <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>5 items remaining</p>
           </div>
           <div className="glass-card" style={{ padding: '1rem', cursor: 'pointer' }}>
             <h3 style={{ fontSize: '1rem', color: 'var(--warning-color)' }}>Sunday Prep</h3>
             <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Chop veggies for Taco Tuesday</p>
           </div>
        </aside>

      </div>
    </div>
  );
}
