/**
 * Independent recomputation of an epoch from the raw ledger (Step 7).
 *
 * Reimplements amount math inline (does NOT import the engine's computeAmounts)
 * and uses the independent merkle. Reads the same append-only source for the
 * same fixed window, so an honest engine yields an identical root; a tampered
 * root or backdated ledger row is caught.
 */

import { keccak256 } from "js-sha3";
import { sql } from "@/lib/db/client";
import { getPrimaryAdmin } from "@/lib/auth/admin-users";
import { BINT_TO_INT_RATE, getSoftCapC } from "@/config/tokenomics";
import { leafHashIndependent, rootIndependent } from "./merkle-independent";

export type RecomputeResult = {
  merkleRoot: string;
  totalInt: number;
  softCapScale: number;
  softCapC: number;
  ledgerHash: string;
  participantCount: number;
  perUser: { username: string; walletAddress: string; rawAmount: number; intAmount: number }[];
};

async function getMauIndependent(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(DISTINCT username)::int AS mau
    FROM contribution_point_events
    WHERE created_at >= now() - INTERVAL '30 days'
  `;
  return Number((rows as any[])[0]?.mau ?? 0);
}

export async function recomputeEpoch(epochNumber: number, windowEnd: string): Promise<RecomputeResult> {
  // Shared spec with the engine (independent implementation):
  // - wallet source: latest receipt-level wallet, else account-level wallet
  //   (decision 2026-07-04; caught in the devnet rehearsal).
  // - carry-forward (decision 2026-07-06): a user's inclusion window is
  //   [their last settled epoch's window_end, windowEnd); users with no prior
  //   leaf bring their full unsettled history when they first appear.
  const rows = await sql`
    SELECT
      e.username                                        AS username,
      COALESCE(SUM(e.points_delta), 0)::float           AS points,
      COALESCE(r.wallet_address, u.wallet_address)      AS wallet_address
    FROM contribution_point_events e
    LEFT JOIN users u ON u.username = e.username
    LEFT JOIN (
      SELECT l.username, MAX(ep.window_end) AS settled_until
      FROM reward_epoch_leaves l
      JOIN reward_epochs ep ON ep.epoch_number = l.epoch_number
      WHERE l.epoch_number < ${epochNumber}
        AND ep.status IN ('pending_verification', 'verified', 'approved', 'published')
      GROUP BY l.username
    ) s ON s.username = e.username
    LEFT JOIN LATERAL (
      SELECT wallet_address
      FROM receipts
      WHERE username = e.username AND wallet_address IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    ) r ON true
    WHERE e.created_at >= COALESCE(s.settled_until, '1970-01-01'::timestamptz)
      AND e.created_at < ${windowEnd}
      AND e.username IS NOT NULL
      AND e.username != ${getPrimaryAdmin()}
    GROUP BY e.username, COALESCE(r.wallet_address, u.wallet_address)
    HAVING COALESCE(SUM(e.points_delta), 0) > 0
  `;

  const raw = (rows as any[])
    .filter((r) => r.wallet_address)
    .map((r) => ({
      username: r.username as string,
      walletAddress: r.wallet_address as string,
      rawAmount: (parseFloat(r.points) || 0) * BINT_TO_INT_RATE,
    }));

  const totalRaw = raw.reduce((s, c) => s + c.rawAmount, 0);
  const mau = await getMauIndependent();
  const C = getSoftCapC(mau);
  const softCapScale = totalRaw > C && totalRaw > 0 ? C / totalRaw : 1;

  const perUser = raw.map((c) => ({ ...c, intAmount: c.rawAmount * softCapScale }));
  const totalInt = perUser.reduce((s, c) => s + c.intAmount, 0);

  const leafHashes = perUser.map((c) => leafHashIndependent(c.walletAddress, c.intAmount));
  const merkleRoot = rootIndependent(leafHashes);

  const ledgerHash = keccak256(
    [...raw]
      .sort((a, b) => a.username.localeCompare(b.username))
      .map((c) => `${c.username}|${c.walletAddress}|${c.rawAmount}`)
      .join("\n")
  );

  return { merkleRoot, totalInt, softCapScale, softCapC: C, ledgerHash, participantCount: perUser.length, perUser };
}
