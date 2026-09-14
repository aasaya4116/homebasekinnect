"use client";

import { useFormStatus } from "react-dom";
import { archiveSchoolDraftAction, publishSchoolDraftAction } from "@/app/school/actions";
import styles from "@/app/school/review/review.module.css";

function SubmitButton({ children, tone }: { children: React.ReactNode; tone: "primary" | "quiet" }) {
  const { pending } = useFormStatus();
  return (
    <button className={tone === "primary" ? styles.publishButton : styles.dismissButton} disabled={pending}>
      {pending ? "Working…" : children}
    </button>
  );
}

export default function SchoolDraftActions({ importId }: { importId: string }) {
  const publish = publishSchoolDraftAction.bind(null, importId);
  const archive = archiveSchoolDraftAction.bind(null, importId);
  return (
    <div className={styles.actions}>
      <form action={archive}><SubmitButton tone="quiet">Dismiss</SubmitButton></form>
      <form action={publish}><SubmitButton tone="primary">Publish week</SubmitButton></form>
    </div>
  );
}
