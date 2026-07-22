import { ChevronLeft, ChevronRight } from "lucide-react";
import { getHistoryData, buildWeekGrids, addDays, type DayStatus } from "@/lib/choreHistory";
import { weekStart, fmtMoney } from "@/lib/chores";
import { todayStr, dayParts, zonedDateTimeLabel } from "@/lib/dates";

export const revalidate = 300;

// Same kid identity colors as the chores board.
const KID_COLORS: Record<string, string> = {
  mekhi: "var(--accent-blue)",
  khalil: "var(--accent-purple)",
};
const FALLBACK_COLORS = ["var(--accent-blue)", "var(--accent-purple)", "var(--em)", "var(--gold)"];

function kidColor(kid: string, i: number): string {
  return KID_COLORS[kid.toLowerCase()] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
}

/** Sign-aware money for ledger rows ("+25¢", "-$5"). */
function fmtSigned(v: number): string {
  return v < 0 ? `-${fmtMoney(-v)}` : `+${fmtMoney(v)}`;
}

/** Balance display that tolerates a negative ledger point. */
function fmtBal(v: number): string {
  return v < 0 ? `-${fmtMoney(-v)}` : fmtMoney(v);
}

const STATUS_GLYPH: Record<DayStatus, { text: string; cls: string; title: string }> = {
  "done":      { text: "✓", cls: "hg-done",     title: "Completed" },
  "missed":    { text: "✕", cls: "hg-missed",   title: "Incomplete" },
  "due-today": { text: "●", cls: "hg-today",    title: "Due today" },
  "upcoming":  { text: "○", cls: "hg-upcoming", title: "Upcoming" },
  "none":      { text: "",  cls: "hg-none",     title: "" },
};

export default async function History({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const params = await searchParams;
  // Week offset: 0 = this week, -1 = last week… clamped so the future stays hidden.
  const weekOffset = Math.min(0, parseInt(params.week || "0", 10) || 0);

  const today = todayStr();
  const ws = addDays(weekStart(today), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  const { defs, states, ledgers } = await getHistoryData();
  const grids = buildWeekGrids(defs, states, ws, today);

  const startParts = dayParts(weekDays[0]);
  const endParts = dayParts(weekDays[6]);
  const weekLabel =
    weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${-weekOffset} weeks ago`;
  const weekRange = `${startParts.monthShort} ${startParts.dayNum} – ${endParts.monthShort} ${endParts.dayNum}`;

  return (
    <div className="history-page">
      <header className="history-head">
        <div>
          <h1>History</h1>
          <p>Chores and money, week by week</p>
        </div>

        {/* Week navigation */}
        <nav className="week-nav" aria-label="Week">
          <a className="wn-arrow" href={`/history?week=${weekOffset - 1}`} aria-label="Previous week">
            <ChevronLeft size={20} />
          </a>
          <span className="wn-label">
            {weekLabel}
            <span className="wn-range">{weekRange}</span>
          </span>
          {weekOffset < 0 ? (
            <a className="wn-arrow" href={`/history?week=${weekOffset + 1}`} aria-label="Next week">
              <ChevronRight size={20} />
            </a>
          ) : (
            <span className="wn-arrow off" aria-hidden>
              <ChevronRight size={20} />
            </span>
          )}
        </nav>

        <div className="hist-legend" aria-hidden>
          <span><b className="hg-done">✓</b> Done</span>
          <span><b className="hg-missed">✕</b> Missed</span>
          <span><b className="hg-today">●</b> Due today</span>
          <span><b className="hg-upcoming">○</b> Upcoming</span>
        </div>
      </header>

      {grids.length > 0 ? (
        <div className="history-grid" style={{ gridTemplateColumns: `repeat(${grids.length}, 1fr)` }}>
          {grids.map((grid, gi) => {
            const color = kidColor(grid.kid, gi);
            const ledger = ledgers.get(grid.kid) || [];
            return (
              <section key={grid.kid} className="hist-col" style={{ "--kid": color } as React.CSSProperties}>
                <header className="hist-kid-head">
                  <div className="kid-avatar" style={{ width: 40, height: 40, fontSize: "1.1rem" }}>{grid.kid[0]}</div>
                  <h2>{grid.kid}</h2>
                  <span className="hist-kid-stat">
                    {grid.doneCount}/{grid.dueSoFar} done{weekOffset === 0 ? " so far" : ""}
                  </span>
                </header>

                {/* Sun–Sat chore grid */}
                <div className="hist-week">
                  <div className="hw-row hw-header">
                    <span className="hw-name" />
                    {weekDays.map((ds) => {
                      const p = dayParts(ds);
                      return (
                        <span key={ds} className={`hw-day${ds === today ? " today" : ""}`}>
                          <b>{p.weekdayShort[0]}</b>
                          <i>{p.dayNum}</i>
                        </span>
                      );
                    })}
                  </div>
                  {grid.rows.map((row) => (
                    <div key={row.def.id} className="hw-row">
                      <span className="hw-name">
                        <span aria-hidden>{row.def.emoji}</span> {row.def.name}
                      </span>
                      {row.days.map((st, di) => {
                        const g = STATUS_GLYPH[st];
                        return (
                          <span key={di} className={`hw-cell ${g.cls}${weekDays[di] === today ? " today" : ""}`} title={g.title}>
                            {g.text}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                  {grid.rows.length === 0 && (
                    <div className="chore-empty">No chores this week</div>
                  )}
                </div>

                {/* Ledger — full running history, newest first */}
                <div className="ledger-head">
                  <span className="agenda-label" style={{ marginBottom: 0 }}>Money history</span>
                  {ledger.length > 0 && (
                    <span className="ledger-bal">Balance {fmtBal(ledger[0].running)}</span>
                  )}
                </div>
                <div className="ledger">
                  {ledger.length > 0 ? (
                    ledger.map((item, ii) => (
                      <div key={`${item.ts}-${ii}`} className="ledger-item">
                        <span className="li-emoji" aria-hidden>{item.emoji}</span>
                        <div className="li-main">
                          <span className="li-label">{item.label}</span>
                          <span className="li-time">
                            {zonedDateTimeLabel(new Date(item.ts))}
                            {item.forDate && (
                              <> · was for {dayParts(item.forDate).weekdayShort} {dayParts(item.forDate).monthShort} {dayParts(item.forDate).dayNum}</>
                            )}
                          </span>
                        </div>
                        <div className="li-money">
                          <span className={`li-amount${item.amount < 0 ? " neg" : ""}`}>{fmtSigned(item.amount)}</span>
                          <span className="li-running">{fmtBal(item.running)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="chore-empty">Nothing earned yet</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="chore-empty" style={{ margin: "auto" }}>
          No chores set up yet — add rows to the &ldquo;Chores&rdquo; tab in the family Google Sheet.
        </div>
      )}
    </div>
  );
}
