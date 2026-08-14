/**
 * Run: npx tsx lib/insights/__tests__/ledger-date-repair.check.ts
 */
import {
  isValidLedgerDate,
  monthKeyFromLedgerDate,
  resolveLedgerDate,
} from "../ledger-date";

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

assertEq("swap month 14", monthKeyFromLedgerDate("2026-14-08"), "2026-08");
assertEq("swap is valid", isValidLedgerDate("2026-14-08"), true);
assertEq("swap prefers extraction", resolveLedgerDate("2026-14-08", "2026-07-01"), "2026-08-14");
assertEq("month 32 rejected", isValidLedgerDate("2026-32-01"), false);
assertEq("glued year still rejected", isValidLedgerDate("2019-05-2026"), false);

console.log(process.exitCode ? "FAILED" : "ALL PASS");
