import { NextRequest, NextResponse } from "next/server";
import { FAMILY_SESSION_COOKIE, verifyFamilySessionToken } from "@/lib/familySession";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
]);

// These machine-to-machine routes already enforce their own bearer secrets.
const AUTOMATION_PATHS = new Set([
  "/api/cron/close-out",
  "/api/meal/report",
  "/api/school/import",
]);

function protectResponse(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

function safeReturnPath(request: NextRequest): string {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTOMATION_PATHS.has(pathname)) {
    return protectResponse(NextResponse.next());
  }

  const sessionToken = request.cookies.get(FAMILY_SESSION_COOKIE)?.value;
  const authenticated = await verifyFamilySessionToken(sessionToken);

  if (pathname === "/login" && authenticated) {
    return protectResponse(NextResponse.redirect(new URL("/", request.url)));
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return protectResponse(NextResponse.next());
  }

  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return protectResponse(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", safeReturnPath(request));
    return protectResponse(NextResponse.redirect(loginUrl));
  }

  return protectResponse(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
