import { getSql } from "@/lib/db/client";

/**
 * Temporary per-account upload limits, applied after a review found uploads
 * that broke the rules.
 *
 * The restriction carries its own expiry and lifts itself — no cron, no manual
 * step. Reads treat an elapsed `expires_at` as no restriction at all, so the
 * account returns to normal the moment the date passes.
 *
 * Storage is a small table rather than columns on `users` because a restriction
 * is an event with a reason and an end date, and we want the history when one
 * is questioned later.
 */

export interface AccountRestriction {
  username: string;
  /** Receipts this account may put through the pipeline per UTC day. */
  dailyReceiptLimit: number;
  /** ISO timestamp when the restriction stops applying. */
  expiresAt: string;
  reason: string;
}

let ensured = false;

/** Creates the table on first use — the project has no migration runner in this path. */
async function ensureTable(): Promise<void> {
  if (ensured) return;
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS account_restrictions (
        username         TEXT PRIMARY KEY,
        daily_receipt_limit INTEGER NOT NULL,
        expires_at       TIMESTAMPTZ NOT NULL,
        reason           TEXT NOT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    ensured = true;
  } catch {
    // Never block an upload on a schema call.
  }
}

/**
 * Returns the active restriction for `username`, or null when the account is
 * unrestricted or its restriction has already expired.
 */
export async function getAccountRestriction(
  username: string
): Promise<AccountRestriction | null> {
  if (!username) return null;
  await ensureTable();
  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = (await sql`
      SELECT username, daily_receipt_limit, expires_at, reason
      FROM account_restrictions
      WHERE username = ${username}
        AND expires_at > now()
      LIMIT 1
    `) as Array<Record<string, unknown>>;
    const row = rows?.[0];
    if (!row) return null;
    return {
      username: String(row.username),
      dailyReceiptLimit: Number(row.daily_receipt_limit) || 1,
      expiresAt: new Date(String(row.expires_at)).toISOString(),
      reason: String(row.reason ?? ""),
    };
  } catch {
    // A read failure must not silently restrict anyone.
    return null;
  }
}
