import type { SchoolChildKey, SchoolWeek } from "./school";

export type SchoolImportStatus = "draft" | "published" | "archived";

export type SchoolImportRecord = {
  rowNumber: number;
  importedAt: string;
  importId: string;
  messageId: string;
  childKey: SchoolChildKey;
  weekId: string;
  status: SchoolImportStatus;
  subject: string;
  sender: string;
  sourceUrl?: string;
  warnings: string[];
  week: SchoolWeek;
};

export type SchoolImportAttachment = {
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf";
  dataBase64: string;
};

export type SchoolImportPayload = {
  messageId: string;
  child: SchoolChildKey;
  subject: string;
  sender?: string;
  receivedAt?: string;
  sourceUrl?: string;
  body: string;
  attachments?: SchoolImportAttachment[];
};
