/**
 * Run: npx tsx lib/receipt/ocr/__tests__/repair-iso-date.check.ts
 */
import { repairIsoDate } from "../repair-iso-date";

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

assertEq("swap YYYY-DD-MM", repairIsoDate("2026-14-08"), "2026-08-14");
assertEq("keep real ISO", repairIsoDate("2026-08-14"), "2026-08-14");
assertEq("reject month 32", repairIsoDate("2026-32-01"), null);
assertEq("reject Feb 31", repairIsoDate("2026-02-31"), null);
assertEq("empty is null", repairIsoDate(""), null);

console.log(process.exitCode ? "FAILED" : "ALL PASS");
