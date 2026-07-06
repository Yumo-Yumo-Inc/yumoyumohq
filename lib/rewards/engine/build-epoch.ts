/**
 * Build one reward epoch from the contribution ledger (I/O shell).
 *
 * Reads the append-only ledger (contribution_point_events) for the epoch window,
 * converts bINT → INT (1:1), applies the soft-cap, and builds the merkle tree.
 * Returns the epoch + leaves; does NOT write to the DB and NEVER signs anything.
 * The cron route persists; ops signs the root into the distributor.
 *
 * NOTE (launch parameter): which ledger source_types count toward a user's
 * epoch bINT is treated here as "all positive points_delta in the window".
 * Narrow this at launch if some source_types should be excluded.
 */

import { keccak256 } from "js-sha3";
import { sql } from "@/lib/db/client";
import { getPrimaryAdmin } from "@/lib/auth/admin-users";
import { bintToInt } from "@/config/tokenomics";
import { computeAmounts, type RawClaim } from "./compute-amounts";
import { hashLeaf, buildTree, getProof } from "./merkle";

export type EpochLeaf = {
  username: string;
  walletAddress: string;
  rawAmount: number;
  intAmount: number;
  leafIndex: number;
  proof: string[];
};

export type EpochResult = {
  epochNumber: number;
  windowStart: string;
  windowEnd: string;
  merkleRoot: string;
  totalInt: number;
  softCapScale: number;
  participantCount: number;
  ledgerHash: string;
  leaves: EpochLeaf[];
};

/** Distinct users active in the last 30 days — MAU for the emission band. */
async function getMau(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(DISTINCT username)::int AS mau
    FROM contribution_point_events
    WHERE created_at >= now() - INTERVAL '30 days'
  `;
  return Number((rows as any[])[0]?.mau ?? 0);
}

/**
 * Per-user bINT with carry-forward (karar 2026-07-06, "ödül asla kısılmaz"):
 * a user's inclusion window is [their last settled epoch's window_end, windowEnd),
 * NOT the epoch's own window. Wallet-less users are skipped (no leaf address),
 * but their events stay unsettled — once they link a wallet, everything they
 * accrued before is included in their first epoch. A user's leaf in any prior
 * non-failed epoch marks those events as settled, which prevents double counting.
 * The independent verifier reimplements this same rule (lib/rewards/verifier).
 */
async function getEpochRawClaims(
  epochNumber: number,
  windowEnd: string
): Promise<RawClaim[]> {
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
  return (rows as any[])
    .filter((r) => r.wallet_address) // no wallet → cannot claim this epoch
    .map((r) => ({
      username: r.username as string,
      walletAddress: r.wallet_address as string,
      rawAmount: bintToInt(parseFloat(r.points) || 0),
    }));
}

/** keccak of the canonical raw input — binds the source slice (Step 7 invariant g). */
function hashLedgerSlice(rawClaims: RawClaim[]): string {
  const canonical = [...rawClaims]
    .sort((a, b) => a.username.localeCompare(b.username))
    .map((c) => `${c.username}|${c.walletAddress}|${c.rawAmount}`)
    .join("\n");
  return keccak256(canonical);
}

/** Build (but do not persist) the epoch. */
export async function buildEpoch(
  epochNumber: number,
  windowStart: string,
  windowEnd: string
): Promise<EpochResult> {
  const mau = await getMau();
  const rawClaims = await getEpochRawClaims(epochNumber, windowEnd);
  const { claims, softCapScale, totalInt } = computeAmounts(rawClaims, mau);

  const leafHashes = claims.map((c) => hashLeaf(c));
  const { root, layers } = buildTree(leafHashes);
  const sortedLeaves = layers[0]; // sorted ascending

  const leaves: EpochLeaf[] = claims.map((c) => {
    const leafHash = hashLeaf(c);
    return {
      username: c.username,
      walletAddress: c.walletAddress,
      rawAmount: c.rawAmount,
      intAmount: c.intAmount,
      leafIndex: sortedLeaves.indexOf(leafHash),
      proof: getProof(layers, leafHash),
    };
  });

  return {
    epochNumber,
    windowStart,
    windowEnd,
    merkleRoot: root,
    totalInt,
    softCapScale,
    participantCount: leaves.length,
    ledgerHash: hashLedgerSlice(rawClaims),
    leaves,
  };
}
