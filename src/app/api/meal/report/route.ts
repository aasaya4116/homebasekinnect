import { NextRequest, NextResponse } from "next/server";
import { buildMealInsightsReport } from "@/lib/mealReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.MEAL_REPORT_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || supplied !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const includeBaseline = request.nextUrl.searchParams.get("includeBaseline") === "true";
    const report = await buildMealInsightsReport(includeBaseline);
    return NextResponse.json({ ok: true, ...report });
  } catch (error: unknown) {
    console.error("Meal report generation failed:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
