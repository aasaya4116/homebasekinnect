import { appendSchoolTaskLog, getCompletedSchoolTaskIds } from "@/lib/schoolProgress";
import type { SchoolChildKey } from "@/lib/school";
import { getPublishedSchoolWeeks } from "@/lib/schoolStore";
import { schoolTaskIds } from "@/lib/schoolValidation";
import { privateJson, requireMobileUser } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";
  const childKey = body?.childKey === "khalil" || body?.childKey === "mekhi"
    ? (body.childKey as SchoolChildKey)
    : null;
  const done = body?.done;
  if (!taskId || !childKey || typeof done !== "boolean") {
    return privateJson({ error: "Invalid school task update" }, { status: 400 });
  }

  const weeks = await getPublishedSchoolWeeks();
  const week = weeks[childKey];
  if (!schoolTaskIds(week).includes(taskId)) {
    return privateJson({ error: "School task not found" }, { status: 404 });
  }

  await appendSchoolTaskLog(taskId, week.child, week.weekId, done);
  return privateJson({ completedTaskIds: await getCompletedSchoolTaskIds() });
}
