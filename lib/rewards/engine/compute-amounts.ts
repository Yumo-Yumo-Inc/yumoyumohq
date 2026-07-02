/**
 * Pure reward-amount computation for one epoch.
 *
 * Input: per-user raw INT claims (already converted from bINT at 1:1 upstream).
 * Applies the soft-cap pro-rata scale and returns effective amounts.
 *
 *   C  = getSoftCapC(mau)              global ceiling for the epoch (not published)
 *   s  = min(1, C / Σ raw)             single scale, equal for everyone
 *   effective_i = raw_i × s            Σ effective ≤ C
 *
 * No DB, no I/O — deterministic and unit-testable. Binding: karar §11.1.
 */

import { getSoftCapC } from "@/config/tokenomics";

export type RawClaim = { username: string; walletAddress: string; rawAmount: number };
export type ScaledClaim = RawClaim & { intAmount: number };

export type ComputeResult = {
  claims: ScaledClaim[];
  softCapScale: number; // s
  totalRaw: number;
  totalInt: number; // Σ effective
};

/** Apply soft-cap pro-rata scaling to raw claims. */
export function computeAmounts(rawClaims: RawClaim[], mau: number): ComputeResult {
  const positive = rawClaims.filter((c) => c.rawAmount > 0);
  const totalRaw = positive.reduce((sum, c) => sum + c.rawAmount, 0);

  const C = getSoftCapC(mau);
  const softCapScale = totalRaw > C && totalRaw > 0 ? C / totalRaw : 1;

  const claims: ScaledClaim[] = positive.map((c) => ({
    ...c,
    intAmount: c.rawAmount * softCapScale,
  }));

  const totalInt = claims.reduce((sum, c) => sum + c.intAmount, 0);
  return { claims, softCapScale, totalRaw, totalInt };
}
