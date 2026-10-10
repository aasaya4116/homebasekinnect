import { getCompletedSchoolTaskIds } from "@/lib/schoolProgress";
import { getSchoolDashboardData } from "@/lib/schoolStore";
import { privateJson, requireMobileUser } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (auth.response) return auth.response;

  const [{ weeks, drafts }, completedTaskIds] = await Promise.all([
    getSchoolDashboardData(),
    getCompletedSchoolTaskIds(),
  ]);

  return privateJson({ weeks, completedTaskIds, pendingDraftCount: drafts.length });
}
