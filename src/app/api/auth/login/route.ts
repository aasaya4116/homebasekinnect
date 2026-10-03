import { NextRequest, NextResponse } from "next/server";
import {
  createFamilySessionToken,
  FAMILY_SESSION_COOKIE,
  familyAuthConfigurationError,
  familySessionCookieOptions,
  verifyFamilyPassphrase,
} from "@/lib/familySession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function requestIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function safeNextPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/";
  }
  return value;
}

function loginRedirect(request: NextRequest, error: string, nextPath: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url, 303);
}

function blocked(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || record.resetAt <= now) {
    attempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  if (attempts.size > 500) {
    for (const [key, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(key);
    }
    if (attempts.size > 500) attempts.delete(attempts.keys().next().value || "");
  }
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  current.count += 1;
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_096) {
    return new NextResponse("Request too large", { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new NextResponse("Invalid request", { status: 400 });
  }
  const nextPath = safeNextPath(form.get("next"));
  const configurationError = familyAuthConfigurationError();
  if (configurationError) {
    console.error(`Family access configuration error: ${configurationError}`);
    return loginRedirect(request, "configuration", nextPath);
  }

  const ip = requestIp(request);
  if (blocked(ip)) {
    return loginRedirect(request, "limited", nextPath);
  }

  const passphrase = typeof form.get("passphrase") === "string"
    ? String(form.get("passphrase")).slice(0, 256)
    : "";

  // Keep failures from becoming a high-speed guessing endpoint.
  if (!verifyFamilyPassphrase(passphrase)) {
    recordFailure(ip);
    await new Promise((resolve) => setTimeout(resolve, 650));
    return loginRedirect(request, "incorrect", nextPath);
  }

  attempts.delete(ip);
  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  response.cookies.set(
    FAMILY_SESSION_COOKIE,
    await createFamilySessionToken(),
    familySessionCookieOptions(),
  );
  return response;
}
