import type { Metadata } from "next";
import ChessAdventure from "@/components/ChessAdventure";
import { todayStr } from "@/lib/dates";
import { getChessLearningSnapshot } from "@/lib/chessProgress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chess Adventure | ASAYA Homebase KINnect",
  description: "A shared family chess journey with quick daily quests.",
};

export default async function ChessPage() {
  const today = todayStr();
  const snapshot = await getChessLearningSnapshot(today);
  return <ChessAdventure initialSnapshot={snapshot} todayKey={today} />;
}
