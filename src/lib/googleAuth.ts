import { google } from 'googleapis';

// Read credentials securely from environment variables
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
// Handle escaped newlines in the private key from .env
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!clientEmail || !privateKey) {
  console.warn("⚠️ Missing Google Service Account credentials in .env.local");
}

// Singleton auth client to be shared across the app
export const getGoogleAuth = (scopes: string[]) => {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes,
  });
};
