import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const FAMILY_SESSION_COOKIE = "homebase_family_session";

const SESSION_ISSUER = "homebase-kinnect";
const SESSION_AUDIENCE = "homebase-family";
const DEFAULT_SESSION_DAYS = 90;

function configuredPassphrase(): string {
  return process.env.HOMEBASE_ACCESS_PASSPHRASE?.trim() || "";
}

function configuredSessionSecret(): string {
  return process.env.HOMEBASE_SESSION_SECRET?.trim() || "";
}

export function familySessionDays(): number {
  const configured = Number(process.env.HOMEBASE_SESSION_DAYS || DEFAULT_SESSION_DAYS);
  if (!Number.isFinite(configured)) return DEFAULT_SESSION_DAYS;
  return Math.min(365, Math.max(1, Math.round(configured)));
}

function sessionKey(): Uint8Array {
  const secret = configuredSessionSecret();
  if (secret.length < 32) {
    throw new Error("HOMEBASE_SESSION_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

function credentialVersion(): string {
  const passphrase = configuredPassphrase();
  const secret = configuredSessionSecret();
  if (!passphrase || !secret) return "";
  return createHmac("sha256", secret)
    .update(passphrase)
    .digest("base64url")
    .slice(0, 22);
}

function comparisonDigest(value: string): Buffer {
  return createHmac("sha256", configuredSessionSecret()).update(value).digest();
}

export function familyAuthConfigurationError(): string | null {
  if (configuredPassphrase().length < 12) {
    return "HOMEBASE_ACCESS_PASSPHRASE must be at least 12 characters.";
  }
  if (configuredSessionSecret().length < 32) {
    return "HOMEBASE_SESSION_SECRET must be at least 32 characters.";
  }
  return null;
}

export function verifyFamilyPassphrase(candidate: string): boolean {
  if (familyAuthConfigurationError()) return false;
  const expected = comparisonDigest(configuredPassphrase());
  const supplied = comparisonDigest(candidate);
  return timingSafeEqual(expected, supplied);
}

export async function createFamilySessionToken(): Promise<string> {
  const error = familyAuthConfigurationError();
  if (error) throw new Error(error);

  const expiresAt = Math.floor(Date.now() / 1000) + familySessionDays() * 24 * 60 * 60;
  return new SignJWT({ kind: "family", credentialVersion: credentialVersion() })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(expiresAt)
    .sign(sessionKey());
}

export async function verifyFamilySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || familyAuthConfigurationError()) return false;

  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    return payload.kind === "family" && payload.credentialVersion === credentialVersion();
  } catch {
    return false;
  }
}

export function familySessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: familySessionDays() * 24 * 60 * 60,
  };
}
