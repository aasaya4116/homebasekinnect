# Homebase Kinnect for iPhone

The native companion to the Vercel kitchen dashboard. It reads the same Google
Sheet and Calendar data through private Next.js route handlers, while Supabase
Auth provides invite-only family access.

## What is included

- **Today:** dinner, lunch, family events, allowance totals, and live chore checkoffs
- **Week:** seven days of meals, cook ownership, and calendar events
- **Kids:** Mekhi and Khalil's published weekly updates, due-next tasks, and completion tracking
- **More:** Face ID status, account details, web dashboard link, and sign-out
- SecureStore-backed native sessions and Face ID/device-passcode unlock

## One-time private access setup

1. Create or select the Homebase Supabase project.
2. In **Authentication → Providers**, keep Email enabled and turn off public
   sign-ups if the project is only for Homebase.
3. In **Authentication → Users**, create one user for each parent.
4. Add these Vercel environment variables to Production and Preview:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `HOMEBASE_ALLOWED_EMAILS` — comma-separated parent email addresses

5. Copy `.env.example` to `.env.local` in this directory and fill in the same
   Supabase URL and anon key. Keep the API URL pointed at the protected Vercel app.

Only a valid Supabase user whose normalized email is in
`HOMEBASE_ALLOWED_EMAILS` can use `/api/mobile/*`.

## Local verification

```bash
npm install
npm run typecheck
npm run lint
npx expo start
```

## TestFlight

After the Expo account is connected:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```

The iOS bundle identifier is `com.asaya.homebasekinnect`. The first release can
stay in TestFlight for the two-parent pilot; an unlisted App Store release can
follow once the daily experience is settled.
