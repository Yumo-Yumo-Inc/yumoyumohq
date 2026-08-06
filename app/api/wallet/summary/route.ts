/**
 * GET /api/wallet/summary
 *
 * The user's cPoints balance, as rendered by the Wallet page (/app/insights).
 *
 * cPoints is the balance. Everything a user earns — receipts, quests, referrals
 * — is an entry in contribution_point_events and adds to it. This route reads
 * that ledger and nothing else, so the Wallet, the profile and the leaderboard
 * all show the same number.
 *
 *   - points.total: the whole cPoints balance
 *   - points.fromReceipts: the part earned from verified receipts
 *   - points.fromQuests: the part earned from quests and referrals
 *
 * It previously summed receipt_rewards.bint_bonus_amount plus
 * user_profiles.bint_balance — a second, differently-scaled ledger — so the
 * Wallet and the profile disagreed for the same account. bINT still exists
 * behind the scenes for audit and airdrop; it is no longer a user-facing
 * figure. Missing data returns zeros — no fabrication.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [ledgerRows, countRows] = await Promise.all([
      // One ledger, split by where each entry came from. Reversals and the
      // one-off merge compensation carry their own source_type and fall into
      // "other", so they still count toward the balance without being
      // attributed to receipts or quests.
      sql`
        WITH s AS (
          SELECT COALESCE(
            (SELECT start_at FROM seasons WHERE status = 'active' ORDER BY season_number DESC LIMIT 1),
            '1970-01-01'::timestamptz
          ) AS start_at
        )
        SELECT
          COALESCE(SUM(points_delta), 0)::float AS total,
          COALESCE(SUM(points_delta) FILTER (
            WHERE source_type LIKE 'receipt%'
          ), 0)::float AS from_receipts,
          COALESCE(SUM(points_delta) FILTER (
            WHERE source_type LIKE 'quest%' OR source_type LIKE 'referral%'
          ), 0)::float AS from_quests,
          COALESCE(SUM(points_delta) FILTER (
            WHERE created_at < (SELECT start_at FROM s)
          ), 0)::float AS alpha_points
        FROM contribution_point_events
        WHERE username = ${username}
      ` as Promise<Record<string, unknown>[]>,
      sql`
        SELECT count(*)::int AS total
        FROM receipts
        WHERE username = ${username}
      ` as Promise<Record<string, unknown>[]>,
    ]);

    const total = Math.round(Number(ledgerRows[0]?.total ?? 0) || 0);
    const pointsFromReceipts = Math.round(Number(ledgerRows[0]?.from_receipts ?? 0) || 0);
    const pointsFromQuests = Math.round(Number(ledgerRows[0]?.from_quests ?? 0) || 0);

    return NextResponse.json({
      points: {
        total,
        fromReceipts: pointsFromReceipts,
        fromQuests: pointsFromQuests,
      },
      alphaEarnings: Math.round(Number(ledgerRows[0]?.alpha_points ?? 0) || 0),
      receiptCount: Number(countRows[0]?.total ?? 0) || 0,
    });
  } catch (err) {
    console.error("[api/wallet/summary] failed:", err);
    return NextResponse.json({ error: "Failed to load wallet summary" }, { status: 500 });
  }
}
