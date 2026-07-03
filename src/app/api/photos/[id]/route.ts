import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/googleAuth';

export const runtime = 'nodejs';
export const revalidate = 31536000; // Cache for 1 year

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    });
  } catch (error) {
    console.error(`Failed to fetch photo ${id} from Google Drive:`, error);
    return new NextResponse('Failed to fetch photo', { status: 500 });
  }
}
