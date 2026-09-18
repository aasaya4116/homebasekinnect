"use client";

import { useState, useTransition, type CSSProperties } from "react";
import {
  Activity,
  BookOpen,
  Check,
  Clock3,
  Code2,
  Flag,
  Medal,
  Minus,
  Music2,
  Plus,
  Sparkles,
  Target,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { setGoalProgressAction } from "@/app/goals/actions";
import {
  GOAL_PERSON_KEYS,
  YEAR_GOALS,
  type GoalIcon,
  type GoalPersonKey,
  type YearGoal,
} from "@/lib/goals";
import styles from "@/app/goals/goals.module.css";

const ICONS: Record<GoalIcon, LucideIcon> = {
  activity: Activity,
  book: BookOpen,
  clock: Clock3,
  code: Code2,
  flag: Flag,
  medal: Medal,
  music: Music2,
  sparkles: Sparkles,
  target: Target,
  waves: Waves,
};

function goalProgressStyle(value: number, target: number): CSSProperties {
  return { "--goal-progress": `${Math.round((value / target) * 100)}%` } as CSSProperties;
}

function ProgressDots({ goal, value }: { goal: YearGoal; value: number }) {
  if (goal.kind !== "count" || goal.target > 15) return null;
  return (
    <div className={styles.dots} aria-hidden="true">
      {Array.from({ length: goal.target }, (_, index) => (
        <span className={index < value ? styles.dotDone : ""} key={index} />
      ))}
    </div>
  );
}

export default function GoalsBoard({ initialProgress }: { initialProgress: Record<string, number> }) {
  const [activePerson, setActivePerson] = useState<GoalPersonKey>("khalil");
  const [progress, setProgress] = useState(initialProgress);
  const [syncError, setSyncError] = useState("");
  const [isPending, startTransition] = useTransition();
  const person = YEAR_GOALS[activePerson];

  const completedCount = person.goals.filter(
    (goal) => Math.min(progress[goal.id] || 0, goal.target) >= goal.target
  ).length;
  const completionPercent = Math.round((completedCount / person.goals.length) * 100);

  const updateGoal = (goal: YearGoal, nextValue: number) => {
    const previousValue = progress[goal.id] || 0;
    const value = Math.min(goal.target, Math.max(0, Math.round(nextValue)));
    setSyncError("");
    setProgress((current) => ({ ...current, [goal.id]: value }));
    startTransition(async () => {
      const result = await setGoalProgressAction(activePerson, goal.id, value);
      if (!result.success) {
        setProgress((current) => ({ ...current, [goal.id]: previousValue }));
        setSyncError("Couldn’t save that update. Please try again.");
      }
    });
  };

  return (
    <main className={styles.page} data-person={activePerson}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.overline}>Our year in motion</span>
          <h1>2026 Goals</h1>
          <p>Small steps, visible progress, and plenty to celebrate.</p>
        </div>
        <div className={styles.personTabs} role="tablist" aria-label="Choose a family member">
          {GOAL_PERSON_KEYS.map((personKey) => (
            <button
              key={personKey}
              type="button"
              role="tab"
              aria-selected={activePerson === personKey}
              onClick={() => {
                setSyncError("");
                setActivePerson(personKey);
              }}
            >
              {YEAR_GOALS[personKey].name}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.workspace} role="tabpanel" aria-busy={isPending}>
        <aside className={styles.summary}>
          <span className={styles.summaryEyebrow}>{person.eyebrow}</span>
          <h2>{person.theme}</h2>
          <div className={styles.ring} style={goalProgressStyle(completedCount, person.goals.length)}>
            <div><strong>{completionPercent}%</strong><span>complete</span></div>
          </div>
          <p><strong>{completedCount} of {person.goals.length}</strong> goals reached</p>
          <blockquote>{person.encouragement}</blockquote>
        </aside>

        <section className={styles.goalGrid} aria-label={`${person.name}'s goals`}>
          {person.goals.map((goal) => {
            const value = Math.min(progress[goal.id] || 0, goal.target);
            const complete = value >= goal.target;
            const Icon = ICONS[goal.icon];
            return (
              <article className={`${styles.goalCard} ${complete ? styles.goalComplete : ""}`} key={goal.id}>
                <div className={styles.goalTop}>
                  <span className={styles.goalIcon}><Icon size={20} /></span>
                  <div><span>{goal.category}</span><h2>{goal.title}</h2></div>
                </div>

                <div className={styles.progressTrack} style={goalProgressStyle(value, goal.target)}>
                  <span />
                </div>
                <ProgressDots goal={goal} value={value} />

                <div className={styles.goalFooter}>
                  <div className={styles.goalValue} aria-live="polite">
                    {goal.kind === "count" ? (
                      <><strong>{value}</strong><span>of {goal.target} {goal.unit}</span></>
                    ) : (
                      <><strong>{complete ? "Done" : "In progress"}</strong><span>{complete ? "Goal reached" : "Keep going"}</span></>
                    )}
                  </div>

                  {goal.kind === "count" ? (
                    <div className={styles.stepper}>
                      <button type="button" aria-label={`Decrease ${goal.title}`} disabled={isPending || value === 0} onClick={() => updateGoal(goal, value - 1)}><Minus size={18} /></button>
                      <button type="button" aria-label={`Increase ${goal.title}`} disabled={isPending || complete} onClick={() => updateGoal(goal, value + 1)}><Plus size={18} /></button>
                    </div>
                  ) : (
                    <button type="button" className={styles.completeButton} aria-pressed={complete} disabled={isPending} onClick={() => updateGoal(goal, complete ? 0 : 1)}>
                      <Check size={17} /> {complete ? "Completed" : "Mark complete"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
      {syncError && <p className={styles.syncError} role="alert">{syncError}</p>}
    </main>
  );
}
