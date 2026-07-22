import { getChoreBoards, fmtMoney } from "@/lib/chores";
import { todayStr, dayParts } from "@/lib/dates";
import KidChoreColumn from "@/components/KidChoreColumn";
import BalanceAdjustModal from "@/components/BalanceAdjustModal";

// Check-offs revalidate instantly via the server action; this is just the
// backstop for edits made directly in the Sheet (new chores, value changes).
export const revalidate = 300;

// Kid identity colors — Mekhi is blue everywhere in the app already.
const KID_COLORS: Record<string, string> = {
  mekhi: "var(--accent-blue)",
  khalil: "var(--accent-purple)",
};
const FALLBACK_COLORS = ["var(--accent-blue)", "var(--accent-purple)", "var(--em)", "var(--gold)"];

function kidColor(kid: string, i: number): string {
  return KID_COLORS[kid.toLowerCase()] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
}

export default async function Chores() {
  const today = todayStr();
  const boards = await getChoreBoards(today);
  const { weekdayShort, monthShort, dayNum } = dayParts(today);

  return (
    <div className="chores-page">
      <header className="chores-head">
        <h1>Chores</h1>
        <p>
          {weekdayShort} {monthShort} {dayNum} — tap a chore when it&rsquo;s done
        </p>
      </header>

      {boards.length > 0 ? (
        <>
          <div className="chores-grid" style={{ gridTemplateColumns: `repeat(${boards.length}, 1fr)` }}>
            {boards.map((board, i) => (
              <KidChoreColumn key={board.kid} board={board} color={kidColor(board.kid, i)} />
            ))}
          </div>

          {/* Week scoreboard — Sun through today, per kid */}
          <footer className="chores-tally">
            {boards.map((board, i) => {
              const pct = board.weekTotal > 0 ? Math.round((board.weekDone / board.weekTotal) * 100) : 0;
              return (
                <div
                  key={board.kid}
                  className="tally-kid"
                  style={{ "--kid": kidColor(board.kid, i) } as React.CSSProperties}
                >
                  <span className="tally-avatar">{board.kid[0]}</span>
                  <div className="tally-info">
                    <div className="tally-row">
                      <span className="tally-label">This week</span>
                      <span className="tally-count">
                        {board.weekDone}/{board.weekTotal} chores
                      </span>
                    </div>
                    <div className="tally-bar">
                      <div className="tally-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="tally-money">{fmtMoney(board.earnedWeek)}</span>
                  <BalanceAdjustModal
                    kid={board.kid}
                    balance={board.balance}
                    color={kidColor(board.kid, i)}
                  />
                </div>
              );
            })}
          </footer>
        </>
      ) : (
        <div className="chore-empty" style={{ margin: "auto" }}>
          No chores set up yet — add rows to the &ldquo;Chores&rdquo; tab in the family Google Sheet.
        </div>
      )}
    </div>
  );
}
