import type { Metadata } from "next";
import SchoolWeek from "@/components/SchoolWeek";
import { SCHOOL_WEEKS } from "@/lib/school";

export const metadata: Metadata = {
  title: "School Week · Homebase Kinnect",
  description: "Weekly school updates, family actions, and important dates for Khalil and Mekhi.",
};

export default function SchoolPage() {
  return <SchoolWeek weeks={SCHOOL_WEEKS} />;
}
