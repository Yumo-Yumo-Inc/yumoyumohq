/**
 * Headless (non-HTTP) receipt pipeline entry.
 *
 * Runs the EXACT same pipeline as the web client — `runAnalyzeStages` (OCR/LLM,
 * duplicate checks, hidden-cost, reward + the Telegram daily-quota reservation)
 * followed by persist + `runPostProcess` — but driven from an in-memory image
 * buffer instead of an HTTP upload + session cookie. This is the adapter the
 * Telegram bot webhook uses; there is no second pipeline.
 *
 * Auth is upstream (webhook secret token → trusted telegram user), so the
 * pre-authenticated username is passed via context.preauthUsername and the image
 * bytes via context.fileBuffer (loadFile short-circuits on both).
 *
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("run-pipeline-headless is a server-only module.");
}

import { createHash } from "crypto";
import sharp from "sharp";

import { createAnalyzeContext } from "@/lib/receipt/analyze/parse-analyze-request";
import { runAnalyzeStages } from "@/app/api/receipt/analyze/analyze-receipt-service";
import { warmUpConnection } from "@/lib/db/client";
import {
  DailyLimitError,
  DuplicateError,
  RejectionError,
  type DailyQuotaShape,
} from "@/app/api/receipt/analyze/types";

export type HeadlessPipelineResult =
  | { ok: true; receiptId: string; payload: Record<string, unknown> }
  | { ok: false; kind: "limit"; quota: DailyQuotaShape }
  | { ok: false; kind: "rejected" | "duplicate"; message: string }
  | { ok: false; kind: "error"; message: string };

/** Compress + normalize the raw photo the way the web upload route does (resize + strip EXIF). */
async function normalizeImage(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input)
      .rotate() // honour EXIF orientation before stripping metadata
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return input; // if sharp can't read it, let the pipeline reject it downstream
  }
}

export interface HeadlessPipelineInput {
  username: string;
  imageBuffer: Buffer;
  expenseType?: "personal" | "other";
  userCountry?: string;
}

export async function runReceiptPipelineHeadless(
  input: HeadlessPipelineInput
): Promise<HeadlessPipelineResult> {
  const startTime = Date.now();
  const receiptId = `tg-${startTime.toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const requestId = `tg_${startTime}`;

  try {
    await warmUpConnection();

    const finalBuffer = await normalizeImage(input.imageBuffer);
    const hash = createHash("sha256").update(finalBuffer).digest("hex");

    const context = createAnalyzeContext(
      {
        receiptId,
        hash,
        filename: "telegram-photo.jpg",
        expenseType: input.expenseType ?? "personal",
      },
      startTime
    );
    // Trusted upstream identity + in-memory bytes → no session cookie, no storage fetch.
    context.preauthUsername = input.username;
    context.fileBuffer = finalBuffer;
    if (input.userCountry) context.userCountry = input.userCountry;

    const payload = await runAnalyzeStages(context, [], startTime, () => {}, `🤖 [${requestId}]`, requestId);

    // TEASER MODEL: the bot does NOT persist the receipt or credit points. It only
    // reveals the hidden cost and what the user *could* earn by scanning on the
    // site. Not saving is deliberate — it keeps the receipt free for the user's
    // real account to scan and actually earn (no duplicate block), and keeps the
    // messaging honest (nothing was credited to any account here).
    return { ok: true, receiptId, payload };
  } catch (error) {
    if (error instanceof DailyLimitError) {
      return { ok: false, kind: "limit", quota: error.quota };
    }
    if (error instanceof DuplicateError) {
      return { ok: false, kind: "duplicate", message: error.message };
    }
    if (error instanceof RejectionError) {
      // Reason is user-facing (e.g. "not a valid receipt", "total unreadable").
      return { ok: false, kind: "rejected", message: error.message };
    }
    // Genuinely unexpected — log the real cause so it is visible in the server
    // logs (the user only ever sees a generic message).
    const code = (error as { errorCode?: string })?.errorCode;
    console.error(
      `[telegram/pipeline] receipt ${receiptId} failed:`,
      code ? `[${code}] ` : "",
      error instanceof Error ? error.message : String(error)
    );
    return {
      ok: false,
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
