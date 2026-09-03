export const CHESS_PLAYERS = ["Mekhi", "Khalil", "Mom", "Dad"] as const;

export type ChessPlayer = (typeof CHESS_PLAYERS)[number];
export type ChessSkill = "Knight" | "Rook" | "Bishop" | "Fork" | "Fundamentals";

export type SkillMastery = Record<ChessSkill, number>;

export type ChessPlayerProgress = {
  xp: number;
  completed: string[];
  streak: number;
  lastPractice: string;
  mastery: SkillMastery;
  totalSessions: number;
};

export type ChessLearningSnapshot = {
  players: Record<string, ChessPlayerProgress>;
  recentPracticeIds: Record<string, string[]>;
  weeklySessions: number;
  weeklyXp: number;
};

export type ChessSessionInput = {
  player: ChessPlayer;
  questId: string;
  skill: ChessSkill;
  score: number;
  maxScore: number;
  attempts: number;
  xpEarned: number;
  completedQuests: string[];
  totalXp: number;
  practicedOn: string;
};

export function emptyMastery(): SkillMastery {
  return { Knight: 0, Rook: 0, Bishop: 0, Fork: 0, Fundamentals: 0 };
}

export function emptyPlayerProgress(): ChessPlayerProgress {
  return {
    xp: 0,
    completed: [],
    streak: 0,
    lastPractice: "",
    mastery: emptyMastery(),
    totalSessions: 0,
  };
}

export function emptyChessSnapshot(): ChessLearningSnapshot {
  return {
    players: Object.fromEntries(CHESS_PLAYERS.map((player) => [player, emptyPlayerProgress()])),
    recentPracticeIds: Object.fromEntries(CHESS_PLAYERS.map((player) => [player, []])),
    weeklySessions: 0,
    weeklyXp: 0,
  };
}
