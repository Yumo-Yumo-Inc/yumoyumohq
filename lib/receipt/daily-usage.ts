/**
 * Per-subject daily receipt-processing quota.
 *
 * The Telegram Mini App is another client for the same receipt pipeline. To cap
 * provider cost (OCR/LLM) and abuse on that channel, a Telegram-origin user may
 * run at most `getTelegramDailyReceiptLimit()` processing attempts per UTC
 * calendar day. Web users are NOT subject to this — they keep the existing
 * per-user pipeline throttle (lib/auth/rate-limit.ts). The channel is derived
 * server-side from the user record (`users.source_channel`), never from a
 * client-supplied flag, so it cannot be spoofed to gain a larger allowance.
 *
 * Concurrency: the reservation is a single atomic
 * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING attempts_count` statement that
 * row-locks the (subject, day) bucket, so two simultaneous requests serialize
 * and a burst cannot slip past the limit. This is the same TOCTOU-safe shape
 * used by rate_limit_buckets.
 *
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("daily-usage is a server-only module. Do not import in client components.");
}

import { getSql } from "@/lib/db/client";
import { getAccountRestriction } from "./account-restriction";

type SourceChannel = "web" | "telegram";

export interface DailyQuota {
  limit: number;
  used: number;
  remaining: number;
  /** ISO timestamp of the next UTC midnight, when the quota resets. */
  resetAt: string;
}

/** Machine-readable error code returned to clients when the quota is exhausted. */
const DAILY_RECEIPT_LIMIT_CODE = "DAILY_RECEIPT_LIMIT_REACHED";

/** Telegram-channel daily processing limit. Configurable via env, defaults to 2. */
export function getTelegramDailyReceiptLimit(): number {
  const raw = process.env.TELEGRAM_DAILY_RECEIPT_LIMIT;
  const parsed = raw != null ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

/** Current UTC calendar day as `YYYY-MM-DD` (the quota window key). */
export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** ISO timestamp of the next UTC midnight after `now` — when the quota resets. */
export function nextUtcResetAt(now: Date = new Date()): string {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return next.toISOString();
}

/**
 * Admin/test accounts that bypass the Telegram daily limit. Comma-separated
 * Telegram user ids in TELEGRAM_ADMIN_USER_IDS (matched against the numeric id
 * embedded in a `telegram_<id>` username). Used for QA and the owner's testing.
 */
function getAdminTelegramIds(): Set<string> {
  const raw = process.env.TELEGRAM_ADMIN_USER_IDS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/** Extract the numeric Telegram id from a `telegram_<id>` username, else null. */
export function telegramIdFromUsername(username: string): string | null {
  const match = /^telegram_(\d+)$/.exec(username);
  return match ? match[1] : null;
}

/**
 * Whether `username` is subject to the Telegram daily quota. True only for
 * accounts created through the Telegram channel. Reads the authoritative
 * `users.source_channel`; defensively returns false (no limit) on any DB issue
 * so an outage never blocks web users — the pipeline throttle still applies.
 */
export async function isTelegramChannelUser(username: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    const rows = await sql`
      SELECT source_channel FROM users WHERE username = ${username} LIMIT 1
    `;
    return rows[0]?.source_channel === "telegram";
  } catch {
    return false;
  }
}

/** Read-only quota snapshot for `subjectId` (no increment). */
export async function getDailyQuota(subjectId: string): Promise<DailyQuota> {
  const limit = getTelegramDailyReceiptLimit();
  const now = new Date();
  const resetAt = nextUtcResetAt(now);
  const sql = getSql();
  if (!sql) return { limit, used: 0, remaining: limit, resetAt };

  try {
    const rows = await sql`
      SELECT attempts_count
      FROM receipt_daily_usage
      WHERE usage_subject_id = ${subjectId} AND usage_date = ${utcDateKey(now)}
      LIMIT 1
    `;
    const used = Number(rows[0]?.attempts_count ?? 0);
    return { limit, used, remaining: Math.max(0, limit - used), resetAt };
  } catch {
    return { limit, used: 0, remaining: limit, resetAt };
  }
}

interface ReservationResult {
  /** Whether the attempt was allowed to proceed. */
  allowed: boolean;
  /** True when a quota slot was actually consumed (so it can be refunded). */
  reserved: boolean;
  quota: DailyQuota;
}

/**
 * Atomically reserve one processing attempt for `subjectId` for today.
 *
 * Increments `attempts_count` and returns the post-increment value in one
 * statement. If the new count exceeds the limit, the attempt is rejected —
 * BUT the row was still incremented, so the caller MUST NOT proceed to the
 * expensive work and the surplus is self-correcting (the same over-limit count
 * keeps rejecting until the UTC day rolls). The caller treats `allowed=false`
 * as "429, do not start Vision". No refund is needed on rejection because the
 * expensive work never ran and tomorrow's window is a fresh row.
 */
async function reserveDailyAttempt(
  subjectId: string,
  limitOverride?: number
): Promise<ReservationResult> {
  const limit = limitOverride ?? getTelegramDailyReceiptLimit();
  const now = new Date();
  const resetAt = nextUtcResetAt(now);
  const sql = getSql();

  // No DB → fail open (do not block the pipeline). Web users never reach here.
  if (!sql) {
    return { allowed: true, reserved: false, quota: { limit, used: 0, remaining: limit, resetAt } };
  }

  try {
    const rows = await sql`
      INSERT INTO receipt_daily_usage (usage_subject_id, usage_date, attempts_count, updated_at)
      VALUES (${subjectId}, ${utcDateKey(now)}, 1, now())
      ON CONFLICT (usage_subject_id, usage_date)
      DO UPDATE SET attempts_count = receipt_daily_usage.attempts_count + 1, updated_at = now()
      RETURNING attempts_count
    `;
    const used = Number((rows[0] as { attempts_count: number })?.attempts_count ?? 1);
    if (used > limit) {
      return {
        allowed: false,
        reserved: false, // over-limit increment is not a usable slot; do not refund it
        quota: { limit, used: limit, remaining: 0, resetAt },
      };
    }
    return {
      allowed: true,
      reserved: true,
      quota: { limit, used, remaining: Math.max(0, limit - used), resetAt },
    };
  } catch {
    // DB error → fail open. Never block a user because our quota store hiccuped.
    return { allowed: true, reserved: false, quota: { limit, used: 0, remaining: limit, resetAt } };
  }
}

/**
 * Refund one previously reserved attempt (best-effort). Called when the attempt
 * never actually incurred provider cost — an exact duplicate caught before
 * Vision, or a provider/pipeline outage — per the counting rules. Never drops
 * below zero.
 */
export async function refundDailyAttempt(subjectId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      UPDATE receipt_daily_usage
      SET attempts_count = GREATEST(0, attempts_count - 1), updated_at = now()
      WHERE usage_subject_id = ${subjectId} AND usage_date = ${utcDateKey()}
    `;
  } catch {
    /* best-effort; a stuck +1 self-clears at the next UTC day */
  }
}

/** Mark that a reserved attempt ended in a verified receipt (audit signal). */
export async function markDailyAttemptVerified(subjectId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      UPDATE receipt_daily_usage
      SET verified_count = verified_count + 1, updated_at = now()
      WHERE usage_subject_id = ${subjectId} AND usage_date = ${utcDateKey()}
    `;
  } catch {
    /* best-effort audit only */
  }
}

