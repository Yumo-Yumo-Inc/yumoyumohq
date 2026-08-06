/**
 * Pure, dependency-free helpers for the Telegram webhook route. Kept separate so
 * they can be unit-tested without pulling in the pipeline / next-og module graph.
 */

import { timingSafeEqual } from "crypto";
import type { TelegramUser } from "@/lib/telegram/identity";

/** Constant-time comparison of the webhook secret token against the configured one. */
export function webhookSecretMatches(got: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected) return false; // fail closed — never accept when unconfigured
  const a = Buffer.from(got ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Build a trusted TelegramUser from a webhook `from` object (id kept as string). */
export function toTelegramUser(from: Record<string, unknown> | undefined | null): TelegramUser | null {
  if (!from || from.id == null) return null;
  const id = typeof from.id === "number" ? String(Math.trunc(from.id)) : String(from.id);
  if (!/^\d+$/.test(id)) return null;
  return {
    id,
    firstName: typeof from.first_name === "string" ? from.first_name : null,
    lastName: typeof from.last_name === "string" ? from.last_name : null,
    username: typeof from.username === "string" ? from.username : null,
    languageCode: typeof from.language_code === "string" ? from.language_code : null,
  };
}

/** Highest-resolution photo size Telegram offers (last entry). */
export function largestPhotoFileId(photo: Array<{ file_id?: string }> | undefined): string | null {
  if (!Array.isArray(photo) || photo.length === 0) return null;
  const last = photo[photo.length - 1];
  return typeof last?.file_id === "string" ? last.file_id : null;
}

/** Parse a leading `/command` (strips `@botname` and arguments); null if not a command. */
export function parseCommand(text: string | undefined | null): string | null {
  if (typeof text !== "string" || !text.startsWith("/")) return null;
  return text.slice(1).split(/[\s@]/)[0].toLowerCase() || null;
}

/** file_id of a photo or an image/pdf document attachment, else null. */
export function extractImageFileId(message: {
  photo?: Array<{ file_id?: string }>;
  document?: { file_id?: string; mime_type?: string };
}): string | null {
  const photo = largestPhotoFileId(message.photo);
  if (photo) return photo;
  const doc = message.document;
  if (doc?.file_id && typeof doc.mime_type === "string" && /^(image\/|application\/pdf)/.test(doc.mime_type)) {
    return doc.file_id;
  }
  return null;
}
