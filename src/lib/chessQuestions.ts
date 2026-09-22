export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
};

/** Extra beginner questions mixed with the original quizzes in Chess Adventure.
 * Keeping these curated makes the experience predictable, fast, and free. */
export const ADDITIONAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "starting-piece-count",
    prompt: "How many pieces does each player begin a chess game with?",
    choices: ["8", "12", "16", "20"],
    answer: "16",
    explanation: "Each side starts with eight pawns and eight other pieces, for 16 total.",
  },
  {
    id: "starting-pawn-count",
    prompt: "How many pawns does each player have at the start?",
    choices: ["6", "8", "10", "12"],
    answer: "8",
    explanation: "Eight pawns begin across the second rank for White and the seventh rank for Black.",
  },
  {
    id: "pawn-first-move",
    prompt: "How far may a pawn move on its very first move?",
    choices: ["One or two squares", "Exactly three squares", "Any distance", "Only diagonally"],
    answer: "One or two squares",
    explanation: "A pawn may move one square, or two squares from its starting position if the path is clear.",
  },
  {
    id: "pawn-promotion",
    prompt: "What happens when a pawn reaches the farthest rank?",
    choices: ["It promotes", "It moves backward", "It becomes a king", "The game ends"],
    answer: "It promotes",
    explanation: "The pawn promotes, usually to a queen, but it may also become a rook, bishop, or knight.",
  },
  {
    id: "castling-pieces",
    prompt: "Which two pieces move when you castle?",
    choices: ["King and rook", "King and queen", "Queen and bishop", "Rook and knight"],
    answer: "King and rook",
    explanation: "Castling is the only move where the king and a rook move together.",
  },
  {
    id: "castling-purpose",
    prompt: "What is the main reason to castle early?",
    choices: ["Protect the king", "Win a pawn", "Trade queens", "Promote a pawn"],
    answer: "Protect the king",
    explanation: "Castling usually moves the king toward safety and brings a rook closer to the center.",
  },
  {
    id: "checkmate-meaning",
    prompt: "What does checkmate mean?",
    choices: ["The king is attacked and cannot escape", "Both queens are gone", "A pawn reached the end", "The board is tied"],
    answer: "The king is attacked and cannot escape",
    explanation: "Checkmate ends the game because the checked king has no legal way to become safe.",
  },
  {
    id: "stalemate-meaning",
    prompt: "What is stalemate?",
    choices: ["A draw with no legal move and no check", "A king in check", "A queen trade", "Three checks in a row"],
    answer: "A draw with no legal move and no check",
    explanation: "Stalemate is a draw when the player to move is not in check but has no legal move.",
  },
  {
    id: "queen-value",
    prompt: "About how many points is a queen usually worth?",
    choices: ["3", "5", "9", "12"],
    answer: "9",
    explanation: "The usual guide is queen 9, rook 5, and bishop or knight about 3.",
  },
  {
    id: "rook-value",
    prompt: "About how many points is a rook usually worth?",
    choices: ["1", "3", "5", "9"],
    answer: "5",
    explanation: "A rook is normally valued at about five points.",
  },
  {
    id: "minor-piece-value",
    prompt: "About how many points is a bishop or knight usually worth?",
    choices: ["1", "3", "5", "9"],
    answer: "3",
    explanation: "Bishops and knights are minor pieces and are each worth roughly three points.",
  },
  {
    id: "hanging-piece",
    prompt: "What is a hanging piece?",
    choices: ["A piece that can be captured for free", "A piece on the edge", "A promoted pawn", "A piece giving check"],
    answer: "A piece that can be captured for free",
    explanation: "A hanging piece is undefended or insufficiently defended and can be won without a fair trade.",
  },
  {
    id: "pin-definition",
    prompt: "What is a pin in chess?",
    choices: ["A piece cannot safely move because something valuable is behind it", "Two pieces attack each other", "A pawn reaches the last rank", "The king castles"],
    answer: "A piece cannot safely move because something valuable is behind it",
    explanation: "A pinned piece is stuck because moving it would expose a more valuable piece, often the king.",
  },
  {
    id: "skewer-definition",
    prompt: "What happens in a skewer?",
    choices: ["A valuable piece moves and exposes another piece", "A knight jumps over a pawn", "Two pawns protect each other", "A king becomes stalemated"],
    answer: "A valuable piece moves and exposes another piece",
    explanation: "A skewer attacks a valuable piece first; when it moves, a piece behind it can be captured.",
  },
  {
    id: "discovered-attack",
    prompt: "What creates a discovered attack?",
    choices: ["Moving one piece reveals an attack from another", "Moving the same piece twice", "Trading equal pieces", "Castling queenside"],
    answer: "Moving one piece reveals an attack from another",
    explanation: "The moved piece uncovers a rook, bishop, or queen that was waiting behind it.",
  },
  {
    id: "answering-check",
    prompt: "Which is a legal way to answer a check?",
    choices: ["Move the king to safety", "Ignore it and attack", "Skip the turn", "Move any pawn"],
    answer: "Move the king to safety",
    explanation: "You must remove the check by moving the king, capturing the attacker, or blocking the attack when possible.",
  },
  {
    id: "opening-development",
    prompt: "Which pieces should usually develop early in the opening?",
    choices: ["Knights and bishops", "Only the queen", "Only the rooks", "The king into the center"],
    answer: "Knights and bishops",
    explanation: "Developing knights and bishops helps control the center and prepares castling.",
  },
  {
    id: "opening-center",
    prompt: "Why is controlling the center useful?",
    choices: ["Pieces gain more useful routes", "The board becomes smaller", "Pawns can move backward", "It ends the game immediately"],
    answer: "Pieces gain more useful routes",
    explanation: "Central control gives pieces space and helps them reach both sides of the board.",
  },
  {
    id: "early-queen",
    prompt: "Why can bringing the queen out too early be risky?",
    choices: ["The opponent can attack it while developing", "The queen loses its powers", "It cannot move backward", "It causes stalemate"],
    answer: "The opponent can attack it while developing",
    explanation: "Repeatedly moving an attacked queen can cost time while the opponent develops pieces.",
  },
  {
    id: "knight-edge",
    prompt: "Where does a knight usually have more possible moves?",
    choices: ["Near the center", "In a corner", "On the back rank only", "Next to its king"],
    answer: "Near the center",
    explanation: "A centralized knight can reach up to eight squares, while a corner knight reaches only two.",
  },
  {
    id: "opposite-bishop-colors",
    prompt: "Can one bishop move onto both light and dark squares?",
    choices: ["No", "Yes, after capturing", "Yes, after castling", "Only in check"],
    answer: "No",
    explanation: "A bishop stays on the same square color for the entire game.",
  },
  {
    id: "rook-open-file",
    prompt: "Where is a rook often strongest?",
    choices: ["On an open file", "Behind blocked pawns", "In a corner all game", "Directly beside an enemy pawn"],
    answer: "On an open file",
    explanation: "An open file has no pawns blocking the rook's long-range movement.",
  },
  {
    id: "trade-when-ahead",
    prompt: "When you are ahead in material, what is often a helpful plan?",
    choices: ["Trade pieces", "Give pieces away", "Avoid king safety", "Move only pawns"],
    answer: "Trade pieces",
    explanation: "Trading pieces can reduce the opponent's attacking chances while preserving your material advantage.",
  },
  {
    id: "before-every-move",
    prompt: "What should you check before making your move?",
    choices: ["Checks, captures, and threats", "Only your clock", "Only pawn moves", "Whether queens were traded"],
    answer: "Checks, captures, and threats",
    explanation: "Scanning checks, captures, and threats helps you notice urgent opportunities and dangers.",
  },
];

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const shuffled = [...items];
  let state = hashSeed(seed) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function uniqueQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return Array.from(new Map(questions.map((question) => [question.id, question])).values());
}

