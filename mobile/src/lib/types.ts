export type MobileMeal = { name: string; prepTime?: string; image?: string };

export type MobileEvent = {
  id: string;
  time: string;
  title: string;
  location?: string;
  person: string;
  date?: string;
  endDate?: string;
};

export type ChoreItem = {
  id: string;
  kid: string;
  name: string;
  emoji: string;
  days: string;
  slot: string;
  allowance: number;
  active: boolean;
  asNeeded: boolean;
  done: boolean;
};

export type KidBoard = {
  kid: string;
  scheduled: ChoreItem[];
  asNeeded: ChoreItem[];
  doneCount: number;
  totalScheduled: number;
  earnedToday: number;
  earnedWeek: number;
  weekDone: number;
  weekTotal: number;
  balance: number;
};

export type MobileDay = {
  date: string;
  dayName: string;
  month: string;
  dayNumber: number;
  isToday: boolean;
  lunch: MobileMeal | null;
  dinner: MobileMeal | null;
  cook: string;
  events: MobileEvent[];
};

export type OverviewResponse = {
  generatedAt: string;
  today: string;
  days: MobileDay[];
  chores: KidBoard[];
};

export type SchoolChildKey = 'khalil' | 'mekhi';
export type SchoolTask = { id: string; actionTitle: string; actionNote: string; dueLabel: string; icon: string };
export type SchoolDate = {
  month: string;
  day: string;
  title: string;
  detail: string;
  schoolClosed?: boolean;
  task?: SchoolTask;
};
export type SchoolWeek = {
  child: 'Khalil' | 'Mekhi';
  weekId: string;
  meta: string;
  subjects: { name: string; icon: string; points: string[] }[];
  dates: SchoolDate[];
  reminders: { icon: string; text: string; href?: string; linkLabel?: string }[];
  teacher: { initials: string; name: string; role: string; note: string };
};
export type SchoolResponse = {
  weeks: Record<SchoolChildKey, SchoolWeek>;
  completedTaskIds: string[];
  pendingDraftCount: number;
};
