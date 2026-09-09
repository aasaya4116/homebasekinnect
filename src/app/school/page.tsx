import type { Metadata } from "next";
import SchoolWeek from "@/components/SchoolWeek";
import { SCHOOL_WEEKS } from "@/lib/school";
import { getCompletedSchoolTaskIds } from "@/lib/schoolProgress";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "School Week · Homebase Kinnect",
  description: "Weekly school updates, family actions, and important dates for Khalil and Mekhi.",
};

export default async function SchoolPage() {
  const completedTaskIds = await getCompletedSchoolTaskIds();
  return <SchoolWeek weeks={SCHOOL_WEEKS} completedTaskIds={completedTaskIds} />;
}
