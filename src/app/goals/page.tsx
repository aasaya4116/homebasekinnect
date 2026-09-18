import type { Metadata } from "next";
import GoalsBoard from "@/components/GoalsBoard";
import { getGoalProgress } from "@/lib/goalProgress";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "2026 Goals · Homebase Kinnect",
  description: "Family goals and progress for Khalil, Mekhi, and Latoya.",
};

export default async function GoalsPage() {
  const progress = await getGoalProgress();
  return <GoalsBoard initialProgress={progress} />;
}