/**
 * Reserve an attempt only when `username` is a Telegram-channel account and not
 * an admin/test bypass. Returns `{ subjectId }` when a refundable slot was
 * consumed. Throws nothing — the caller inspects `allowed` and stops the
 * pipeline itself so this stays a pure data operation.
 */
export interface ChannelReservation {
  /** Set when this account is subject to the quota (Telegram, non-admin). */
  subjectId: string | null;
  allowed: boolean;
  reserved: boolean;
  quota: DailyQuota | null;
}

export async function reserveTelegramDailyAttempt(username: string): Promise<ChannelReservation> {
  // A restricted account is capped regardless of which client it uploads from.
  // Checked before the Telegram branch so the tighter of the two limits wins.
  const restriction = await getAccountRestriction(username);
  if (restriction) {
    const result = await reserveDailyAttempt(username, restriction.dailyReceiptLimit);
    return {
      subjectId: username,
      allowed: result.allowed,
      reserved: result.reserved,
      quota: result.quota,
    };
  }

  const isTelegram = await isTelegramChannelUser(username);
  if (!isTelegram) {
    return { subjectId: null, allowed: true, reserved: false, quota: null };
  }

  const tgId = telegramIdFromUsername(username);
  if (tgId && getAdminTelegramIds().has(tgId)) {
    // Admin/test override: never limited (test #14).
    return { subjectId: null, allowed: true, reserved: false, quota: null };
  }

  const result = await reserveDailyAttempt(username);
  return {
    subjectId: username,
    allowed: result.allowed,
    reserved: result.reserved,
    quota: result.quota,
  };
}
