export type SchoolIcon =
  | "backpack"
  | "book-check"
  | "book-open"
  | "calculator"
  | "divide"
  | "file-text"
  | "globe"
  | "hand-heart"
  | "heart-pulse"
  | "mail"
  | "map"
  | "notebook"
  | "recycle";

export type SchoolSubject = {
  name: string;
  icon: SchoolIcon;
  points: string[];
};

export type SchoolDate = {
  month: string;
  day: string;
  title: string;
  detail: string;
  schoolClosed?: boolean;
};

export type SchoolReminder = {
  icon: SchoolIcon;
  text: string;
  href?: string;
  linkLabel?: string;
};

export type SchoolWeek = {
  child: "Khalil" | "Mekhi";
  meta: string;
  action: {
    label: string;
    title: string;
    note: string;
    date: string;
    icon: SchoolIcon;
  };
  subjects: SchoolSubject[];
  dates: SchoolDate[];
  reminders: SchoolReminder[];
  teacher: {
    initials: string;
    name: string;
    role: string;
    note: string;
  };
};

export const SCHOOL_WEEKS: Record<"khalil" | "mekhi", SchoolWeek> = {
  khalil: {
    child: "Khalil",
    meta: "First grade · Sep 8–12 · Mrs. McDermott",
    action: {
      label: "Family action",
      title: "Send in the All About Me bag",
      note: "The teacher extended the deadline for Firsties.",
      date: "Due Wed, Sep 9",
      icon: "backpack",
    },
    subjects: [
      {
        name: "Phonics · Reading · Writing",
        icon: "book-open",
        points: [
          "Fiction vs. nonfiction and using picture clues",
          "Vowels, consonants, and long vowel sounds",
          "Listening workstation and Chromebook routines",
        ],
      },
      {
        name: "Math",
        icon: "calculator",
        points: [
          "Addition and subtraction strategies within 20",
          "Unknown numbers, number charts, and tally charts",
          "Friends of 10 and What’s Behind My Back?",
        ],
      },
      {
        name: "Social Studies",
        icon: "map",
        points: [
          "Why we celebrate Labor Day",
          "What geographers do and how geography helps us",
        ],
      },
      {
        name: "Science",
        icon: "recycle",
        points: [
          "Waste reduction and diversion",
          "Reduce, reuse, and recycle at school",
        ],
      },
    ],
    dates: [
      { month: "Sep", day: "9", title: "All About Me bags due", detail: "Wednesday" },
      { month: "Sep", day: "15", title: "Chick-fil-A fundraiser", detail: "3:00–7:00 PM · code YORKTOWN" },
      { month: "Sep", day: "16", title: "School closed for students", detail: "Teacher professional development", schoolClosed: true },
      { month: "Sep", day: "21", title: "Schools closed", detail: "Yom Kippur", schoolClosed: true },
      { month: "Sep", day: "24", title: "Back to School Night", detail: "Yorktown Elementary" },
      { month: "Sep", day: "30", title: "PTA membership drive ends", detail: "Class pizza-party challenge" },
    ],
    reminders: [
      { icon: "file-text", text: "Submit a written absence note within 3 days." },
      { icon: "mail", text: "CC the school secretaries on transportation-change emails." },
      {
        icon: "hand-heart",
        text: "Join the PTA by Sep 30 to support the class drive.",
        href: "https://www.givebacks.com/causes/fspta-00019852",
        linkLabel: "Join PTA",
      },
    ],
    teacher: {
      initials: "JM",
      name: "Mrs. McDermott",
      role: "1st Grade · Yorktown Elementary",
      note: "Our Firsties are ready for another week of big learning, little victories, and memorable adventures!",
    },
  },
  mekhi: {
    child: "Mekhi",
    meta: "Weekly homework · Sep 8–11",
    action: {
      label: "Due next",
      title: "Finish the Party Question word problem",
      note: "Mekhi’s first deadline this week is the Math assignment.",
      date: "Due Wed, Sep 9",
      icon: "calculator",
    },
    subjects: [
      {
        name: "Reading · Language Arts",
        icon: "book-open",
        points: ["Read and log four times this week", "Return the reading log by Thursday"],
      },
      {
        name: "Math",
        icon: "calculator",
        points: [
          "Party Question word problem due Wednesday",
          "Factors and multiples due Thursday",
          "Checkpoint on Friday",
        ],
      },
      {
        name: "Science · Social Studies",
        icon: "globe",
        points: ["Lines of latitude and longitude", "Assignment due Friday"],
      },
      {
        name: "Health",
        icon: "heart-pulse",
        points: ["No assignment listed this week"],
      },
    ],
    dates: [
      { month: "Sep", day: "7", title: "No school", detail: "Labor Day · Monday", schoolClosed: true },
      { month: "Sep", day: "9", title: "Party Question word problem due", detail: "Math · Wednesday" },
      { month: "Sep", day: "10", title: "Reading log due", detail: "Thursday" },
      { month: "Sep", day: "10", title: "Factors and multiples due", detail: "Math · Thursday" },
      { month: "Sep", day: "11", title: "Math checkpoint", detail: "Friday" },
      { month: "Sep", day: "11", title: "Science assignment due", detail: "Friday" },
    ],
    reminders: [
      { icon: "book-check", text: "Reading log needs four entries this week." },
      { icon: "divide", text: "Review factors and multiples before Friday." },
    ],
    teacher: {
      initials: "MW",
      name: "Mekhi’s teacher",
      role: "Weekly homework overview",
      note: "Use the original weekly grid when you need to confirm the teacher’s exact wording.",
    },
  },
};
