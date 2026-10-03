import "server-only";

import { cookies } from "next/headers";
import { FAMILY_SESSION_COOKIE, verifyFamilySessionToken } from "./familySession";

export async function hasFamilySession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyFamilySessionToken(cookieStore.get(FAMILY_SESSION_COOKIE)?.value);
}

export async function requireFamilySession(): Promise<void> {
  if (!(await hasFamilySession())) {
    throw new Error("Unauthorized family access");
  }
}
