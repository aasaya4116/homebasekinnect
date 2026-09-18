"use server";

import { revalidatePath } from "next/cache";
import { appendGoalProgress } from "@/lib/goalProgress";
import { goalFor } from "@/lib/goals";

export async function setGoalProgressAction(
  personKey: string,
  goalId: string,
  requestedValue: number
): Promise<{ success: boolean; value?: number; error?: string }> {
  const goal = goalFor(personKey, goalId);
  if (!goal) return { success: false, error: "Unknown goal" };
  if (!Number.isFinite(requestedValue)) return { success: false, error: "Invalid progress" };

  const value = Math.min(goal.target, Math.max(0, Math.round(requestedValue)));
  try {
    await appendGoalProgress(goal.id, personKey, value);
    revalidatePath("/goals");
    return { success: true, value };
  } catch (error: unknown) {
    console.error("Failed to update goal progress:", error);
    return { success: false, error: "Could not save that progress" };
  }
}
