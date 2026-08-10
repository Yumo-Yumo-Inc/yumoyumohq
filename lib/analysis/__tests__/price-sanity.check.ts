/**
 * Quick checks for price-sanity outlier gating (no vitest required).
 * Run: node --experimental-strip-types lib/analysis/__tests__/price-sanity.check.ts
 */
import { filterOutlierValues } from "../price-sanity.ts";

function assertEq(label: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    console.error(`FAIL ${label}: got ${g} want ${w}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${label}`);
  }
}

// Two-point cliff: 12 vs 240 — previously both survived because n < 3.
assertEq("pair coffee cliff keeps near-median", filterOutlierValues([12, 240]), [240]);

// Bread-style OCR spike among a normal cluster.
assertEq(
  "bread spike dropped",
  filterOutlierValues([15, 18, 16, 17, 2587.5]),
  [15, 18, 16, 17],
);

// Single value always kept.
assertEq("single kept", filterOutlierValues([42]), [42]);

console.log(process.exitCode ? "FAILED" : "ALL PASS");
