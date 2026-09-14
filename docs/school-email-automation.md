# School email automation

Homebase keeps weekly school updates in the existing family Google Sheet. Incoming teacher emails are parsed into **drafts** and appear under **School → Update inbox**. A parent must publish a draft before it replaces the live week.

## What the automation does

1. A Gmail filter labels a teacher email for Khalil or Mekhi.
2. A private Google Apps Script checks those labels hourly.
3. The script sends the email text and supported image/PDF attachments to Homebase.
4. Homebase extracts a structured week and appends it to the `School Weeks` Sheet tab as `draft`.
5. Publishing the draft archives that child's previous published row and refreshes the School page.

Gmail message IDs make imports idempotent: rerunning the script cannot create a second draft for the same child and message.

## One-time Vercel setup

Add these server-only environment variables to the Homebase Vercel project:

- `ANTHROPIC_API_KEY`
- `SCHOOL_IMPORT_MODEL` (for example, `claude-sonnet-5`)
- `SCHOOL_IMPORT_SECRET` (a long random value)

The existing `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SPREADSHEET_ID` settings remain unchanged. The service account must have edit access to the family Sheet.

Redeploy once after adding the variables.

## One-time Gmail setup

1. Open Google Apps Script while signed into the Gmail account that receives the teacher emails.
2. Create a standalone project named `Homebase School Import`.
3. Paste in `automation/school-email-import.gs`.
4. In **Project Settings → Script properties**, add:
   - `HOMEBASE_SCHOOL_IMPORT_URL` = `https://YOUR-HOMEBASE-DOMAIN/api/school/import`
   - `HOMEBASE_SCHOOL_IMPORT_SECRET` = the same value as `SCHOOL_IMPORT_SECRET` in Vercel
5. Run `setupSchoolEmailImport` once and approve the requested Gmail and external-request permissions.
6. In Gmail, create filters for the teacher senders:
   - Khalil's filter applies `Homebase/School/Khalil`
   - Mekhi's filter applies `Homebase/School/Mekhi`
7. Run `importLabeledSchoolEmails` once to test. Future checks run hourly.

## Safety behavior

- Email text and attachments are explicitly treated as untrusted source documents, never as instructions.
- The import endpoint requires a timing-safe bearer-secret match.
- Only JPEG, PNG, GIF, WebP, and PDF attachments are accepted.
- Text, attachment counts, payload size, URLs, icon names, and output collection sizes are constrained before storage or rendering.
- The child's identity comes from the trusted Gmail label, not from email contents.
- Ambiguous or conflicting details are shown as warnings in the review screen.
- No raw email body or attachment is stored in the Sheet; only the concise structured result and source metadata are retained.
