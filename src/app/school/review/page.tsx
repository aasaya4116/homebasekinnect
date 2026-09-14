import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Inbox } from "lucide-react";
import SchoolDraftActions from "@/components/SchoolDraftActions";
import { getPendingSchoolDrafts } from "@/lib/schoolStore";
import styles from "./review.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "School Update Inbox · Homebase Kinnect",
  description: "Review teacher-email imports before publishing them to the family dashboard.",
};

function receivedLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently received";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export default async function SchoolReviewPage() {
  const drafts = await getPendingSchoolDrafts();
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <Link className={styles.backLink} href="/school"><ArrowLeft size={16} /> School week</Link>
          <span className={styles.overline}>Review before publishing</span>
          <h1>School update inbox</h1>
          <p>Teacher emails land here as drafts. Nothing changes on the family dashboard until you approve it.</p>
        </div>
        <span className={styles.count}><Inbox size={18} /> {drafts.length} waiting</span>
      </header>

      {drafts.length === 0 ? (
        <section className={styles.empty}>
          <CheckCircle2 size={34} />
          <h2>You&rsquo;re all caught up</h2>
          <p>The next labeled teacher email will appear here after it is extracted.</p>
        </section>
      ) : (
        <div className={styles.draftList}>
          {drafts.map((draft) => (
            <article className={styles.draft} key={draft.importId}>
              <div className={styles.draftHead}>
                <div>
                  <span className={styles.child}>{draft.week.child}</span>
                  <h2>{draft.week.meta}</h2>
                  <p>{draft.subject || "Weekly teacher update"} · {receivedLabel(draft.importedAt)}</p>
                </div>
                <SchoolDraftActions importId={draft.importId} />
              </div>

              {draft.warnings.length > 0 && (
                <div className={styles.warnings}>
                  <AlertTriangle size={18} aria-hidden="true" />
                  <div><strong>Check these details</strong>{draft.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
                </div>
              )}

              <div className={styles.previewGrid}>
                <section>
                  <h3>Learning</h3>
                  {draft.week.subjects.map((subject) => (
                    <div className={styles.previewGroup} key={subject.name}>
                      <strong>{subject.name}</strong>
                      <ul>{subject.points.map((point) => <li key={point}>{point}</li>)}</ul>
                    </div>
                  ))}
                </section>
                <section>
                  <h3>Dates & tasks</h3>
                  {draft.week.dates.map((date, index) => (
                    <div className={styles.previewDate} key={`${date.month}-${date.day}-${date.title}-${index}`}>
                      <span>{date.month} <strong>{date.day}</strong></span>
                      <div><strong>{date.title}</strong><small>{date.detail}</small>{date.task && <em>Can be checked off</em>}</div>
                    </div>
                  ))}
                </section>
                <section>
                  <h3>Family reminders</h3>
                  <ul>{draft.week.reminders.map((reminder) => <li key={reminder.text}>{reminder.text}</li>)}</ul>
                  <div className={styles.teacher}><strong>{draft.week.teacher.name}</strong><span>{draft.week.teacher.note}</span></div>
                  {draft.sourceUrl && <a className={styles.sourceLink} href={draft.sourceUrl} target="_blank" rel="noreferrer">Open original email</a>}
                </section>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
