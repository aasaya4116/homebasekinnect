"use client";

// One kid's chore column on the wall kiosk. Taps are trusted (no login) —
// the kids check off their own work. Toggles render optimistically so the
// board reacts instantly, then the server action syncs Google Sheets and
// revalidates.

import { useOptimistic, useTransition } from "react";
import { toggleChoreAction } from "@/lib/actions";
import { fmtMoney, SLOT_ORDER, type ChoreItem, type KidBoard } from "@/lib/choreShared";
import BalanceAdjustModal from "./BalanceAdjustModal";

type Toggle = { id: string; done: boolean };

export default function KidChoreColumn({ board, color }: { board: KidBoard; color: string }) {
  const [, startTransition] = useTransition();

  const baseItems = [...board.scheduled, ...board.asNeeded];
  const [items, applyToggle] = useOptimistic(baseItems, (state: ChoreItem[], t: Toggle) =>
    state.map((c) => (c.id === t.id ? { ...c, done: t.done } : c))
  );

  const scheduled = items.filter((c) => !c.asNeeded);
  const asNeeded = items.filter((c) => c.asNeeded);
  const doneCount = scheduled.filter((c) => c.done).length;
  const total = scheduled.length;
  const allDone = total > 0 && doneCount === total;

  // Money reacts to optimistic toggles too: adjust the server totals by the
  // delta between optimistic and server done-state.
  let delta = 0;
  for (const c of items) {
    const base = baseItems.find((b) => b.id === c.id);
    if (base && base.done !== c.done) delta += (c.done ? 1 : -1) * c.allowance;
  }
  const earnedToday = Math.max(0, board.earnedToday + delta);
  const earnedWeek = Math.max(0, board.earnedWeek + delta);
  // The running balance moves with the same optimistic delta, so the modal's
  // "Current balance" matches what just happened on screen. The zero-out
  // amount is still computed server-side at write time either way.
  const balance = Math.round((board.balance + delta) * 100) / 100;

  const onTap = (chore: ChoreItem) => {
    startTransition(async () => {
      applyToggle({ id: chore.id, done: !chore.done });
      await toggleChoreAction(chore.id, board.kid, !chore.done, chore.allowance);
    });
  };

  // Progress ring geometry
  const R = 24;
  const CIRC = 2 * Math.PI * R;
  const frac = total > 0 ? doneCount / total : 0;

  const renderCard = (c: ChoreItem) => (
    <button
      key={c.id}
      className={`chore-card${c.done ? " done" : ""}`}
      onClick={() => onTap(c)}
      style={{ "--kid": color } as React.CSSProperties}
    >
      <span className="chore-check" aria-hidden>
        {c.done ? "✓" : ""}
      </span>
      <span className="chore-emoji" aria-hidden>
        {c.emoji}
      </span>
      <span className="chore-name">{c.name}</span>
      <span className="chore-val">+{fmtMoney(c.allowance)}</span>
    </button>
  );

  // Group scheduled chores by time slot, keeping SLOT_ORDER.
  const slots = SLOT_ORDER.filter((s) => scheduled.some((c) => c.slot === s));

  return (
    <section className="kid-col" style={{ "--kid": color } as React.CSSProperties}>
      <header className="kid-head">
        <div className="kid-avatar">{board.kid[0]}</div>
        <div className="kid-title">
          <h2>{board.kid}</h2>
          {/* The earnings line doubles as the Adjust Balances trigger */}
          <BalanceAdjustModal
            kid={board.kid}
            balance={balance}
            color={color}
            variant="line"
            lineText={`${fmtMoney(earnedWeek)} this week${earnedToday > 0 ? ` · ${fmtMoney(earnedToday)} today` : ""}`}
          />
        </div>
        {allDone ? (
          <span className="kid-alldone">All done! 🎉</span>
        ) : (
          <div className="kid-ring" role="img" aria-label={`${doneCount} of ${total} chores done`}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r={R} fill="none" stroke="var(--border-color)" strokeWidth="5" />
              <circle
                cx="30"
                cy="30"
                r={R}
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - frac)}
                transform="rotate(-90 30 30)"
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
              />
            </svg>
            <span className="kid-ring-num">
              {doneCount}/{total}
            </span>
          </div>
        )}
      </header>

      <div className="kid-chores">
        {slots.map((slot) => (
          <div key={slot} className="chore-slot-group">
            <span className="chore-slot-label">{slot}</span>
            {scheduled.filter((c) => c.slot === slot).map(renderCard)}
          </div>
        ))}

        {total === 0 && (
          <div className="chore-empty">Nothing scheduled today 😎</div>
        )}

        {asNeeded.length > 0 && (
          <div className="chore-slot-group">
            <span className="chore-slot-label">When asked</span>
            {asNeeded.map(renderCard)}
          </div>
        )}
      </div>
    </section>
  );
}
