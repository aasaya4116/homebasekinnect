import { NextRequest, NextResponse } from "next/server";
import { FAMILY_SESSION_COOKIE, familySessionCookieOptions } from "@/lib/familySession";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(FAMILY_SESSION_COOKIE, "", {
    ...familySessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
