import type { Metadata } from "next";
import { KeyRound, ShieldCheck } from "lucide-react";
import { familySessionDays } from "@/lib/familySession";

export const metadata: Metadata = {
  title: "Family Sign In | Homebase Kinnect",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/";
  }
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const hasError = params.error === "incorrect";
  const isLimited = params.error === "limited";
  const isMisconfigured = params.error === "configuration";

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">
          <ShieldCheck size={34} strokeWidth={1.8} />
        </div>
        <p className="login-brand"><span>Asaya</span> Homebase <em>Kinnect</em></p>
        <h1 id="login-title">Welcome home</h1>
        <p className="login-copy">
          Enter the family passphrase to open the dashboard on this device.
        </p>

        <form className="login-form" action="/api/auth/login" method="post">
          <input type="hidden" name="next" value={nextPath} />
          <label htmlFor="passphrase">Family passphrase</label>
          <div className="login-input-wrap">
            <KeyRound size={19} aria-hidden="true" />
            <input
              id="passphrase"
              name="passphrase"
              type="password"
              minLength={12}
              maxLength={256}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          {hasError && <p className="login-error" role="alert">That passphrase didn&apos;t match. Please try again.</p>}
          {isLimited && <p className="login-error" role="alert">Too many attempts. Wait a few minutes and try again.</p>}
          {isMisconfigured && <p className="login-error" role="alert">Family access is not configured yet. Check the Vercel environment settings.</p>}
          <button className="btn-primary login-submit" type="submit">Open Homebase</button>
        </form>

        <p className="login-trust">
          This device will stay signed in for up to {familySessionDays()} days.
        </p>
      </section>
    </main>
  );
}
