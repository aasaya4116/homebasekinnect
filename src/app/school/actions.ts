"use server";

import { revalidatePath } from "next/cache";
import { SCHOOL_WEEKS } from "@/lib/school";
import { appendSchoolTaskLog } from "@/lib/schoolProgress";

type ChildKey = keyof typeof SCHOOL_WEEKS;

function isChildKey(value: string): value is ChildKey {
  return value === "khalil" || value === "mekhi";
}

/** The wall display is a trusted household surface, like the Chores page.
 * Still validate every client-supplied task against the authored weekly data
 * before allowing it into the shared completion log. */
export async function toggleSchoolTaskAction(
  taskId: string,
  childKey: string,
  done: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isChildKey(childKey)) return { success: false, error: "Unknown child" };

  const week = SCHOOL_WEEKS[childKey];
  const validTask = week.dates.some((date) => date.task?.id === taskId);
  if (!validTask) return { success: false, error: "Unknown school task" };

  try {
    await appendSchoolTaskLog(taskId, week.child, week.weekId, done);
    revalidatePath("/school");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle school task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update the school task",
    };
  }
}
