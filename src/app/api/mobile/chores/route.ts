import { appendChoreLog, getChoreBoards } from "@/lib/chores";
import { todayStr } from "@/lib/dates";
import { privateJson, requireMobileUser } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const choreId = typeof body?.choreId === "string" ? body.choreId.trim() : "";
  const kid = typeof body?.kid === "string" ? body.kid.trim() : "";
  const done = body?.done;
  if (!choreId || !kid || typeof done !== "boolean") {
    return privateJson({ error: "Invalid chore update" }, { status: 400 });
  }

  const date = todayStr();
  const boards = await getChoreBoards(date);
  const board = boards.find((candidate) => candidate.kid === kid);
  const chore = [...(board?.scheduled || []), ...(board?.asNeeded || [])].find(
    (candidate) => candidate.id === choreId
  );
  if (!board || !chore) {
    return privateJson({ error: "Chore not found" }, { status: 404 });
  }

  await appendChoreLog(date, chore.id, board.kid, done, chore.allowance);
  return privateJson({ chores: await getChoreBoards(date) });
}
