"use server";

import { generateSchedule } from "./scheduler";
import { recordMealFeedback } from "./mealLearning";
import { changeMeal } from "./mealChanges";
import { appendChoreLog, appendBalanceAdjustment, updateChoreAllowance } from "./chores";
import { todayStr } from "./dates";
import { revalidatePath } from "next/cache";
import { requireFamilySession } from "./familyAuth";

/** Regenerate the rolling month of meals, then refresh the dashboard.
 *  Returns void so it can be used directly as a <form action>. */
export async function regenerateAction(): Promise<void> {
  await requireFamilySession();
  try {
    await generateSchedule(30);
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/monthly");
    revalidatePath("/groceries");
  } catch (error: any) {
    console.error("Failed to regenerate schedule:", error);
  }
}

export async function swapMealAction(
  dateStr: string,
  mealType: string,
  newMealName: string,
  prepTime: string = "N/A",
  ingredients: string = "",
  image: string = "",
  reason: string = ""
) {
  await requireFamilySession();
  try {
    await changeMeal({
      date: dateStr,
      mealType,
      name: newMealName,
      prepTime,
      ingredients,
      image,
      reason,
    });

    // Invalidate Next.js cache so dashboard updates immediately
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/monthly");
    revalidatePath("/groceries");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to swap meal:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/** Confirm the displayed meal as the final outcome without changing the plan. */
export async function confirmMealAction(
  dateStr: string,
  mealType: string,
  currentMealName: string,
  source: "Menu" | "Scheduled Meals" = "Scheduled Meals",
  cook: string = ""
) {
  await requireFamilySession();
  try {
    if (!dateStr || !mealType || !currentMealName || dateStr > todayStr()) {
      return { success: false, error: "Only today or a past meal can be confirmed." };
    }
    await recordMealFeedback({
      date: dateStr,
      type: mealType,
      action: "confirm",
      planned: currentMealName,
      previous: currentMealName,
      actual: currentMealName,
      source,
      status: "Confirmed",
      cook,
    });
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/monthly");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to confirm meal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Parent adjusts a kid's balance — bonus (+), deduction (−), or full cash-out
 *  (zeroOut=true, amount computed server-side). Every adjustment lands as an
 *  append-only Balance Log row: timestamp, amount, new total, note. */
export async function adjustBalanceAction(
  kid: string,
  amount: number,
  note: string,
  zeroOut: boolean
) {
  await requireFamilySession();
  try {
    if (!zeroOut && (!isFinite(amount) || amount === 0)) {
      return { success: false, error: "Enter a non-zero amount" };
    }

    const result = await appendBalanceAdjustment(kid, amount, note.trim(), zeroOut);

    revalidatePath("/chores");
    revalidatePath("/history");
    revalidatePath("/");

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Failed to adjust balance:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/** Parent edits a chore's standard value. This updates the Chores definition
 *  only; previously completed chores retain their original logged value. */
export async function updateChoreAllowanceAction(
  choreId: string,
  kid: string,
  allowance: number
) {
  await requireFamilySession();
  try {
    const cleanId = choreId.trim();
    const cleanKid = kid.trim();
    if (!cleanId || !cleanKid) {
      return { success: false, error: "Chore details are missing. Refresh and try again." };
    }
    if (!isFinite(allowance) || allowance < 0 || allowance > 100) {
      return { success: false, error: "Enter an amount between $0 and $100." };
    }

    const savedAllowance = await updateChoreAllowance(cleanId, cleanKid, allowance);

    revalidatePath("/chores");
    revalidatePath("/history");
    revalidatePath("/");

    return { success: true, allowance: savedAllowance };
  } catch (error: unknown) {
    console.error("Failed to update chore allowance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Kid taps a chore on the kiosk — check off (done=true) or undo (done=false).
 *  Always logged against today in the household timezone; past days stay
 *  immutable from the wall. */
export async function toggleChoreAction(
  choreId: string,
  kid: string,
  done: boolean,
  value: number
) {
  await requireFamilySession();
  try {
    await appendChoreLog(todayStr(), choreId, kid, done, value);

    revalidatePath("/chores");
    revalidatePath("/history");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle chore:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
