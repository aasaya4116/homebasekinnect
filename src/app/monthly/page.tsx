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

    // Only single-day events live in the cell; multi-day events render as banners.
    const dayEvents = monthlyEvents.filter(evt => {
      if (!evt.date) return false;
      if (evt.endDate && evt.endDate > evt.date) return false; // multi-day → banner
      return evt.date === dateStr;
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

  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Chunk into calendar weeks
  const weeks: (typeof dayCells)[] = [];
  for (let i = 0; i < dayCells.length; i += 7) weeks.push(dayCells.slice(i, i + 7));

  // Multi-day events (span 2+ days) render as continuous banners across the week.
  const multiDayEvents = monthlyEvents.filter(e => e.date && e.endDate && e.endDate > e.date);

  type Banner = { key: string; title: string; startCol: number; endCol: number; roundLeft: boolean; roundRight: boolean; lane: number };

  function weekBanners(week: typeof dayCells): Banner[] {
    const dates = week.map(c => (c ? c.dateStr : null));
    const segs: Banner[] = [];
    for (const evt of multiDayEvents) {
      let minCol = -1, maxCol = -1;
      for (let i = 0; i < 7; i++) {
        const d = dates[i];
        if (d && d >= evt.date! && d <= evt.endDate!) {
          if (minCol === -1) minCol = i;
          maxCol = i;
        }
      }
      if (minCol === -1) continue; // event doesn't touch this week
      segs.push({
        key: `${evt.id}-${minCol}`,
        title: evt.title,
        startCol: minCol,
        endCol: maxCol,
        roundLeft: dates[minCol] === evt.date,   // true start (not continued from prev week)
        roundRight: dates[maxCol] === evt.endDate, // true end
        lane: 0,
      });
    }
    // Greedy lane assignment so overlapping spans stack instead of colliding.
    segs.sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));
    const occupied: boolean[][] = [];
    for (const seg of segs) {
      let lane = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!occupied[lane]) occupied[lane] = new Array(7).fill(false);
        let free = true;
        for (let c = seg.startCol; c <= seg.endCol; c++) if (occupied[lane][c]) { free = false; break; }
        if (free) {
          for (let c = seg.startCol; c <= seg.endCol; c++) occupied[lane][c] = true;
          seg.lane = lane;
          break;
        }
        lane++;
      }
    }
    return segs;
  }

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

        <div className="cal-headrow">
          {weekdays.map((d) => (
            <div key={d} className="cal-wd">{d}</div>
          ))}
        </div>

        <div className="cal-body" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week, wi) => {
            const banners = weekBanners(week);
            const laneCount = banners.reduce((m, b) => Math.max(m, b.lane + 1), 0);
            return (
              <div key={wi} className="cal-week">
                {laneCount > 0 && (
                  <div className="cal-banners" style={{ gridTemplateRows: `repeat(${laneCount}, auto)` }}>
                    {banners.map((b) => (
                      <div
                        key={b.key}
                        className={`cal-banner${b.roundLeft ? ' start' : ''}${b.roundRight ? ' end' : ''}`}
                        style={{ gridColumn: `${b.startCol + 1} / ${b.endCol + 2}`, gridRow: b.lane + 1 }}
                        title={b.title}
                      >
                        {b.title}
                      </div>
                    ))}
                  </div>
                )}

                <div className="cal-days">
                  {week.map((cell, ci) => {
                    if (!cell) return <div key={`pad-${wi}-${ci}`} className="cal-cell pad" />;
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
