// Client-safe chore types + helpers. No googleapis imports here — this file
// is shared by the kiosk client components, which must not pull server deps
// into the browser bundle. Server-side Sheet access lives in chores.ts.

export type ChoreDef = {
  id: string;
  kid: string;
  name: string;
  emoji: string;
  days: string;      // "Daily" | "Mon,Thu" | "As needed"
  slot: string;      // "Morning" | "After school" | "Evening" | "Anytime"
  allowance: number; // dollars per completion
  active: boolean;
};

export type ChoreItem = ChoreDef & {
  asNeeded: boolean;
  done: boolean;
};

export type KidBoard = {
  kid: string;
  scheduled: ChoreItem[]; // due today, slot order
  asNeeded: ChoreItem[];  // "when asked" chores, always visible
  doneCount: number;      // scheduled chores done today
  totalScheduled: number;
  earnedToday: number;
  earnedWeek: number;     // since the most recent Sunday
};

// Display order for time-of-day groups on the board.
export const SLOT_ORDER = ["Morning", "After school", "Evening", "Anytime"];

/** "$1.50" for dollars, "75¢" under a dollar — kiosk-friendly money. */
export function fmtMoney(v: number): string {
  if (v === 0) return "$0";
  if (v < 1) return `${Math.round(v * 100)}¢`;
  return `$${v.toFixed(2).replace(/\.00$/, "")}`;
}
