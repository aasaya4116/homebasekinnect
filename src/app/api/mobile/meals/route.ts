import { revalidatePath } from "next/cache";

import { changeMeal } from "@/lib/mealChanges";
import { privateJson, requireMobileUser } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = new Set([
  "busy",
  "missing-ingredients",
  "preference",
  "leftovers",
  "ate-out",
  "schedule-change",
  "other",
]);

function optionalText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const date = optionalText(body?.date, 10);
  const rawType = optionalText(body?.mealType, 20).toLowerCase();
  const mealType = rawType === "lunch" ? "Lunch" : rawType === "dinner" ? "Dinner" : "";
  const name = optionalText(body?.name, 120);
  const reason = optionalText(body?.reason, 40);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !mealType || !name || !ALLOWED_REASONS.has(reason)) {
    return privateJson({ error: "Choose a meal and a reason for the change." }, { status: 400 });
  }

  try {
    const result = await changeMeal({
      date,
      mealType,
      name,
      reason,
      prepTime: optionalText(body?.prepTime, 60) || "N/A",
      ingredients: optionalText(body?.ingredients, 3000),
      image: optionalText(body?.image, 1000),
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/monthly");
    revalidatePath("/groceries");

    return privateJson({ meal: result });
  } catch (error: unknown) {
    console.error("Mobile meal change failed:", error);
    return privateJson(
      { error: error instanceof Error ? error.message : "Homebase could not save this meal." },
      { status: 500 }
    );
  }
}
