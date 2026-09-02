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

type Color = "white" | "black";
type PieceKind = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

type Piece = {
  color: Color;
  kind: PieceKind;
};

type Quest = {
  id: string;
  number: number;
  title: string;
  eyebrow: string;
  lesson: string;
  prompt: string;
  hint: string;
  reward: number;
  from: string;
  to: string;
  pieces: Record<string, Piece>;
};

type PlayerProgress = {
  xp: number;
  completed: string[];
};

type ProgressMap = Record<string, PlayerProgress>;

const PLAYERS = ["Mekhi", "Khalil", "Mom", "Dad"] as const;
const STORAGE_KEY = "homebase-chess-adventure-v1";
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const PIECE_GLYPHS: Record<Color, Record<PieceKind, string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

const QUESTS: Quest[] = [
  {
    id: "knight-leap",
    number: 1,
    title: "The Knight's First Leap",
    eyebrow: "Movement trail",
    lesson: "Knights jump in an L: two squares one way, then one to the side.",
    prompt: "Wake the knight and move it from g1 to f3.",
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
    id: "rook-road",
    number: 2,
    title: "The Rook's Open Road",
    eyebrow: "Capture trail",
    lesson: "Rooks race in straight lines across ranks and files.",
    prompt: "Send the rook from a1 to capture the bishop on a7.",
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
    id: "bishop-diagonal",
    number: 3,
    title: "The Bishop's Hidden Path",
    eyebrow: "Tactics trail",
    lesson: "Bishops glide diagonally and always stay on their starting color.",
    prompt: "Move the bishop from c4 to f7 and win the loose pawn.",
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
    id: "royal-fork",
    number: 4,
    title: "The Royal Fork",
    eyebrow: "Boss quest",
    lesson: "A fork attacks two valuable pieces at the same time.",
    prompt: "Leap from c7 to e6 to fork the king and queen.",
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
];

function freshProgress(): ProgressMap {
  return Object.fromEntries(PLAYERS.map((player) => [player, { xp: 0, completed: [] }]));
}

function copyPieces(pieces: Record<string, Piece>) {
  return Object.fromEntries(Object.entries(pieces).map(([square, piece]) => [square, { ...piece }]));
}

export default function ChessAdventure() {
  const [player, setPlayer] = useState<(typeof PLAYERS)[number]>("Mekhi");
  const [progress, setProgress] = useState<ProgressMap>(freshProgress);
  const [questIndex, setQuestIndex] = useState(0);
  const [pieces, setPieces] = useState<Record<string, Piece>>(() => copyPieces(QUESTS[0].pieces));
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Choose the glowing piece to begin.");
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [ready, setReady] = useState(false);

  const quest = QUESTS[questIndex];
  const playerProgress = progress[player] ?? { xp: 0, completed: [] };
  const isComplete = playerProgress.completed.includes(quest.id);
  const completedCount = playerProgress.completed.length;
  const progressPercent = Math.round((completedCount / QUESTS.length) * 100);

  useEffect(() => {
    let savedProgress: ProgressMap | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedProgress = { ...freshProgress(), ...JSON.parse(saved) };
    } catch {
      // A private or locked-down kiosk may block storage; the quest still works.
    }

    // Defer the browser-only snapshot until after hydration has settled.
    const timer = window.setTimeout(() => {
      if (savedProgress) setProgress(savedProgress);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
    setPieces(copyPieces(nextQuest.pieces));
    setSelected(null);
    setFeedback("Choose the glowing piece to begin.");
    setShowHint(false);
    setAttempts(0);
    setWon(false);
  };

  const choosePlayer = (nextPlayer: (typeof PLAYERS)[number]) => {
    setPlayer(nextPlayer);
    const nextProgress = progress[nextPlayer] ?? { xp: 0, completed: [] };
    const firstOpen = QUESTS.findIndex((item) => !nextProgress.completed.includes(item.id));
    resetQuest(firstOpen === -1 ? QUESTS.length - 1 : firstOpen);
  };

  const isUnlocked = (index: number) => index === 0 || playerProgress.completed.includes(QUESTS[index - 1].id);

  const chooseQuest = (index: number) => {
    if (isUnlocked(index)) resetQuest(index);
  };

  const handleSquare = (square: string) => {
    if (won) return;

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

      if (!isComplete) {
        setProgress((current) => {
          const existing = current[player] ?? { xp: 0, completed: [] };
          return {
            ...current,
            [player]: {
              xp: existing.xp + quest.reward,
              completed: [...existing.completed, quest.id],
            },
          };
        });
      }
      return;
    }

    setSelected(null);
    setFeedback("Not quite. Reset your eyes and look for the best route.");
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

        <div className="chess-player-picker" role="group" aria-label="Choose player">
          <span><Users size={17} /> Playing as</span>
          {PLAYERS.map((name) => (
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
              <span>Earn 300 XP together this week.</span>
            </div>
          </div>
        </aside>

        <section className="chess-board-panel">
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

          <div className={`chess-feedback${won ? " won" : ""}`} role="status" aria-live="polite">
            <span className="feedback-icon">{won ? <Check size={18} /> : <Crown size={18} />}</span>
            <span>{feedback}</span>
            {attempts > 0 && !won && <small>{attempts} {attempts === 1 ? "try" : "tries"}</small>}
          </div>
        </section>

        <aside className="chess-mission widget">
          <div className="mission-number">Quest {quest.number}</div>
          <span className="ovl">Today&rsquo;s move</span>
          <h2>{quest.title}</h2>
          <p className="mission-lesson">{quest.lesson}</p>

          <div className="mission-task">
            <span>Mission</span>
            <strong>{quest.prompt}</strong>
            <div className="move-code">
              <span>{quest.from}</span>
              <ChevronRight size={18} />
              <span>{quest.to}</span>
            </div>
          </div>

          <button
            type="button"
            className={`hint-button${showHint ? " open" : ""}`}
            onClick={() => setShowHint((current) => !current)}
          >
            <Lightbulb size={18} />
            {showHint ? quest.hint : "Need a hint?"}
          </button>

          <div className="mission-reward">
            <div className="reward-medallion"><Star size={22} /></div>
            <div>
              <span>Quest reward</span>
              <strong>+{quest.reward} XP</strong>
            </div>
          </div>

          <div className="mission-actions">
            <button type="button" className="chess-reset" onClick={() => resetQuest()}>
              <RotateCcw size={17} /> Reset board
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
