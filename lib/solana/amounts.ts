/**
 * BigInt-safe INT amount helpers for chain-facing scripts.
 *
 * Per-leaf conversion must stay byte-exact with the engine's
 * `toBaseUnits` (lib/rewards/engine/merkle.ts) so exported CSV rows match the
 * committed merkle leaves. Totals, however, exceed Number-safe integer range
 * (99B INT × 10^6 base units), so aggregation is done in BigInt.
 */

import { toBaseUnits } from "@/lib/rewards/engine/merkle";

/** NUMERIC string (or number) from Postgres → base-unit bigint, engine-identical. */
export function intAmountToBaseUnits(intAmount: string | number): bigint {
  return BigInt(toBaseUnits(Number(intAmount)));
}

/** Sum base-unit amounts without precision loss. */
export function sumBaseUnits(amounts: Iterable<bigint>): bigint {
  let total = BigInt(0);
  for (const a of amounts) total += a;
  return total;
}
