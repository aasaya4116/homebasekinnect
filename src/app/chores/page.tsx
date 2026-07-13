import { getChoreBoards } from "@/lib/chores";
import { todayStr, dayParts } from "@/lib/dates";
import KidChoreColumn from "@/components/KidChoreColumn";

// Check-offs revalidate instantly via the server action; this is just the
// backstop for edits made directly in the Sheet (new chores, value changes).
export const revalidate = 300;

// Kid identity colors — Mekhi is blue everywhere in the app already.
const KID_COLORS: Record<string, string> = {
  mekhi: "var(--accent-blue)",
  khalil: "var(--accent-purple)",
};
const FALLBACK_COLORS = ["var(--accent-blue)", "var(--accent-purple)", "var(--em)", "var(--gold)"];

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
        <div className="chores-grid" style={{ gridTemplateColumns: `repeat(${boards.length}, 1fr)` }}>
          {boards.map((board, i) => (
            <KidChoreColumn
              key={board.kid}
              board={board}
              color={KID_COLORS[board.kid.toLowerCase()] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
            />
          ))}
        </div>
      ) : (
        <div className="chore-empty" style={{ margin: "auto" }}>
          No chores set up yet — add rows to the &ldquo;Chores&rdquo; tab in the family Google Sheet.
        </div>
      )}
    </div>
  );
}
