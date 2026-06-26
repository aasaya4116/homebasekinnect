import { getWeeklyMeals, getFullDaySchedule } from "@/lib/data";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export const revalidate = 1800;

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const params = await searchParams;
  
  const now = new Date();
  const viewMonth = params.month ? parseInt(params.month) : now.getMonth();
  const viewYear = params.year ? parseInt(params.year) : now.getFullYear();
  
  const allMeals = await getWeeklyMeals();
  const monthlyEvents = await getFullDaySchedule(90);

  // Build calendar grid for the view month
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startPadding = firstDay.getDay();
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Previous / Next month links
  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const today = new Date();
  const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');

  // Build day cells
  const dayCells: (null | { dayNum: number; dateStr: string; isToday: boolean; dinners: any[]; lunches: any[]; events: any[] })[] = [];
  
  for (let i = 0; i < startPadding; i++) dayCells.push(null);
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = viewYear + "-" + String(viewMonth + 1).padStart(2, '0') + "-" + String(d).padStart(2, '0');
    const cellDate = new Date(viewYear, viewMonth, d);
    
    const dayMeals = allMeals.filter(m => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, '/');
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === cellDate.getDate() && mDate.getMonth() === cellDate.getMonth() && mDate.getFullYear() === cellDate.getFullYear();
    });

    const dinners = dayMeals.filter(m => (m.type || 'Dinner').toLowerCase() === 'dinner');
    const lunches = dayMeals.filter(m => (m.type || '').toLowerCase() === 'lunch');

    const dayEvents = monthlyEvents.filter(evt => {
      if (!evt.date) return false;
      const eStartD = new Date(evt.date);
      const eEndD = evt.endDate ? new Date(evt.endDate) : new Date(evt.date);
      return eStartD <= cellDate && eEndD >= cellDate;
    });

    dayCells.push({
      dayNum: d,
      dateStr,
      isToday: dateStr === todayStr,
      dinners,
      lunches,
      events: dayEvents,
    });
  }
  
  while (dayCells.length % 7 !== 0) dayCells.push(null);

  // Chunk into weeks
  const weeks: (typeof dayCells)[] = [];
  for (let i = 0; i < dayCells.length; i += 7) {
    weeks.push(dayCells.slice(i, i + 7));
  }

  return (
    <div className="dashboard-container">
      <div className="widget" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <a href={`/monthly?month=${prevMonth}&year=${prevYear}`} className="btn-primary" style={{ fontSize: '0.7rem', padding: '8px 14px' }}>
            <ChevronLeft size={14} />
          </a>
          <div className="widget-title" style={{ margin: 0 }}>
            <CalendarIcon size={13} color="var(--accent-blue)" />
            {monthName}
          </div>
          <a href={`/monthly?month=${nextMonth}&year=${nextYear}`} className="btn-primary" style={{ fontSize: '0.7rem', padding: '8px 14px' }}>
            <ChevronRight size={14} />
          </a>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {weeks.map((week, wIdx) => (
            <div key={wIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {week.map((cell, dIdx) => {
                if (!cell) return <div key={`pad-${dIdx}`} />;
                return (
                  <div key={cell.dayNum} style={{
                    background: 'var(--bg-panel-hover)',
                    borderRadius: '8px',
                    padding: '6px',
                    border: cell.isToday ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cell.isToday ? 'var(--accent-blue)' : 'var(--text-primary)', marginBottom: '2px' }}>
                      {cell.dayNum}
                    </span>
                    
                    {cell.lunches.map((lunch, li) => (
                      <div key={`l-${li}`} style={{
                        fontSize: '0.5rem', padding: '2px 4px', borderRadius: '3px',
                        background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        🥗 {lunch.name}
                      </div>
                    ))}
                    
                    {cell.dinners.map((dinner, di) => (
                      <div key={`d-${di}`} style={{
                        fontSize: '0.5rem', padding: '2px 4px', borderRadius: '3px',
                        background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        🍽️ {dinner.name}
                      </div>
                    ))}

                    {cell.events.map((evt, ei) => (
                      <div key={`e-${ei}`} style={{
                        fontSize: '0.5rem', padding: '2px 4px', borderRadius: '3px',
                        background: evt.color || 'var(--accent-blue)', color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {evt.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
