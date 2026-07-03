import { google } from 'googleapis';
import { getGoogleAuth } from './googleAuth';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '15fxj0XFwF2ZYYqTXTxFELzf94FVkvPoE';

// In-memory cache to avoid hammering the Drive API on every page load
let cachedPhotos: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches family photo URLs from a shared Google Drive folder.
 * Returns publicly accessible lh3.googleusercontent.com URLs that
 * can be rendered directly in <img> tags without authentication.
 */
export async function getFamilyPhotos(): Promise<string[]> {
  // Return cached results if still fresh
  if (cachedPhotos && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedPhotos;
  }

  try {
    const auth = getGoogleAuth([
      'https://www.googleapis.com/auth/drive.readonly',
    ]);
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/') and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 50,
      orderBy: 'name',
    });

    const files = res.data.files || [];

    // Build direct-access image URLs via Google's lh3 CDN proxy
    // Format: https://lh3.googleusercontent.com/d/{FILE_ID}=w1920
    const photoUrls = files.map(
      (f) => `https://lh3.googleusercontent.com/d/${f.id}=w1920`
    );

    // Cache the results
    cachedPhotos = photoUrls;
    cacheTimestamp = Date.now();

    return photoUrls;
  } catch (error) {
    console.error('Failed to fetch family photos from Drive:', error);
    return cachedPhotos || []; // Return stale cache if available, else empty
  }
}
