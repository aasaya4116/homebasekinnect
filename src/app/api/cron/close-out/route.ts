import { NextRequest, NextResponse } from "next/server";
import { closeOutDays } from "@/lib/mealLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nightly close-out: snapshot each finalized day into "Meal History".
// Scheduled by vercel.json. Vercel attaches `Authorization: Bearer <CRON_SECRET>`
// when the CRON_SECRET env var is set, so we reject anything else.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await closeOutDays();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("close-out cron failed:", error);
    return NextResponse.json({ ok: false, error: error?.message || "error" }, { status: 500 });
  }
}
