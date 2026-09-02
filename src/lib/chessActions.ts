"use server";

import { recordChessSession } from "./chessProgress";
import type { ChessLearningSnapshot, ChessSessionInput } from "./chessShared";

export async function recordChessSessionAction(
  input: ChessSessionInput
): Promise<{ ok: true; snapshot: ChessLearningSnapshot } | { ok: false; message: string }> {
  try {
    const snapshot = await recordChessSession(input);
    return { ok: true, snapshot };
  } catch (error) {
    console.error("Failed to record chess session:", error);
    return { ok: false, message: "Progress is saved on this screen and will sync next time." };
  }
}
