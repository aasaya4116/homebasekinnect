import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/googleAuth';
import { FAMILY_SESSION_COOKIE, verifyFamilySessionToken } from '@/lib/familySession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyFamilySessionToken(
    request.cookies.get(FAMILY_SESSION_COOKIE)?.value
  );
  if (!authenticated) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return new NextResponse('Missing photo ID', { status: 400 });
  }

  try {
    const auth = getGoogleAuth(['https://www.googleapis.com/auth/drive.readonly']);
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const contentType = res.headers['content-type'] || 'image/jpeg';
    const buffer = Buffer.from(res.data as ArrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Drive file IDs are stable, so the wall display can keep each photo in
        // its private browser cache instead of downloading the original again
        // every time the slideshow loops. `private` prevents shared CDN caches
        // from storing family photos, while `immutable` avoids revalidation.
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      },
    });
  } catch (error) {
    console.error(`Failed to fetch photo ${id} from Google Drive:`, error);
    return new NextResponse('Failed to fetch photo', { status: 500 });
  }
}
