// ============================================================
// DATES — household-timezone-pinned date math
// ============================================================
// Vercel runs server functions in UTC, so a bare `new Date()` rolls "today"
// to tomorrow at 8pm ET (midnight UTC) — the dashboard would show tomorrow's
// dinner during tonight's cooking. Every server-side "today"/day-of-week
// calculation must go through here so the plan matches the household clock.

export const APP_TZ = "America/New_York";

/** Today's calendar date in APP_TZ, as YYYY-MM-DD. */
export function todayStr(): string {
  // en-CA renders as ISO-like YYYY-MM-DD.
  return new Date().toLocaleDateString("en-CA", { timeZone: APP_TZ });
}

/** A calendar date `offsetDays` away from today (in APP_TZ), as YYYY-MM-DD. */
export function dayStr(offsetDays = 0): string {
  // Anchor at noon UTC so whole-day arithmetic never crosses a date line.
  const anchor = new Date(`${todayStr()}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() + offsetDays);
  return anchor.toISOString().slice(0, 10);
}

/** Day of week (0=Sun … 6=Sat) for a YYYY-MM-DD string. */
export function dayOfWeek(ds: string): number {
  return new Date(`${ds}T12:00:00Z`).getUTCDay();
}

/** Stable display parts for a YYYY-MM-DD (formatted in UTC off a noon anchor,
 *  so the weekday/month never drift regardless of server zone). */
export function dayParts(ds: string): { weekdayShort: string; monthShort: string; dayNum: number } {
  const d = new Date(`${ds}T12:00:00Z`);
  return {
    weekdayShort: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase(),
    monthShort: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    dayNum: d.getUTCDate(),
  };
}

// --- Absolute-instant helpers (for the Google Calendar time window) ---

/** APP_TZ offset from UTC, in ms, at a given instant (e.g. EDT = -4h). */
function tzOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(instant);
  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUTC - instant.getTime();
}

/** The absolute instant of local wall-time h:m:s on `ds` in APP_TZ. */
function wallTimeToInstant(ds: string, h: number, m: number, s: number): Date {
  const [y, mo, d] = ds.split("-").map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, m, s));
  return new Date(guess.getTime() - tzOffsetMs(guess));
}

/** Start of the calendar day `ds` in APP_TZ, as an absolute instant. */
export function zonedStartOfDay(ds: string): Date {
  return wallTimeToInstant(ds, 0, 0, 0);
}

/** End of the calendar day `ds` in APP_TZ, as an absolute instant. */
export function zonedEndOfDay(ds: string): Date {
  return wallTimeToInstant(ds, 23, 59, 59);
}

/** The wall-clock hour (0–23, fractional for minutes) of an instant in APP_TZ. */
export function zonedHourFloat(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ, hour12: false, hour: "2-digit", minute: "2-digit",
  }).formatToParts(instant);
  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;
  return (+p.hour % 24) + +p.minute / 60;
}

/** Format an instant's time (e.g. "6:00 PM") in APP_TZ. */
export function zonedTimeLabel(instant: Date): string {
  return instant.toLocaleTimeString("en-US", { timeZone: APP_TZ, hour: "numeric", minute: "2-digit" });
}

/** Full ledger-style label in APP_TZ, e.g. "Monday, Jul 20 at 9:22 AM". */
export function zonedDateTimeLabel(instant: Date): string {
  const date = instant.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", timeZone: APP_TZ,
  });
  return `${date} at ${zonedTimeLabel(instant)}`;
}

/** The calendar date (YYYY-MM-DD) of an instant in APP_TZ. */
export function zonedDateStr(instant: Date): string {
  return instant.toLocaleDateString("en-CA", { timeZone: APP_TZ });
}
