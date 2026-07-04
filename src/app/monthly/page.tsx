import { getWeeklyMeals, getFullDaySchedule } from "@/lib/data";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { todayStr as getTodayStr } from "@/lib/dates";

export const revalidate = 1800;

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const params = await searchParams;
  
  const todayStr = getTodayStr(); // household-timezone "today" (YYYY-MM-DD)
  const [todayYear, todayMonth] = todayStr.split("-").map(Number);
  const viewMonth = params.month ? parseInt(params.month) : todayMonth - 1;
  const viewYear = params.year ? parseInt(params.year) : todayYear;
  
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

  // (todayStr is computed above, pinned to the household timezone)

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

  const weekCount = dayCells.length / 7;
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="dashboard-container">
      <div className="cal-shell">
        <div className="cal-head">
          <a href={`/monthly?month=${prevMonth}&year=${prevYear}`} className="cal-nav" aria-label="Previous month">
            <ChevronLeft size={24} />
          </a>
          <div className="cal-title">
            <CalendarIcon size={22} color="var(--gold)" />
            {monthName}
          </div>
          <a href={`/monthly?month=${nextMonth}&year=${nextYear}`} className="cal-nav" aria-label="Next month">
            <ChevronRight size={24} />
          </a>
        </div>

        <div className="cal-grid" style={{ gridTemplateRows: `auto repeat(${weekCount}, 1fr)` }}>
          {weekdays.map((d) => (
            <div key={d} className="cal-wd">{d}</div>
          ))}

          {dayCells.map((cell, idx) => {
            if (!cell) return <div key={`pad-${idx}`} className="cal-cell pad" />;
            return (
              <div key={cell.dateStr} className={`cal-cell${cell.isToday ? ' today' : ''}`}>
                <span className="cal-daynum">{cell.dayNum}</span>

                {cell.dinners.map((dinner, di) => (
                  <div key={`d-${di}`} className="cal-chip dinner" title={dinner.name}>{dinner.name}</div>
                ))}
                {cell.lunches.map((lunch, li) => (
                  <div key={`l-${li}`} className="cal-chip lunch" title={lunch.name}>{lunch.name}</div>
                ))}
                {cell.events.map((evt, ei) => (
                  <div key={`e-${ei}`} className="cal-chip event" title={evt.title}>{evt.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