/** Pick unseen questions first, then refill with the least-recently seen ones.
 * The returned history is newest-first and starts a new cycle when necessary. */
export function selectQuizQuestions(
  bank: QuizQuestion[],
  recentIds: string[],
  seed: string,
  count = 4
): { questions: QuizQuestion[]; recentIds: string[]; startedNewCycle: boolean } {
  const uniqueBank = uniqueQuizQuestions(bank);
  const validIds = new Set(uniqueBank.map((question) => question.id));
  const recent = Array.from(new Set(recentIds)).filter((id) => validIds.has(id));
  const recentSet = new Set(recent);
  const unseen = seededShuffle(
    uniqueBank.filter((question) => !recentSet.has(question.id)),
    `${seed}-unseen`
  );
  const selected = unseen.slice(0, count);
  const startedNewCycle = selected.length < Math.min(count, uniqueBank.length);

  if (selected.length < count) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const recentRank = new Map(recent.map((id, index) => [id, index]));
    const fallback = seededShuffle(
      uniqueBank.filter((question) => !selectedIds.has(question.id)),
      `${seed}-refill`
    ).sort(
      (a, b) => (recentRank.get(b.id) ?? Number.MAX_SAFE_INTEGER) - (recentRank.get(a.id) ?? Number.MAX_SAFE_INTEGER)
    );
    selected.push(...fallback.slice(0, count - selected.length));
  }

  const selectedIds = selected.map((question) => question.id);
  return {
    questions: selected,
    recentIds: Array.from(new Set([
      ...selectedIds,
      ...(startedNewCycle ? [] : recent),
    ])).slice(0, uniqueBank.length),
    startedNewCycle,
  };
}
