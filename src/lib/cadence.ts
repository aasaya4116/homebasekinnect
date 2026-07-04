// ============================================================
// COOK CADENCE — single source of truth for who cooks
// ============================================================
// Dad cooks Monday, Tuesday, Saturday. Mom cooks the rest of the
// week (Wednesday, Thursday, Friday, Sunday). No shared "Both" days.

import { dayOfWeek } from "./dates";

export type Cook = "Dad" | "Mom";

export function cookForDayOfWeek(dow: number): Cook {
  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return dow === 1 || dow === 2 || dow === 6 ? "Dad" : "Mom";
}

export function cookForDate(dateStr: string): Cook {
  return cookForDayOfWeek(dayOfWeek(dateStr));
}
