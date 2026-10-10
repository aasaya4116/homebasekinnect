import "server-only";

import { createClient, type User } from "@supabase/supabase-js";

type MobileAuthResult =
  | { user: User; response?: never }
  | { user?: never; response: Response };

function jsonError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    }
  );
}

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.HOMEBASE_ALLOWED_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Validate a native client's Supabase access token and the private family
 * allowlist. This intentionally uses the public anon key: getUser(token)
 * verifies the token with Supabase and does not require a service-role secret. */
export async function requireMobileUser(request: Request): Promise<MobileAuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allowlist = allowedEmails();

  if (!supabaseUrl || !supabaseAnonKey || allowlist.size === 0) {
    return { response: jsonError("Native access is not configured", 503) };
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return { response: jsonError("Unauthorized", 401) };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email?.trim().toLowerCase();

  if (error || !data.user || !email) {
    return { response: jsonError("Unauthorized", 401) };
  }
  if (!allowlist.has(email)) {
    return { response: jsonError("This account is not approved for Homebase", 403) };
  }

  return { user: data.user };
}

export function privateJson(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  return Response.json(data, { ...init, headers });
}
