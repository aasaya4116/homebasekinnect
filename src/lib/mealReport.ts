import { classifyMeal, getMealOutcomes, type MealOutcome } from "./mealLearning";
import { dayStr } from "./dates";

type CountMap = Map<string, number>;

export type MealInsightsReport = {
  subject: string;
  plainBody: string;
  htmlBody: string;
  metrics: {
    dinners: number;
    deviations: number;
    adherencePct: number;
    confirmed: number;
    assumed: number;
    legacy: number;
  };
};

function increment(counts: CountMap, value: string): void {
  counts.set(value, (counts.get(value) || 0) + 1);
}

function sortedCounts(counts: CountMap): [string, number][] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function listHtml(items: string[]): string {
  return `<ul style="margin:8px 0 0;padding-left:20px;color:#d6d6da;line-height:1.55">${items.map((item) => `<li style="margin:5px 0">${htmlEscape(item)}</li>`).join("")}</ul>`;
}

function ruleBaseline(): string[] {
  return [
    "Calendar-aware: busy evenings favor quicker recipes.",
    "Leftover efficiency: a longer cooking night can create a leftovers night next.",
    "Take-a-break rule: Fridays or especially busy days may become an eat-out night.",
    "Variety rules: rotate proteins and avoid repeating the same recipe within the month.",
    "Cooking cadence: preserve the family’s assigned cooking days.",
    "Within the eligible set, meals are currently randomized; the historical feedback is not auto-changing the rules yet.",
  ];
}

