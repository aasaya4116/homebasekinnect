export const SCHOOL_ICON_VALUES = [
  "backpack",
  "book-check",
  "book-open",
  "calculator",
  "divide",
  "file-text",
  "globe",
  "hand-heart",
  "heart-pulse",
  "mail",
  "map",
  "notebook",
  "recycle",
] as const;

export type SchoolIcon = (typeof SCHOOL_ICON_VALUES)[number];
export type SchoolChildKey = "khalil" | "mekhi";

export type SchoolSubject = {
  name: string;
  icon: SchoolIcon;
  points: string[];
};

export type SchoolTask = {
  id: string;
  actionTitle: string;
  actionNote: string;
  dueLabel: string;
  icon: SchoolIcon;
};

export type SchoolDate = {
  month: string;
  day: string;
  title: string;
  detail: string;
  schoolClosed?: boolean;
  task?: SchoolTask;
};

export type SchoolReminder = {
  icon: SchoolIcon;
  text: string;
  href?: string;
  linkLabel?: string;
};

export type SchoolWeek = {
  child: "Khalil" | "Mekhi";
  weekId: string;
  meta: string;
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

export const SCHOOL_WEEKS: Record<SchoolChildKey, SchoolWeek> = {
  khalil: {
    child: "Khalil",
    weekId: "2026-09-14",
    meta: "First grade · Sep 14–18 · Mrs. McDermott",
    subjects: [
      {
        name: "Phonics · Reading · Writing",
        icon: "book-open",
        points: [
          "Fiction vs. nonfiction, picture clues, and responding to stories",
          "Vowels, consonants, and short vowel sounds",
          "Focus Groups and stronger small-group learning routines",
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
          "What geography is and what geographers do",
          "How geography helps us understand our world",
        ],
      },
      {
        name: "Science",
        icon: "recycle",
        points: [
          "Camp Schmidt waste-diversion lesson",
          "Reducing, reusing, recycling, and diverting waste",
        ],
      },
    ],
    dates: [
      {
        month: "Sep",
        day: "14",
        title: "Bring corded headphones",
        detail: "For independent Chromebook use",
        task: {
          id: "2026-09-14-khalil-corded-headphones",
          actionTitle: "Pack corded headphones",
          actionNote: "The classroom cannot charge wireless headphones.",
          dueLabel: "This week",
          icon: "backpack",
        },
      },
      { month: "Sep", day: "15", title: "Chick-fil-A fundraiser", detail: "3:00–7:00 PM · code YORKTOWN" },
      { month: "Sep", day: "16", title: "No school for students", detail: "Teacher work day", schoolClosed: true },
      { month: "Sep", day: "17", title: "PTA meeting", detail: "6:30 PM" },
      { month: "Sep", day: "21", title: "Schools closed", detail: "Yom Kippur", schoolClosed: true },
      { month: "Sep", day: "24", title: "Back to School Night", detail: "Yorktown Elementary" },
      { month: "Sep", day: "30", title: "PTA membership drive ends", detail: "Class pizza-party challenge" },
      { month: "Oct", day: "9", title: "Spiritwear sale ends", detail: "Yorktown Spiritwear Store" },
    ],
    reminders: [
      { icon: "file-text", text: "Submit a written absence note within 3 days." },
      { icon: "mail", text: "Email transportation changes and CC the school secretaries." },
      { icon: "backpack", text: "Send a hoodie or light jacket and a water bottle each day." },
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
      note: "Our Firsties are continuing to learn classroom routines and are ready for another fun-filled week of learning.",
    },
  },
  mekhi: {
    child: "Mekhi",
    weekId: "2026-09-14",
    meta: "Fourth grade · Sep 14–18 · Yorktown Weekly Update",
    subjects: [
      {
        name: "Reading · Language Arts",
        icon: "book-open",
        points: [
          "Two spelling activities and an adult-signed practice test",
          "Read and log four days for at least 20 minutes each day",
          "Write a Flora & Ulysses sequel; practice capitalization and cursive",
        ],
      },
      {
        name: "Math",
        icon: "calculator",
        points: [
          "Review factors and multiples for Tuesday’s Unit 1 assessment",
          "Begin fraction equivalence and comparison",
          "Use fraction strips and tape diagrams to identify unit fractions",
        ],
      },
      {
        name: "Science · Social Studies",
        icon: "globe",
        points: [
          "How unbalanced forces move objects and change energy",
          "Maryland’s first people and life before Europeans arrived",
        ],
      },
      {
        name: "Health",
        icon: "heart-pulse",
        points: [
          "Learn about bullying",
          "Bring home the booklet and study guide Tuesday",
          "Prepare for Friday’s Health test",
        ],
      },
    ],
    dates: [
      {
        month: "Sep",
        day: "14",
        title: "Spelling activity 1",
        detail: "Complete in the Word Study journal",
        task: {
          id: "2026-09-14-mekhi-spelling-activity-1",
          actionTitle: "Complete the first spelling activity",
          actionNote: "Choose one activity from the menu in the Word Study journal.",
          dueLabel: "Mon, Sep 14",
          icon: "notebook",
        },
      },
      {
        month: "Sep",
        day: "15",
        title: "Unit 1 review sheet due",
        detail: "Math · Factors and Multiples",
        task: {
          id: "2026-09-15-mekhi-unit-1-review",
          actionTitle: "Finish the Unit 1 review sheet",
          actionNote: "The Factors and Multiples review is due Tuesday.",
          dueLabel: "Due Tue, Sep 15",
          icon: "calculator",
        },
      },
      {
        month: "Sep",
        day: "15",
        title: "Spelling activity 2",
        detail: "Complete in the Word Study journal",
        task: {
          id: "2026-09-15-mekhi-spelling-activity-2",
          actionTitle: "Complete the second spelling activity",
          actionNote: "Finish a second menu activity in the Word Study journal.",
          dueLabel: "Tue, Sep 15",
          icon: "notebook",
        },
      },
      { month: "Sep", day: "15", title: "Chick-fil-A fundraiser", detail: "3:00–7:00 PM · code YORKTOWN" },
      { month: "Sep", day: "16", title: "No school", detail: "Teacher professional development", schoolClosed: true },
      { month: "Sep", day: "16", title: "PTA meeting", detail: "6:30 PM · date listed by Fourth Grade" },
      {
        month: "Sep",
        day: "17",
        title: "Word Study journal due",
        detail: "Include the adult-signed spelling pretest",
        task: {
          id: "2026-09-17-mekhi-word-study-journal",
          actionTitle: "Give and sign the spelling pretest",
          actionNote: "Return the Word Study journal before Thursday’s spelling test.",
          dueLabel: "Due Thu, Sep 17",
          icon: "book-check",
        },
      },
      {
        month: "Sep",
        day: "18",
        title: "Pushing & Pulling assignment due",
        detail: "Science",
        task: {
          id: "2026-09-18-mekhi-pushing-pulling",
          actionTitle: "Finish Pushing & Pulling",
          actionNote: "The Science assignment is due Friday.",
          dueLabel: "Due Fri, Sep 18",
          icon: "globe",
        },
      },
      {
        month: "Sep",
        day: "18",
        title: "Fractions tape diagram due",
        detail: "Math",
        task: {
          id: "2026-09-18-mekhi-fractions-tape-diagram",
          actionTitle: "Finish the fractions tape diagram",
          actionNote: "The fractions assignment is due Friday.",
          dueLabel: "Due Fri, Sep 18",
          icon: "divide",
        },
      },
      {
        month: "Sep",
        day: "18",
        title: "Health test",
        detail: "Study the booklet and study guide",
        task: {
          id: "2026-09-18-mekhi-health-test",
          actionTitle: "Study for the Health test",
          actionNote: "Use the Health booklet and study guide sent home Tuesday.",
          dueLabel: "Test Fri, Sep 18",
          icon: "heart-pulse",
        },
      },
      { month: "Sep", day: "21", title: "No school", detail: "Yom Kippur", schoolClosed: true },
      {
        month: "Sep",
        day: "22",
        title: "Reading log due",
        detail: "Four reading days · adult signature",
        task: {
          id: "2026-09-22-mekhi-reading-log",
          actionTitle: "Finish and sign the reading log",
          actionNote: "Log four days of reading with 2–3 sentences for each entry.",
          dueLabel: "Due Tue, Sep 22",
          icon: "book-check",
        },
      },
      { month: "Sep", day: "24", title: "Back to School Night", detail: "Yorktown Elementary" },
    ],
    reminders: [
      { icon: "file-text", text: "Use the absence form or send a note when Mekhi returns." },
      { icon: "mail", text: "Include all three teachers on general student emails." },
      { icon: "backpack", text: "Bring a fillable water bottle every day." },
      {
        icon: "hand-heart",
        text: "Yorktown Spiritwear is available online.",
        href: "https://heritagespiritwear.com/product-category/yorktown-wildcats/",
        linkLabel: "Shop",
      },
    ],
    teacher: {
      initials: "4G",
      name: "Fourth Grade Team",
      role: "Yorktown Elementary",
      note: "Fourth graders are beginning spelling routines, wrapping up Factors and Multiples, and starting fractions this week.",
    },
  },
};
