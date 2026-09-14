"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import {
  Backpack,
  BookCheck,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Divide,
  FileText,
  Globe2,
  HandHeart,
  HeartPulse,
  Mail,
  Map,
  NotebookTabs,
  Recycle,
  type LucideIcon,
} from "lucide-react";
import type { SchoolChildKey, SchoolIcon, SchoolWeek as SchoolWeekData } from "@/lib/school";
import { toggleSchoolTaskAction } from "@/app/school/actions";
import styles from "@/app/school/school.module.css";

const ICONS: Record<SchoolIcon, LucideIcon> = {
  backpack: Backpack,
  "book-check": BookCheck,
  "book-open": BookOpen,
  calculator: Calculator,
  divide: Divide,
  "file-text": FileText,
  globe: Globe2,
  "hand-heart": HandHeart,
  "heart-pulse": HeartPulse,
  mail: Mail,
  map: Map,
  notebook: NotebookTabs,
  recycle: Recycle,
};

type CompletionToggle = { id: string; done: boolean };

export default function SchoolWeek({
  weeks,
  completedTaskIds,
  pendingDraftCount,
}: {
  weeks: Record<SchoolChildKey, SchoolWeekData>;
  completedTaskIds: string[];
  pendingDraftCount: number;
}) {
  const [activeChild, setActiveChild] = useState<SchoolChildKey>("khalil");
  const [syncError, setSyncError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [optimisticCompletedIds, applyCompletion] = useOptimistic(
    completedTaskIds,
    (state: string[], toggle: CompletionToggle) =>
      toggle.done
        ? state.includes(toggle.id) ? state : [...state, toggle.id]
        : state.filter((id) => id !== toggle.id)
  );

  const week = weeks[activeChild];
  const completed = new Set(optimisticCompletedIds);
  const taskDates = week.dates.filter((date) => date.task);
  const nextTaskDate = taskDates.find((date) => date.task && !completed.has(date.task.id));
  const nextTask = nextTaskDate?.task;
  const allTasksDone = taskDates.length > 0 && !nextTask;
  const ActionIcon = nextTask ? ICONS[nextTask.icon] : CheckCircle2;

  const toggleTask = (taskId: string, done: boolean) => {
    setSyncError("");
    startTransition(async () => {
      applyCompletion({ id: taskId, done });
      const result = await toggleSchoolTaskAction(taskId, activeChild, done);
      if (!result.success) setSyncError("Couldn’t sync that check-off. Please try again.");
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.overline}>School week</span>
          <h1>{week.child}&rsquo;s week at school</h1>
          <p className={styles.weekMeta}>{week.meta}</p>
        </div>

        <div className={styles.headActions}>
          <Link className={styles.reviewLink} href="/school/review">
            Update inbox
            {pendingDraftCount > 0 && <span>{pendingDraftCount}</span>}
          </Link>
          <div className={styles.childTabs} role="tablist" aria-label="Choose a child">
            {(["khalil", "mekhi"] as const).map((child) => (
              <button
                key={child}
                type="button"
                role="tab"
                aria-selected={activeChild === child}
                aria-controls="school-week-panel"
                onClick={() => {
                  setSyncError("");
                  setActiveChild(child);
                }}
              >
                {weeks[child].child}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={styles.content} id="school-week-panel" role="tabpanel" aria-busy={isPending}>
        <div className={styles.mainColumn}>
          <section className={`${styles.action} ${allTasksDone ? styles.actionComplete : ""}`} aria-labelledby="school-action-title">
            <div className={styles.actionIcon} aria-hidden="true"><ActionIcon size={21} /></div>
            <div className={styles.actionCopy} aria-live="polite">
              <span>{allTasksDone ? "Week complete" : week.child === "Khalil" ? "Family action" : "Due next"}</span>
              <h2 id="school-action-title">{nextTask?.actionTitle || "Everything due this week is done"}</h2>
              <p>{nextTask?.actionNote || "Every assignment and family action is checked off."}</p>
            </div>
            <div className={styles.actionControls}>
              <strong className={styles.dateChip}>{nextTask?.dueLabel || "All done"}</strong>
              {nextTask && (
                <button
                  type="button"
                  className={styles.completeButton}
                  disabled={isPending}
                  onClick={() => toggleTask(nextTask.id, true)}
                >
                  <Check size={17} aria-hidden="true" />
                  Mark done
                </button>
              )}
            </div>
            {syncError && <p className={styles.syncError} role="alert">{syncError}</p>}
          </section>

          <section className={styles.learning} aria-labelledby="learning-title">
            <div className={styles.sectionHead}>
              <h2 id="learning-title">Learning this week</h2>
              <span>{week.subjects.length} subjects</span>
            </div>

            <div className={styles.learningGrid}>
              {week.subjects.map((subject, index) => {
                const SubjectIcon = ICONS[subject.icon];
                return (
                  <article className={styles.subject} key={subject.name}>
                    <div className={styles.subjectTop}>
                      <span className={`${styles.subjectIcon} ${index % 2 === 1 ? styles.green : ""}`} aria-hidden="true">
                        <SubjectIcon size={18} />
                      </span>
                      <h3>{subject.name}</h3>
                    </div>
                    <ul>
                      {subject.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className={styles.rail} aria-label="School dates and reminders">
          <section className={styles.railSection}>
            <h2>Important dates</h2>
            <div className={styles.timeline}>
              {week.dates.map((date, index) => {
                const taskDone = Boolean(date.task && completed.has(date.task.id));
                return (
                  <div
                    className={`${styles.dateRow} ${date.schoolClosed ? styles.closed : ""} ${taskDone ? styles.taskDone : ""}`}
                    key={`${date.month}-${date.day}-${date.title}-${index}`}
                  >
                    <span className={styles.dateBox}>{date.month}<strong>{date.day}</strong></span>
                    <span className={styles.dateCopy}><strong>{date.title}</strong><span>{date.detail}</span></span>
                    {date.task && (
                      <button
                        type="button"
                        className={styles.taskCheck}
                        aria-label={`${taskDone ? "Mark incomplete" : "Mark complete"}: ${date.title}`}
                        aria-pressed={taskDone}
                        disabled={isPending}
                        onClick={() => toggleTask(date.task!.id, !taskDone)}
                      >
                        <Check size={17} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.railSection}>
            <h2>Family reminders</h2>
            <ul className={styles.reminders}>
              {week.reminders.map((reminder) => {
                const ReminderIcon = ICONS[reminder.icon];
                return (
                  <li key={reminder.text}>
                    <ReminderIcon size={17} aria-hidden="true" />
                    <span>
                      {reminder.text}
                      {reminder.href && (
                        <a href={reminder.href} target="_blank" rel="noreferrer">{reminder.linkLabel}</a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={`${styles.railSection} ${styles.teacherCard}`}>
            <div className={styles.teacher}>
              <span className={styles.avatar} aria-hidden="true">{week.teacher.initials}</span>
              <div><strong>{week.teacher.name}</strong><span>{week.teacher.role}</span></div>
            </div>
            <details className={styles.source} open>
              <summary>Teacher&rsquo;s original note</summary>
              <p>{week.teacher.note}</p>
            </details>
          </section>
        </aside>
      </div>
    </main>
  );
}