function recommendationLines(rows: MealOutcome[]): string[] {
  const byPlan = new Map<string, { total: number; changed: number; replacements: CountMap }>();
  for (const row of rows) {
    const stat = byPlan.get(row.planned) || { total: 0, changed: 0, replacements: new Map<string, number>() };
    stat.total++;
    if (row.deviated) {
      stat.changed++;
      increment(stat.replacements, row.actual);
    }
    byPlan.set(row.planned, stat);
  }

  const recommendations: string[] = [];
  for (const [meal, stat] of byPlan) {
    if (classifyMeal(meal) !== "Home-cooked") continue;
    if (stat.total < 3) continue;
    const changeRate = stat.changed / stat.total;
    if (stat.changed >= 2 && changeRate >= 0.5) {
      const replacement = sortedCounts(stat.replacements)[0]?.[0];
      recommendations.push(`Review ${meal}: changed ${stat.changed} of ${stat.total} times${replacement ? `, most often to ${replacement}` : ""}.`);
    } else if (stat.total >= 3 && changeRate <= 0.25) {
      recommendations.push(`Keep ${meal} in rotation: followed ${stat.total - stat.changed} of ${stat.total} times.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("No recipe has enough repeated evidence to reduce or retire yet; keep collecting confirmations before changing recipe weights.");
  }
  return recommendations.slice(0, 5);
}

export async function buildMealInsightsReport(includeBaseline = false): Promise<MealInsightsReport> {
  const allOutcomes = await getMealOutcomes(true);
  const startDate = dayStr(-27);
  const endDate = dayStr(-1);
  const dinners = allOutcomes
    .filter((row) => row.type.toLowerCase() === "dinner" && row.date >= startDate && row.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  const deviations = dinners.filter((row) => row.deviated);
  const categories = new Map<string, number>();
  const replacements = new Map<string, number>();
  for (const row of dinners) {
    increment(categories, row.category);
    if (row.deviated) increment(replacements, row.actual);
  }

  const confirmed = dinners.filter((row) => row.status === "Confirmed").length;
  const assumed = dinners.filter((row) => row.status === "Assumed").length;
  const legacy = dinners.filter((row) => row.status === "Legacy").length;
  const adherencePct = 100 - pct(deviations.length, dinners.length);
  const categorySummary = sortedCounts(categories).map(([name, count]) => `${name}: ${count}`).join(" · ") || "No finalized dinners yet";
  const replacementSummary = sortedCounts(replacements).slice(0, 5).map(([name, count]) => `${name} (${count})`);
  const changedLines = deviations.slice(-6).reverse().map((row) => `${row.date}: ${row.planned} → ${row.actual}${row.reason ? ` — ${row.reason}` : ""}`);
  const recommendations = recommendationLines(dinners.filter((row) => row.status !== "Assumed"));

  const subject = `Homebase meal insights — ${startDate} to ${endDate}`;
  const baselineText = includeBaseline
    ? `\nHOW THE CURRENT ALGORITHM WORKS\n${ruleBaseline().map((line) => `- ${line}`).join("\n")}\n`
    : "";
  const plainBody = [
    "Hi Latoya,",
    "",
    "Here is the latest Homebase meal-planning review. It compares what was recommended with what the family recorded as the final dinner.",
    baselineText,
    "SNAPSHOT",
    `- ${dinners.length} dinners reviewed`,
    `- ${adherencePct}% apparent plan adherence`,
    `- ${deviations.length} changes to plan`,
    `- ${categorySummary}`,
    `- Data quality: ${confirmed} confirmed, ${assumed} assumed, ${legacy} legacy records`,
    "",
    "WHAT CHANGED",
    ...(changedLines.length ? changedLines.map((line) => `- ${line}`) : ["- No recorded changes in this period."]),
    "",
    "COMMON REPLACEMENTS",
    ...(replacementSummary.length ? replacementSummary.map((line) => `- ${line}`) : ["- No repeated replacement pattern yet."]),
    "",
    "RECOMMENDATIONS TO REVIEW",
    ...recommendations.map((line) => `- ${line}`),
    "",
    "Homebase will not automatically reduce or retire a recipe from one change. Recommendations require repeated evidence and should be approved by us before the rules change.",
    "",
    "— Homebase Kinnect",
  ].filter((line) => line !== undefined).join("\n");

  const baselineHtml = includeBaseline
    ? `<div style="margin-top:26px"><div style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">How the current algorithm works</div>${listHtml(ruleBaseline())}</div>`
    : "";
  const htmlBody = `
    <div style="background:#0b0b0d;padding:28px;font-family:Inter,Arial,sans-serif;color:#f0f0f2">
      <div style="max-width:680px;margin:0 auto;background:#141416;border:1px solid #2a2a2e;border-radius:16px;padding:28px">
        <div style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Homebase Kinnect</div>
        <h1 style="margin:10px 0 8px;font-size:28px;line-height:1.15">Meal insights</h1>
        <p style="margin:0;color:#a0a0a8;line-height:1.55">${startDate} through ${endDate} · Planned versus recorded dinners</p>
        ${baselineHtml}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:26px">
          <div style="background:#1a1a1d;border:1px solid #2a2a2e;border-radius:12px;padding:15px"><div style="color:#6a6a72;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Dinners</div><strong style="display:block;margin-top:5px;font-size:24px">${dinners.length}</strong></div>
          <div style="background:#1a1a1d;border:1px solid #2a2a2e;border-radius:12px;padding:15px"><div style="color:#6a6a72;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Followed plan</div><strong style="display:block;margin-top:5px;font-size:24px;color:#10b981">${adherencePct}%</strong></div>
          <div style="background:#1a1a1d;border:1px solid #2a2a2e;border-radius:12px;padding:15px"><div style="color:#6a6a72;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Changes</div><strong style="display:block;margin-top:5px;font-size:24px;color:#c8a96e">${deviations.length}</strong></div>
        </div>
        <p style="margin:14px 0 0;color:#a0a0a8;font-size:13px">${htmlEscape(categorySummary)}</p>
        <p style="margin:5px 0 0;color:#6a6a72;font-size:12px">Data quality: ${confirmed} confirmed · ${assumed} assumed · ${legacy} legacy</p>
        <div style="margin-top:27px"><div style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">What changed</div>${listHtml(changedLines.length ? changedLines : ["No recorded changes in this period."])}</div>
        <div style="margin-top:27px"><div style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">Common replacements</div>${listHtml(replacementSummary.length ? replacementSummary : ["No repeated replacement pattern yet."])}</div>
        <div style="margin-top:27px"><div style="color:#c8a96e;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">Recommendations to review</div>${listHtml(recommendations)}</div>
        <div style="margin-top:26px;padding:15px;border-left:2px solid #c8a96e;border-radius:8px;background:#1a1a1d;color:#a0a0a8;font-size:13px;line-height:1.5">One change is an observation, not a rule. Homebase only recommends reducing a recipe after repeated evidence, and the family approves the change.</div>
      </div>
    </div>`;

  return {
    subject,
    plainBody,
    htmlBody,
    metrics: { dinners: dinners.length, deviations: deviations.length, adherencePct, confirmed, assumed, legacy },
  };
}
