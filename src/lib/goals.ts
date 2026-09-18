export const GOAL_PERSON_KEYS = ["khalil", "mekhi", "latoya"] as const;

export type GoalPersonKey = (typeof GOAL_PERSON_KEYS)[number];
export type GoalIcon =
  | "activity"
  | "book"
  | "clock"
  | "code"
  | "flag"
  | "medal"
  | "music"
  | "sparkles"
  | "target"
  | "waves";

export type YearGoal = {
  id: string;
  title: string;
  category: string;
  icon: GoalIcon;
  kind: "count" | "milestone";
  target: number;
  unit: string;
};

export type PersonGoals = {
  name: string;
  eyebrow: string;
  theme: string;
  encouragement: string;
  goals: YearGoal[];
};

export const YEAR_GOALS: Record<GoalPersonKey, PersonGoals> = {
  khalil: {
    name: "Khalil",
    eyebrow: "Build skills through practice",
    theme: "Curiosity + confidence",
    encouragement: "Try it, track it, celebrate it.",
    goals: [
      { id: "khalil-soccer-moves", title: "Learn 10 soccer tricks and moves", category: "Soccer", icon: "target", kind: "count", target: 10, unit: "moves" },
      { id: "khalil-gymnastics", title: "Learn 2 new gymnastics skills", category: "Gymnastics", icon: "activity", kind: "count", target: 2, unit: "skills" },
      { id: "khalil-coding", title: "Complete 3 coding projects", category: "Coding", icon: "code", kind: "count", target: 3, unit: "projects" },
      { id: "khalil-books", title: "Read 10 chapter books", category: "Reading", icon: "book", kind: "count", target: 10, unit: "books" },
      { id: "khalil-golf", title: "Improve my golf swing", category: "Golf", icon: "flag", kind: "milestone", target: 1, unit: "goal" },
      { id: "khalil-piano", title: "Move from beginner to Level 1 in piano", category: "Piano", icon: "music", kind: "milestone", target: 1, unit: "goal" },
      { id: "khalil-time", title: "Learn how to tell time", category: "Life skill", icon: "clock", kind: "milestone", target: 1, unit: "goal" },
    ],
  },
  mekhi: {
    name: "Mekhi",
    eyebrow: "Aim high and keep showing up",
    theme: "Stretch + follow-through",
    encouragement: "Big goals are built one rep at a time.",
    goals: [
      { id: "mekhi-soccer-skills", title: "Learn 15 soccer skills", category: "Soccer", icon: "target", kind: "count", target: 15, unit: "skills" },
      { id: "mekhi-soccer-goals", title: "Score 6 goals", category: "Soccer", icon: "medal", kind: "count", target: 6, unit: "goals" },
      { id: "mekhi-piano", title: "Move from beginner to Level 1 in piano", category: "Piano", icon: "music", kind: "milestone", target: 1, unit: "goal" },
      { id: "mekhi-golf", title: "Hit a golf ball more than 150 yards", category: "Golf", icon: "flag", kind: "milestone", target: 1, unit: "goal" },
      { id: "mekhi-books", title: "Read 15 chapter books", category: "Reading", icon: "book", kind: "count", target: 15, unit: "books" },
      { id: "mekhi-backflip", title: "Learn how to do a back flip", category: "Athletics", icon: "activity", kind: "milestone", target: 1, unit: "goal" },
      { id: "mekhi-coding", title: "Create 5 coding projects", category: "Coding", icon: "code", kind: "count", target: 5, unit: "projects" },
    ],
  },
  latoya: {
    name: "Latoya",
    eyebrow: "2026 theme",
    theme: "Consistency",
    encouragement: "Steady effort over perfect days.",
    goals: [
      { id: "latoya-weight", title: "Lose 20 pounds", category: "Wellness", icon: "sparkles", kind: "count", target: 20, unit: "pounds" },
      { id: "latoya-swim", title: "Learn to swim", category: "Life skill", icon: "waves", kind: "milestone", target: 1, unit: "goal" },
      { id: "latoya-marathon", title: "Run a marathon", category: "Endurance", icon: "medal", kind: "milestone", target: 1, unit: "goal" },
    ],
  },
};

export function goalFor(personKey: string, goalId: string): YearGoal | null {
  if (!GOAL_PERSON_KEYS.includes(personKey as GoalPersonKey)) return null;
  return YEAR_GOALS[personKey as GoalPersonKey].goals.find((goal) => goal.id === goalId) || null;
}
