"use client";

import { useState } from "react";
import {
  Backpack,
  BookCheck,
  BookOpen,
  Calculator,
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
import type { SchoolIcon, SchoolWeek as SchoolWeekData } from "@/lib/school";
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

type ChildKey = "khalil" | "mekhi";

export default function SchoolWeek({ weeks }: { weeks: Record<ChildKey, SchoolWeekData> }) {
  const [activeChild, setActiveChild] = useState<ChildKey>("khalil");
  const week = weeks[activeChild];
  const ActionIcon = ICONS[week.action.icon];

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.overline}>School week</span>
          <h1>{week.child}&rsquo;s week at school</h1>
          <p className={styles.weekMeta}>{week.meta}</p>
        </div>

        <div className={styles.childTabs} role="tablist" aria-label="Choose a child">
          {(["khalil", "mekhi"] as const).map((child) => (
            <button
              key={child}
              type="button"
              role="tab"
              aria-selected={activeChild === child}
              aria-controls="school-week-panel"
              onClick={() => setActiveChild(child)}
            >
              {weeks[child].child}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.content} id="school-week-panel" role="tabpanel">
        <div className={styles.mainColumn}>
          <section className={styles.action} aria-labelledby="school-action-title">
            <div className={styles.actionIcon} aria-hidden="true"><ActionIcon size={21} /></div>
            <div className={styles.actionCopy}>
              <span>{week.action.label}</span>
              <h2 id="school-action-title">{week.action.title}</h2>
              <p>{week.action.note}</p>
            </div>
            <strong className={styles.dateChip}>{week.action.date}</strong>
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
              {week.dates.map((date, index) => (
                <div className={`${styles.dateRow} ${date.schoolClosed ? styles.closed : ""}`} key={`${date.month}-${date.day}-${date.title}-${index}`}>
                  <span className={styles.dateBox}>{date.month}<strong>{date.day}</strong></span>
                  <span className={styles.dateCopy}><strong>{date.title}</strong><span>{date.detail}</span></span>
                </div>
              ))}
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
