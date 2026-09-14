import type { Metadata } from "next";
import SchoolWeek from "@/components/SchoolWeek";
import { getCompletedSchoolTaskIds } from "@/lib/schoolProgress";
import { getSchoolDashboardData } from "@/lib/schoolStore";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "School Week · Homebase Kinnect",
  description: "Weekly school updates, family actions, and important dates for Khalil and Mekhi.",
};

export default async function SchoolPage() {
  const [completedTaskIds, dashboard] = await Promise.all([
    getCompletedSchoolTaskIds(),
    getSchoolDashboardData(),
  ]);
  return (
    <SchoolWeek
      weeks={dashboard.weeks}
      completedTaskIds={completedTaskIds}
      pendingDraftCount={dashboard.drafts.length}
    />
  );
}
