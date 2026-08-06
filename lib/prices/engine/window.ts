/**
 * Resolve the next price-epoch window.
 *
 * Shared by the daily cron and the admin build so the two never drift.
 *
 * The FIRST epoch is a genesis epoch: its window starts at the earliest receipt
 * (not "24h ago"), so all pre-launch verified receipts are committed to chain in
 * epoch 1. Otherwise the on-chain price history would silently begin at launch,
 * defeating the "price change over the last year" goal. Subsequent epochs run
 * forward from the previous epoch's window_end.
 */

import { sql } from "@/lib/db/client";

export type NextWindow = {
  epochNumber: number;
  windowStart: string;
  windowEnd: string;
  isGenesis: boolean;
};

export async function resolveNextPriceWindow(): Promise<NextWindow> {
  if (!sql) throw new Error("Database not available");

  const last = (await sql`
    SELECT epoch_number, window_end
    FROM price_epochs
    ORDER BY epoch_number DESC
    LIMIT 1
  `) as { epoch_number: number; window_end: string }[];

  const windowEnd = new Date().toISOString();

  if (last.length) {
    return {
      epochNumber: Number(last[0].epoch_number) + 1,
      windowStart: new Date(last[0].window_end).toISOString(),
      windowEnd,
      isGenesis: false,
    };
  }

  // Genesis: capture all history. Floor at the earliest eligible-ish receipt.
  const earliest = (await sql`
    SELECT MIN(created_at) AS first_at
    FROM receipts
    WHERE COALESCE(flags_rejected, false) = false AND duplicate_of IS NULL
  `) as { first_at: string | null }[];

  const windowStart = earliest[0]?.first_at
    ? new Date(earliest[0].first_at).toISOString()
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return { epochNumber: 1, windowStart, windowEnd, isGenesis: true };
}
