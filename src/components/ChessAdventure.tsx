"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Crown,
  Lightbulb,
  Lock,
  RotateCcw,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { recordChessSessionAction } from "@/lib/chessActions";
import {
  CHESS_PLAYERS,
  emptyPlayerProgress,
  type ChessLearningSnapshot,
  type ChessPlayer,
  type ChessPlayerProgress,
  type ChessSkill,
} from "@/lib/chessShared";

type Color = "white" | "black";
type PieceKind = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

type Piece = {
  color: Color;
  kind: PieceKind;
};

type QuestBase = {
  id: string;
  number: number;
  title: string;
  eyebrow: string;
  lesson: string;
  prompt: string;
  reward: number;
  skill: ChessSkill;
};

type MoveQuest = QuestBase & {
  kind: "move";
  hint: string;
  from: string;
  to: string;
  pieces: Record<string, Piece>;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type QuizQuest = QuestBase & {
  kind: "quiz";
  questions: QuizQuestion[];
};

type Quest = MoveQuest | QuizQuest;

type ProgressMap = Record<string, ChessPlayerProgress>;

const STORAGE_KEY = "homebase-chess-adventure-v1";
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const PIECE_GLYPHS: Record<Color, Record<PieceKind, string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

const QUESTS: Quest[] = [
  {
    kind: "move",
    id: "knight-leap",
    number: 1,
    title: "The Knight's First Leap",
    eyebrow: "Movement trail",
    lesson: "Knights jump in an L: two squares one way, then one to the side.",
    prompt: "Wake the knight and move it from g1 to f3.",
    skill: "Knight",
    hint: "Knights are the only pieces that can leap over others.",
    reward: 20,
    from: "g1",
    to: "f3",
    pieces: {
      e1: { color: "white", kind: "king" },
      f1: { color: "white", kind: "bishop" },
      g1: { color: "white", kind: "knight" },
      h1: { color: "white", kind: "rook" },
      f2: { color: "white", kind: "pawn" },
      g2: { color: "white", kind: "pawn" },
      h2: { color: "white", kind: "pawn" },
      e8: { color: "black", kind: "king" },
    },
  },
  {
    kind: "move",
    id: "rook-road",
    number: 2,
    title: "The Rook's Open Road",
    eyebrow: "Capture trail",
    lesson: "Rooks race in straight lines across ranks and files.",
    prompt: "Send the rook from a1 to capture the bishop on a7.",
    skill: "Rook",
    hint: "Stay on the a-file. The road is completely clear.",
    reward: 25,
    from: "a1",
    to: "a7",
    pieces: {
      a1: { color: "white", kind: "rook" },
      e1: { color: "white", kind: "king" },
      a7: { color: "black", kind: "bishop" },
      e8: { color: "black", kind: "king" },
      h7: { color: "black", kind: "pawn" },
    },
  },
  {
    kind: "move",
    id: "bishop-diagonal",
    number: 3,
    title: "The Bishop's Hidden Path",
    eyebrow: "Tactics trail",
    lesson: "Bishops glide diagonally and always stay on their starting color.",
    prompt: "Move the bishop from c4 to f7 and win the loose pawn.",
    skill: "Bishop",
    hint: "Trace the diagonal: d5, e6, f7.",
    reward: 30,
    from: "c4",
    to: "f7",
    pieces: {
      e1: { color: "white", kind: "king" },
      c4: { color: "white", kind: "bishop" },
      e8: { color: "black", kind: "king" },
      f7: { color: "black", kind: "pawn" },
      g7: { color: "black", kind: "pawn" },
    },
  },
  {
    kind: "move",
    id: "royal-fork",
    number: 4,
    title: "The Royal Fork",
    eyebrow: "Boss quest",
    lesson: "A fork attacks two valuable pieces at the same time.",
    prompt: "Leap from c7 to e6 to fork the king and queen.",
    skill: "Fork",
    hint: "From e6, the knight attacks both f8 and d8.",
    reward: 50,
    from: "c7",
    to: "e6",
    pieces: {
      e1: { color: "white", kind: "king" },
      c7: { color: "white", kind: "knight" },
      f8: { color: "black", kind: "king" },
      d8: { color: "black", kind: "queen" },
      f7: { color: "black", kind: "pawn" },
    },
  },
  {
    kind: "quiz",
    id: "scholars-trial",
    number: 5,
    title: "The Scholar's Trial",
    eyebrow: "Knowledge check",
    lesson: "Bring the whole trail together: movement, captures, and tactical ideas.",
    prompt: "Answer at least 3 of 4 questions correctly to complete the adventure.",
    skill: "Fundamentals",
    reward: 75,
    questions: [
      {
        id: "jumping-piece",
        prompt: "Which piece is the only one that can jump over other pieces?",
        choices: ["Bishop", "Knight", "Rook", "Queen"],
        answer: "Knight",
        explanation: "The knight leaps in an L-shape, even when pieces stand between it and its destination.",
      },
      {
        id: "straight-lines",
        prompt: "Which piece travels in straight lines along ranks and files?",
        choices: ["Pawn", "Bishop", "Rook", "Knight"],
        answer: "Rook",
        explanation: "The rook moves any number of open squares horizontally or vertically.",
      },
      {
        id: "diagonal-piece",
        prompt: "Which piece always moves diagonally and stays on the same square color?",
        choices: ["King", "Bishop", "Rook", "Knight"],
        answer: "Bishop",
        explanation: "A bishop glides diagonally, so it remains on light squares or dark squares for the whole game.",
      },
      {
        id: "fork-definition",
        prompt: "What makes a move a fork?",
        choices: [
          "It protects the king",
          "It trades equal pieces",
          "It attacks two pieces at once",
          "It blocks a pawn",
        ],
        answer: "It attacks two pieces at once",
        explanation: "A fork creates two threats with one piece, forcing the opponent to leave something unprotected.",
      },
    ],
  },
];

function freshProgress(): ProgressMap {
  return Object.fromEntries(CHESS_PLAYERS.map((player) => [player, emptyPlayerProgress()]));
}

function previousDay(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function mergePlayerProgress(
  cloud: ChessPlayerProgress | undefined,
  local: ChessPlayerProgress | undefined
): ChessPlayerProgress {
  const base = emptyPlayerProgress();
  const remote = { ...base, ...cloud, mastery: { ...base.mastery, ...cloud?.mastery } };
  const saved = { ...base, ...local, mastery: { ...base.mastery, ...local?.mastery } };
  const localIsNewer = saved.lastPractice >= remote.lastPractice;
  return {
    xp: Math.max(remote.xp, saved.xp),
    completed: Array.from(new Set([...remote.completed, ...saved.completed])),
    streak: localIsNewer ? Math.max(remote.streak, saved.streak) : remote.streak,
    lastPractice: localIsNewer ? saved.lastPractice : remote.lastPractice,
    mastery: {
      Knight: Math.max(remote.mastery.Knight, saved.mastery.Knight),
      Rook: Math.max(remote.mastery.Rook, saved.mastery.Rook),
      Bishop: Math.max(remote.mastery.Bishop, saved.mastery.Bishop),
      Fork: Math.max(remote.mastery.Fork, saved.mastery.Fork),
      Fundamentals: Math.max(remote.mastery.Fundamentals, saved.mastery.Fundamentals),
    },
    totalSessions: Math.max(remote.totalSessions, saved.totalSessions),
  };
}

function mergeProgressMaps(cloud: ProgressMap, local?: ProgressMap | null): ProgressMap {
  return Object.fromEntries(
    CHESS_PLAYERS.map((player) => [player, mergePlayerProgress(cloud[player], local?.[player])])
  );
}

function stableDayIndex(value: string, length: number) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % length;
}

function recommendedQuestIndex(progress: ChessPlayerProgress, today: string, player: ChessPlayer) {
  const firstIncomplete = QUESTS.findIndex((quest) => !progress.completed.includes(quest.id));
  if (firstIncomplete >= 0) return firstIncomplete;

  const weakestScore = Math.min(...QUESTS.map((quest) => progress.mastery[quest.skill]));
  const weakest = QUESTS
    .map((quest, index) => ({ index, score: progress.mastery[quest.skill] }))
    .filter((quest) => quest.score === weakestScore);
  return weakest[stableDayIndex(`${today}-${player}`, weakest.length)].index;
}

function updateLocalProgress(
  progress: ChessPlayerProgress,
  quest: Quest,
  score: number,
  maxScore: number,
  passed: boolean,
  today: string
) {
  const firstCompletion = passed && !progress.completed.includes(quest.id);
  const sessionPercent = Math.round((Math.max(0, score) / Math.max(1, maxScore)) * 100);
  const previousMastery = progress.mastery[quest.skill];
  const mastery = {
    ...progress.mastery,
    [quest.skill]: previousMastery === 0
      ? sessionPercent
      : Math.round(previousMastery * 0.65 + sessionPercent * 0.35),
  };
  const streak = progress.lastPractice === today
    ? progress.streak
    : progress.lastPractice === previousDay(today)
      ? progress.streak + 1
      : 1;
  return {
    profile: {
      ...progress,
      xp: progress.xp + (firstCompletion ? quest.reward : 0),
      completed: firstCompletion ? [...progress.completed, quest.id] : progress.completed,
      streak,
      lastPractice: today,
      mastery,
      totalSessions: progress.totalSessions + 1,
    },
    xpEarned: firstCompletion ? quest.reward : 0,
  };
}

function copyPieces(pieces: Record<string, Piece>) {
  return Object.fromEntries(Object.entries(pieces).map(([square, piece]) => [square, { ...piece }]));
}

type ChessAdventureProps = {
  initialSnapshot: ChessLearningSnapshot;
  todayKey: string;
};

export default function ChessAdventure({ initialSnapshot, todayKey }: ChessAdventureProps) {
  const initialProgress = mergeProgressMaps(initialSnapshot.players, freshProgress());
  const [player, setPlayer] = useState<ChessPlayer>("Mekhi");
  const [progress, setProgress] = useState<ProgressMap>(initialProgress);
  const [questIndex, setQuestIndex] = useState(() => recommendedQuestIndex(initialProgress.Mekhi, todayKey, "Mekhi"));
  const [pieces, setPieces] = useState<Record<string, Piece>>(() =>
    QUESTS[questIndex].kind === "move" ? copyPieces(QUESTS[questIndex].pieces) : {}
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Choose the glowing piece to begin.");
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [ready, setReady] = useState(false);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizSelection, setQuizSelection] = useState<string | null>(null);
  const [quizAnswerStatus, setQuizAnswerStatus] = useState<"correct" | "incorrect" | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [weeklySessions, setWeeklySessions] = useState(initialSnapshot.weeklySessions);
  const [weeklyXp, setWeeklyXp] = useState(initialSnapshot.weeklyXp);
  const [syncStatus, setSyncStatus] = useState<"Synced" | "Saving…" | "Saved on this screen">("Synced");

  const quest = QUESTS[questIndex];
  const playerProgress = progress[player] ?? emptyPlayerProgress();
  const dailyQuestIndex = recommendedQuestIndex(playerProgress, todayKey, player);
  const completedCount = playerProgress.completed.length;
  const progressPercent = Math.round((completedCount / QUESTS.length) * 100);
  const quizQuestion = quest.kind === "quiz" ? quest.questions[quizQuestionIndex] : null;

  useEffect(() => {
    let savedProgress: ProgressMap | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedProgress = JSON.parse(saved) as ProgressMap;
    } catch {
      // A private or locked-down kiosk may block storage; the quest still works.
    }

    // Defer the browser-only snapshot until after hydration has settled.
    const timer = window.setTimeout(() => {
      if (savedProgress) {
        const merged = mergeProgressMaps(initialSnapshot.players, savedProgress);
        setProgress(merged);
        const recommended = recommendedQuestIndex(merged.Mekhi, todayKey, "Mekhi");
        const recommendedQuest = QUESTS[recommended];
        setQuestIndex(recommended);
        setPieces(recommendedQuest.kind === "move" ? copyPieces(recommendedQuest.pieces) : {});
        setFeedback(recommendedQuest.kind === "quiz" ? "Answer 3 of 4 correctly to pass." : "Choose the glowing piece to begin.");
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialSnapshot.players, todayKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Keep play available even when the browser cannot persist progress.
    }
  }, [progress, ready]);

  const resetQuest = (nextIndex = questIndex) => {
    const nextQuest = QUESTS[nextIndex];
    setQuestIndex(nextIndex);
    setPieces(nextQuest.kind === "move" ? copyPieces(nextQuest.pieces) : {});
    setSelected(null);
    setFeedback(nextQuest.kind === "quiz" ? "Answer 3 of 4 correctly to pass." : "Choose the glowing piece to begin.");
    setShowHint(false);
    setAttempts(0);
    setWon(false);
    setQuizQuestionIndex(0);
    setQuizSelection(null);
    setQuizAnswerStatus(null);
    setQuizCorrect(0);
    setQuizFinished(false);
  };

  const choosePlayer = (nextPlayer: ChessPlayer) => {
    setPlayer(nextPlayer);
    const nextProgress = progress[nextPlayer] ?? emptyPlayerProgress();
    resetQuest(recommendedQuestIndex(nextProgress, todayKey, nextPlayer));
  };

  const isUnlocked = (index: number) => index === 0 || playerProgress.completed.includes(QUESTS[index - 1].id);

  const chooseQuest = (index: number) => {
    if (isUnlocked(index)) resetQuest(index);
  };

  const recordPractice = (
    practicedQuest: Quest,
    score: number,
    maxScore: number,
    attemptCount: number,
    passed: boolean
  ) => {
    const existing = progress[player] ?? emptyPlayerProgress();
    const { profile, xpEarned } = updateLocalProgress(
      existing,
      practicedQuest,
      score,
      maxScore,
      passed,
      todayKey
    );
    setProgress((current) => ({ ...current, [player]: profile }));
    setWeeklySessions((current) => current + 1);
    setWeeklyXp((current) => current + xpEarned);
    setSyncStatus("Saving…");

    void recordChessSessionAction({
      player,
      questId: practicedQuest.id,
      skill: practicedQuest.skill,
      score,
      maxScore,
      attempts: attemptCount,
      xpEarned,
      completedQuests: profile.completed,
      totalXp: profile.xp,
      practicedOn: todayKey,
    }).then((result) => {
      if (!result.ok) {
        setSyncStatus("Saved on this screen");
        return;
      }
      setProgress((current) => mergeProgressMaps(result.snapshot.players, current));
      setWeeklySessions(result.snapshot.weeklySessions);
      setWeeklyXp(result.snapshot.weeklyXp);
      setSyncStatus("Synced");
    }).catch(() => setSyncStatus("Saved on this screen"));
  };

  const handleSquare = (square: string) => {
    if (won || quest.kind !== "move") return;

    if (!selected) {
      if (square === quest.from && pieces[square]?.color === "white") {
        setSelected(square);
        setFeedback(`Great. Now choose ${quest.to}.`);
      } else {
        setFeedback(`Find the white piece on ${quest.from}.`);
      }
      return;
    }

    if (square === selected) {
      setSelected(null);
      setFeedback("Piece released. Choose it again when you're ready.");
      return;
    }

    setAttempts((current) => current + 1);
    if (selected === quest.from && square === quest.to) {
      const movedPiece = pieces[selected];
      setPieces((current) => {
        const next = { ...current };
        delete next[selected];
        next[square] = movedPiece;
        return next;
      });
      setSelected(null);
      setWon(true);
      setFeedback("Quest complete — beautiful move!");

      recordPractice(quest, 1, Math.max(1, attempts + 1), attempts + 1, true);
      return;
    }

    setSelected(null);
    setFeedback("Not quite. Reset your eyes and look for the best route.");
  };

  const checkQuizAnswer = () => {
    if (!quizQuestion || !quizSelection || quizAnswerStatus || quizFinished) return;
    const correct = quizSelection === quizQuestion.answer;
    setQuizAnswerStatus(correct ? "correct" : "incorrect");
    if (correct) setQuizCorrect((current) => current + 1);
    setFeedback(correct ? "Correct — lock that idea in." : "Good try. Read the explanation, then keep going.");
  };

  const advanceQuiz = () => {
    if (quest.kind !== "quiz" || !quizAnswerStatus) return;
    const isLast = quizQuestionIndex === quest.questions.length - 1;

    if (!isLast) {
      setQuizQuestionIndex((current) => current + 1);
      setQuizSelection(null);
      setQuizAnswerStatus(null);
      setFeedback("Next question — take your time.");
      return;
    }

    const passed = quizCorrect >= 3;
    setQuizFinished(true);
    setWon(passed);
    if (passed) {
      setFeedback(`${quizCorrect} of ${quest.questions.length} correct — Scholar's Trial complete!`);
    } else {
      setFeedback(`${quizCorrect} of ${quest.questions.length} correct — review the trail and try again.`);
    }
    recordPractice(quest, quizCorrect, quest.questions.length, quest.questions.length, passed);
  };

  const squares = useMemo(
    () => RANKS.flatMap((rank) => FILES.map((file) => `${file}${rank}`)),
    []
  );

  const nextQuest = () => {
    if (questIndex < QUESTS.length - 1) resetQuest(questIndex + 1);
  };

  return (
    <main className="chess-page">
      <header className="chess-header">
        <div>
          <span className="ovl">Family learning trail</span>
          <h1>Chess Adventure</h1>
          <p>One thoughtful move a day. Build the family streak together.</p>
        </div>

        <div className="chess-player-area">
          <div className="chess-player-picker" role="group" aria-label="Choose player">
            <span><Users size={17} /> Playing as</span>
            {CHESS_PLAYERS.map((name) => (
              <button
                key={name}
                type="button"
                className={player === name ? "on" : ""}
                aria-pressed={player === name}
                onClick={() => choosePlayer(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <span className={`chess-sync chess-sync-${syncStatus === "Synced" ? "ok" : syncStatus === "Saving…" ? "saving" : "local"}`}>
            {syncStatus}
          </span>
        </div>
      </header>

      <div className="chess-layout">
        <aside className="chess-journey widget" aria-label="Adventure trail">
          <div className="chess-panel-head">
            <div>
              <span className="ovl">Adventure trail</span>
              <h2>{completedCount} of {QUESTS.length} complete</h2>
            </div>
            <span className="chess-level"><Star size={16} /> {playerProgress.xp} XP</span>
          </div>

          <div className="chess-progress-track" aria-label={`${progressPercent}% complete`}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="quest-list">
            {QUESTS.map((item, index) => {
              const complete = playerProgress.completed.includes(item.id);
              const unlocked = isUnlocked(index);
              const active = index === questIndex;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`quest-row${active ? " active" : ""}${complete ? " complete" : ""}`}
                  disabled={!unlocked}
                  onClick={() => chooseQuest(index)}
                >
                  <span className="quest-step">
                    {complete ? <Check size={17} /> : unlocked ? item.number : <Lock size={15} />}
                  </span>
                  <span className="quest-copy">
                    <small>{item.eyebrow}</small>
                    <strong>{item.title}</strong>
                    {index === dailyQuestIndex && <em className="quest-today">Today&rsquo;s focus</em>}
                  </span>
                  {unlocked && <ChevronRight size={18} className="quest-chevron" />}
                </button>
              );
            })}
          </div>

          <div className="chess-family-note">
            <Trophy size={20} />
            <div>
              <strong>Family goal</strong>
              <span>{weeklyXp} / 300 XP this week · {weeklySessions} {weeklySessions === 1 ? "session" : "sessions"}</span>
            </div>
          </div>
        </aside>

        <section className="chess-board-panel">
          {quest.kind === "move" ? (
            <div className="chess-board-wrap">
              <div className="chess-board" role="grid" aria-label="Chess puzzle board">
                {squares.map((square, index) => {
                  const piece = pieces[square];
                  const fileIndex = index % 8;
                  const rankIndex = Math.floor(index / 8);
                  const isDark = (fileIndex + rankIndex) % 2 === 1;
                  const isSelected = selected === square;
                  const isStart = !won && square === quest.from;
                  const isTarget = selected === quest.from && square === quest.to;
                  return (
                    <button
                      key={square}
                      type="button"
                      role="gridcell"
                      className={`chess-square ${isDark ? "dark" : "light"}${isSelected ? " selected" : ""}${isStart ? " quest-start" : ""}${isTarget ? " quest-target" : ""}`}
                      aria-label={`${square}${piece ? `, ${piece.color} ${piece.kind}` : ""}`}
                      onClick={() => handleSquare(square)}
                    >
                      {fileIndex === 0 && <span className="rank-label">{RANKS[rankIndex]}</span>}
                      {rankIndex === 7 && <span className="file-label">{FILES[fileIndex]}</span>}
                      {piece && (
                        <span className={`chess-piece ${piece.color}`} aria-hidden="true">
                          {PIECE_GLYPHS[piece.color][piece.kind]}
                        </span>
                      )}
                      {isTarget && <span className="target-ring" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="chess-quiz-wrap">
              {!quizFinished && quizQuestion ? (
                <>
                  <div className="quiz-topline">
                    <span className="ovl">Scholar&rsquo;s Trial</span>
                    <span>Question {quizQuestionIndex + 1} of {quest.questions.length}</span>
                  </div>
                  <div className="quiz-progress" aria-label={`Question ${quizQuestionIndex + 1} of ${quest.questions.length}`}>
                    {quest.questions.map((question, index) => (
                      <span key={question.id} className={index <= quizQuestionIndex ? "on" : ""} />
                    ))}
                  </div>
                  <h2 className="quiz-question">{quizQuestion.prompt}</h2>
                  <div className="quiz-choices" role="radiogroup" aria-label="Answer choices">
                    {quizQuestion.choices.map((choice) => {
                      const selectedChoice = quizSelection === choice;
                      const revealCorrect = quizAnswerStatus && choice === quizQuestion.answer;
                      const revealWrong = quizAnswerStatus === "incorrect" && selectedChoice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          role="radio"
                          aria-checked={selectedChoice}
                          className={`quiz-choice${selectedChoice ? " selected" : ""}${revealCorrect ? " correct" : ""}${revealWrong ? " wrong" : ""}`}
                          disabled={quizAnswerStatus !== null}
                          onClick={() => setQuizSelection(choice)}
                        >
                          <span className="quiz-radio">{revealCorrect ? <Check size={17} /> : String.fromCharCode(65 + quizQuestion.choices.indexOf(choice))}</span>
                          <strong>{choice}</strong>
                        </button>
                      );
                    })}
                  </div>

                  {quizAnswerStatus && (
                    <div className={`quiz-explanation ${quizAnswerStatus}`}>
                      <strong>{quizAnswerStatus === "correct" ? "Exactly right" : `The answer is ${quizQuestion.answer}`}</strong>
                      <span>{quizQuestion.explanation}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-primary quiz-submit"
                    disabled={!quizSelection}
                    onClick={quizAnswerStatus ? advanceQuiz : checkQuizAnswer}
                  >
                    {quizAnswerStatus
                      ? quizQuestionIndex === quest.questions.length - 1 ? "See my result" : "Next question"
                      : "Check answer"}
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : (
                <div className={`quiz-result${won ? " passed" : ""}`}>
                  <div className="quiz-result-icon">{won ? <Trophy size={34} /> : <RotateCcw size={32} />}</div>
                  <span className="ovl">Knowledge check complete</span>
                  <h2>{won ? "Trail mastered!" : "Almost there"}</h2>
                  <strong>{quizCorrect} / {quest.questions.length}</strong>
                  <p>{won ? `You earned ${quest.reward} XP and completed the adventure.` : "Review the explanations, then take another run at the trial."}</p>
                  {!won && (
                    <button type="button" className="btn-primary" onClick={() => resetQuest()}>
                      Try the quiz again <RotateCcw size={17} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`chess-feedback${won ? " won" : ""}`} role="status" aria-live="polite">
            <span className="feedback-icon">{won ? <Check size={18} /> : <Crown size={18} />}</span>
            <span>{feedback}</span>
            {attempts > 0 && !won && <small>{attempts} {attempts === 1 ? "try" : "tries"}</small>}
          </div>
        </section>

        <aside className="chess-mission widget">
          <div className="mission-number">Quest {quest.number}</div>
          <span className="ovl">
            {questIndex === dailyQuestIndex ? "Today’s focus" : quest.kind === "quiz" ? "Knowledge checkpoint" : "Practice trail"}
          </span>
          <h2>{quest.title}</h2>
          <p className="mission-lesson">{quest.lesson}</p>

          <div className="mission-task">
            <span>{quest.kind === "quiz" ? "Pass the trial" : "Mission"}</span>
            <strong>{quest.prompt}</strong>
            {quest.kind === "move" ? (
              <div className="move-code">
                <span>{quest.from}</span>
                <ChevronRight size={18} />
                <span>{quest.to}</span>
              </div>
            ) : (
              <div className="quiz-topic-list">
                <span>Knight</span><span>Rook</span><span>Bishop</span><span>Fork</span>
              </div>
            )}
          </div>

          {quest.kind === "move" && (
            <button
              type="button"
              className={`hint-button${showHint ? " open" : ""}`}
              onClick={() => setShowHint((current) => !current)}
            >
              <Lightbulb size={18} />
              {showHint ? quest.hint : "Need a hint?"}
            </button>
          )}

          <div className="chess-learning-record" aria-label={`${player}'s learning record`}>
            <div>
              <span>{quest.skill} mastery</span>
              <strong>{playerProgress.mastery[quest.skill]}%</strong>
            </div>
            <div>
              <span>Practice streak</span>
              <strong>{playerProgress.streak} {playerProgress.streak === 1 ? "day" : "days"}</strong>
            </div>
            <small>{playerProgress.lastPractice ? `Last practiced ${playerProgress.lastPractice}` : "Complete a mission to start your record."}</small>
          </div>

          <div className="mission-reward">
            <div className="reward-medallion"><Star size={22} /></div>
            <div>
              <span>Quest reward</span>
              <strong>+{quest.reward} XP</strong>
            </div>
          </div>

          <div className="mission-actions">
            <button type="button" className="chess-reset" onClick={() => resetQuest()}>
              <RotateCcw size={17} /> {quest.kind === "quiz" ? "Restart quiz" : "Reset board"}
            </button>
            {won && questIndex < QUESTS.length - 1 && (
              <button type="button" className="btn-primary chess-next" onClick={nextQuest}>
                Next quest <ChevronRight size={18} />
              </button>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
