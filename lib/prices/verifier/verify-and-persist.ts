/**
 * Run Step-7 on a price epoch and persist the verdict.
 *
 * Shared by the admin route and the ops script so the two can never disagree
 * about what "verified" means. The verifier itself decides; this only records.
 * An epoch that does not pass must never be sealed.
 */

import { sql } from "@/lib/db/client";
import { verifyPriceEpoch, type PriceVerifyResult } from "./verify-price-epoch";

export type VerifyAndPersistResult = PriceVerifyResult & { status: string };

export async function verifyAndPersistPriceEpoch(epochNumber: number): Promise<VerifyAndPersistResult> {
  const result = await verifyPriceEpoch(epochNumber);
  const status = result.ok ? "verified" : "verify_failed";
  const notes = result.ok
    ? null
    : result.checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.reason}`).join("; ");

  // Only a still-pending epoch may change verdict: an approved or published one
  // may already be sealed on-chain.
  await sql`
    UPDATE price_epochs
    SET status = ${status}, verify_notes = ${notes}, updated_at = now()
    WHERE epoch_number = ${epochNumber} AND status IN ('pending_verification', 'verify_failed')
  `;

  return { ...result, status };
}

/** Mark a verified epoch approved — the last gate before ops seals the root. */
export async function approvePriceEpoch(epochNumber: number, approvedBy: string): Promise<boolean> {
  const rows = (await sql`
    UPDATE price_epochs
    SET status = 'approved', approved_by = ${approvedBy}, approved_at = now(), updated_at = now()
    WHERE epoch_number = ${epochNumber} AND status = 'verified'
    RETURNING epoch_number
  `) as unknown[];
  return rows.length > 0;
}
