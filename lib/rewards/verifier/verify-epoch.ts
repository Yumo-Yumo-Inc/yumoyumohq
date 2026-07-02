/**
 * Step 7 orchestrator: independently verify a pending epoch.
 *
 * Reads the stored epoch, recomputes from the raw ledger (independent path),
 * and runs the hard invariants. Returns the verdict; it does NOT mutate the
 * epoch — the admin route persists 'verified' / 'verify_failed'. An epoch that
 * does not pass must never be signed (yumo-guvenlik-gereksinimleri-v02.md §2.5).
 */

import { sql } from "@/lib/db/client";
import { CAPS } from "@/config/tokenomics";
import { recomputeEpoch } from "./recompute";
import {
  checkRootMatch,
  checkLedgerHash,
  checkSoftCap,
  checkCumulativeCap,
  checkWindowContiguity,
  checkTotalMatch,
  type Check,
} from "./invariants";

export type VerifyResult = {
  ok: boolean;
  epochNumber: number;
  checks: { name: string; ok: boolean; reason?: string }[];
  recomputedRoot: string;
};

export async function verifyEpoch(epochNumber: number): Promise<VerifyResult> {
  const epochRows = await sql`
    SELECT epoch_number, window_start, window_end, merkle_root, total_int, ledger_hash, status
    FROM reward_epochs
    WHERE epoch_number = ${epochNumber}
  `;
  const epoch = (epochRows as any[])[0];
  if (!epoch) {
    return { ok: false, epochNumber, checks: [{ name: "exists", ok: false, reason: "epoch not found" }], recomputedRoot: "" };
  }

  const windowStart = new Date(epoch.window_start).toISOString();
  const windowEnd = new Date(epoch.window_end).toISOString();
  const recomputed = await recomputeEpoch(windowStart, windowEnd);

  // committed cumulative for the User Rewards bucket (approved/published epochs).
  const cumRows = await sql`
    SELECT COALESCE(SUM(total_int), 0)::float AS cum
    FROM reward_epochs
    WHERE status IN ('approved', 'published') AND epoch_number <> ${epochNumber}
  `;
  const priorCumulative = Number((cumRows as any[])[0]?.cum ?? 0);

  const prevRows = await sql`
    SELECT window_end FROM reward_epochs WHERE epoch_number = ${epochNumber - 1}
  `;
  const prevWindowEnd = (prevRows as any[])[0]?.window_end
    ? new Date((prevRows as any[])[0].window_end).toISOString()
    : null;

  const named: { name: string; check: Check }[] = [
    { name: "root_match", check: checkRootMatch(epoch.merkle_root, recomputed.merkleRoot) },
    { name: "ledger_hash", check: checkLedgerHash(epoch.ledger_hash, recomputed.ledgerHash) },
    { name: "total_match", check: checkTotalMatch(Number(epoch.total_int), recomputed.totalInt) },
    { name: "soft_cap", check: checkSoftCap(recomputed.totalInt, recomputed.softCapC) },
    { name: "cumulative_cap", check: checkCumulativeCap(priorCumulative, recomputed.totalInt, CAPS.userRewards) },
    { name: "window_contiguity", check: checkWindowContiguity(prevWindowEnd, windowStart) },
  ];

  const checks = named.map((n) => ({ name: n.name, ok: n.check.ok, reason: n.check.reason }));
  return {
    ok: checks.every((c) => c.ok),
    epochNumber,
    checks,
    recomputedRoot: recomputed.merkleRoot,
  };
}
