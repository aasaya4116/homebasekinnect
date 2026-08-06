import { getAdebowalePlan, type PlanDay } from "@/lib/data";
import { todayStr, dayOfWeek } from "@/lib/dates";
import { Dumbbell } from "lucide-react";

export const revalidate = 3600;

// The day's five eating occasions, in chronological order.
const OCCASIONS: { key: keyof PlanDay; label: string; note: string }[] = [
  { key: "preWorkout", label: "Pre-Workout", note: "5:45 AM" },
  { key: "breakfast", label: "Breakfast", note: "~7:45 AM" },
  { key: "lunch", label: "Lunch", note: "w/ veggie side" },
  { key: "snack", label: "Afternoon Snack", note: "high protein" },
  { key: "dinner", label: "Dinner", note: "w/ veggie side" },
];

const ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const params = await searchParams;
  const plan = await getAdebowalePlan();
  const byDay = new Map(plan.map((d) => [d.day.toLowerCase(), d]));

  const todayLabel = DOW_LABEL[dayOfWeek(todayStr())];
  const wanted = (params.day || todayLabel).toLowerCase();
  const selected = byDay.get(wanted) || byDay.get(todayLabel.toLowerCase()) || plan[0];

  const isRest = (selected?.focus || "").toLowerCase().startsWith("rest");

  return (
    <div className="plan-page">
      <header className="plan-head">
        <div>
          <h1>Dad&rsquo;s Plan</h1>
          <p>Adebowale&rsquo;s weekly meal plan — five for the day</p>
        </div>

        {/* Day selector (Mon–Sun), defaults to today */}
        <nav className="plan-daysel" aria-label="Day of week">
          {ORDER.map((d) => {
            const on = selected?.day?.toLowerCase() === d.toLowerCase();
            const today = d.toLowerCase() === todayLabel.toLowerCase();
            return (
              <a key={d} href={`/plan?day=${d}`} className={`pds-btn${on ? " on" : ""}`}>
                {d}
                {today && <span className="pds-today" aria-label="today" />}
              </a>
            );
          })}
        </nav>
      </header>

      {selected ? (
        <>
          <div className="plan-focus-row">
            <span className={`plan-focus ${isRest ? "rest" : "workout"}`}>
              {!isRest && <Dumbbell size={15} />}
              {selected.focus || "—"}
            </span>
            <span className="plan-focus-day">{selected.day}</span>
          </div>

          <div className="plan-grid">
            {OCCASIONS.map((occ) => {
              const value = String(selected[occ.key] || "");
              const none = !value || value.toLowerCase() === "none";
              return (
                <article key={occ.key} className={`plan-card${none ? " empty" : ""}`}>
                  <div className="plan-card-top">
                    <span className="plan-card-lab">{occ.label}</span>
                    <span className="plan-card-note">{occ.note}</span>
                  </div>
                  <p className="plan-card-text">{none ? "— rest day —" : value}</p>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="chore-empty" style={{ margin: "auto" }}>
          No plan set up yet — add rows to the &ldquo;Adebowale Plan&rdquo; tab in the family Google Sheet.
        </div>
      )}
    </div>
  );
}
