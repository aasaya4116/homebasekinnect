"use server";

import { revalidatePath } from "next/cache";
import type { SchoolChildKey } from "@/lib/school";
import { appendSchoolTaskLog } from "@/lib/schoolProgress";
import { getPublishedSchoolWeeks, setSchoolDraftStatus } from "@/lib/schoolStore";
import { schoolTaskIds } from "@/lib/schoolValidation";

function isChildKey(value: string): value is SchoolChildKey {
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

  const week = (await getPublishedSchoolWeeks())[childKey];
  const validTask = schoolTaskIds(week).includes(taskId);
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

function validImportId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Homebase is currently a trusted household surface. Import creation is
 * separately protected by SCHOOL_IMPORT_SECRET; these actions can only change
 * the status of a server-validated draft already in the family Sheet. */
export async function publishSchoolDraftAction(importId: string): Promise<void> {
  if (!validImportId(importId)) throw new Error("Invalid school update");
  await setSchoolDraftStatus(importId, "published");
  revalidatePath("/school");
  revalidatePath("/school/review");
}

export async function archiveSchoolDraftAction(importId: string): Promise<void> {
  if (!validImportId(importId)) throw new Error("Invalid school update");
  await setSchoolDraftStatus(importId, "archived");
  revalidatePath("/school");
  revalidatePath("/school/review");
}
