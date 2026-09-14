import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { parseSchoolEmail } from "@/lib/schoolEmailParser";
import type { SchoolImportAttachment, SchoolImportPayload } from "@/lib/schoolImportTypes";
import { saveSchoolDraft } from "@/lib/schoolStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set<SchoolImportAttachment["mimeType"]>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

function authorized(request: Request): boolean {
  const secret = process.env.SCHOOL_IMPORT_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !supplied) return false;
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parsePayload(value: unknown): SchoolImportPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const child = raw.child === "khalil" || raw.child === "mekhi" ? raw.child : null;
  const messageId = cleanString(raw.messageId, 300);
  const body = cleanString(raw.body, 150_000);
  if (!child || !messageId) return null;

  const attachments: SchoolImportAttachment[] = [];
  if (Array.isArray(raw.attachments)) {
    for (const item of raw.attachments.slice(0, 6)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const attachment = item as Record<string, unknown>;
      const mimeType = cleanString(attachment.mimeType, 80) as SchoolImportAttachment["mimeType"];
      const dataBase64 = cleanString(attachment.dataBase64, 12_000_000);
      if (!ALLOWED_MIME_TYPES.has(mimeType) || !/^[A-Za-z0-9+/=\r\n]+$/.test(dataBase64)) return null;
      attachments.push({ filename: cleanString(attachment.filename, 180) || "attachment", mimeType, dataBase64 });
    }
  }
  if (!body && !attachments.length) return null;

  const sourceUrl = cleanString(raw.sourceUrl, 500);
  return {
    messageId,
    child,
    subject: cleanString(raw.subject, 300),
    sender: cleanString(raw.sender, 300),
    receivedAt: cleanString(raw.receivedAt, 80),
    sourceUrl: sourceUrl.startsWith("https://") ? sourceUrl : undefined,
    body,
    attachments,
  };
}

export async function POST(request: Request) {
  if (!process.env.SCHOOL_IMPORT_SECRET) {
    return NextResponse.json({ ok: false, error: "School import is not configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_000_000) {
    return NextResponse.json({ ok: false, error: "Email payload is too large" }, { status: 413 });
  }

  try {
    const payload = parsePayload(await request.json());
    if (!payload) return NextResponse.json({ ok: false, error: "Invalid school email payload" }, { status: 400 });

    const parsed = await parseSchoolEmail(payload);
    const saved = await saveSchoolDraft({
      messageId: payload.messageId,
      childKey: payload.child,
      subject: payload.subject,
      sender: payload.sender || "",
      sourceUrl: payload.sourceUrl,
      warnings: parsed.warnings,
      week: parsed.week,
    });
    revalidatePath("/school");
    revalidatePath("/school/review");
    return NextResponse.json({ ok: true, duplicate: saved.duplicate, importId: saved.record.importId });
  } catch (error: unknown) {
    console.error("School email import failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "The school update could not be imported" }, { status: 500 });
  }
}
