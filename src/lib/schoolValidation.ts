import type {
  SchoolChildKey,
  SchoolDate,
  SchoolIcon,
  SchoolReminder,
  SchoolSubject,
  SchoolTask,
  SchoolWeek,
} from "./school";
import { SCHOOL_ICON_VALUES } from "./school";

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength = 240): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanTextList(value: unknown, maxItems: number, maxLength = 220): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function icon(value: unknown, fallback: SchoolIcon): SchoolIcon {
  return SCHOOL_ICON_VALUES.includes(value as SchoolIcon) ? value as SchoolIcon : fallback;
}

function safeHref(value: unknown): string | undefined {
  const candidate = cleanText(value, 500);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54) || "task";
}

function taskId(rawId: unknown, weekId: string, childKey: SchoolChildKey, date: Pick<SchoolDate, "month" | "day" | "title">): string {
  const existing = cleanText(rawId, 120).toLowerCase();
  if (/^[a-z0-9][a-z0-9-]{7,119}$/.test(existing)) return existing;

  const year = /^\d{4}/.test(weekId) ? weekId.slice(0, 4) : new Date().getFullYear().toString();
  const month = MONTHS[date.month.slice(0, 3).toLowerCase()] || "00";
  const day = date.day.replace(/\D/g, "").padStart(2, "0").slice(-2) || "00";
  return `${year}-${month}-${day}-${childKey}-${slug(date.title)}`;
}

function normalizeTask(
  value: unknown,
  weekId: string,
  childKey: SchoolChildKey,
  date: Pick<SchoolDate, "month" | "day" | "title">
): SchoolTask | undefined {
  if (!isRecord(value)) return undefined;
  const actionTitle = cleanText(value.actionTitle, 150);
  const dueLabel = cleanText(value.dueLabel, 80);
  if (!actionTitle || !dueLabel) return undefined;

  return {
    id: taskId(value.id, weekId, childKey, date),
    actionTitle,
    actionNote: cleanText(value.actionNote, 220),
    dueLabel,
    icon: icon(value.icon, "book-check"),
  };
}

/** Turns model or Sheet JSON into the small, safe shape the client can render.
 * Child identity is always supplied by trusted application data, never email text. */
export function normalizeSchoolWeek(value: unknown, childKey: SchoolChildKey): SchoolWeek | null {
  if (!isRecord(value)) return null;
  const weekId = cleanText(value.weekId, 10);
  const meta = cleanText(value.meta, 180);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekId) || !meta) return null;

  const subjects: SchoolSubject[] = (Array.isArray(value.subjects) ? value.subjects : [])
    .filter(isRecord)
    .map((subject) => ({
      name: cleanText(subject.name, 100),
      icon: icon(subject.icon, "book-open"),
      points: cleanTextList(subject.points, 4),
    }))
    .filter((subject) => subject.name && subject.points.length)
    .slice(0, 6);

  const dates: SchoolDate[] = (Array.isArray(value.dates) ? value.dates : [])
    .filter(isRecord)
    .map((entry) => {
      const date: SchoolDate = {
        month: cleanText(entry.month, 3),
        day: cleanText(entry.day, 2),
        title: cleanText(entry.title, 130),
        detail: cleanText(entry.detail, 160),
        schoolClosed: entry.schoolClosed === true,
      };
      date.task = normalizeTask(entry.task, weekId, childKey, date);
      return date;
    })
    .filter((date) => date.month && date.day && date.title)
    .slice(0, 18);

  const reminders: SchoolReminder[] = (Array.isArray(value.reminders) ? value.reminders : [])
    .filter(isRecord)
    .map((reminder) => {
      const href = safeHref(reminder.href);
      return {
        icon: icon(reminder.icon, "file-text"),
        text: cleanText(reminder.text, 220),
        ...(href ? { href, linkLabel: cleanText(reminder.linkLabel, 40) || "Open" } : {}),
      };
    })
    .filter((reminder) => reminder.text)
    .slice(0, 8);

  const teacherValue = isRecord(value.teacher) ? value.teacher : {};
  if (!subjects.length || !dates.length) return null;

  return {
    child: childKey === "khalil" ? "Khalil" : "Mekhi",
    weekId,
    meta,
    subjects,
    dates,
    reminders,
    teacher: {
      initials: cleanText(teacherValue.initials, 3).toUpperCase() || (childKey === "khalil" ? "JM" : "4G"),
      name: cleanText(teacherValue.name, 100) || (childKey === "khalil" ? "Mrs. McDermott" : "Fourth Grade Team"),
      role: cleanText(teacherValue.role, 120) || "Yorktown Elementary",
      note: cleanText(teacherValue.note, 400),
    },
  };
}

export function schoolTaskIds(week: SchoolWeek): string[] {
  return week.dates.flatMap((date) => date.task ? [date.task.id] : []);
}
