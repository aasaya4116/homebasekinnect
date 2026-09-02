import type { Metadata } from "next";
import ChessAdventure from "@/components/ChessAdventure";

export const metadata: Metadata = {
  title: "Chess Adventure | ASAYA Homebase KINnect",
  description: "A shared family chess journey with quick daily quests.",
};

export default function ChessPage() {
  return <ChessAdventure />;
}
