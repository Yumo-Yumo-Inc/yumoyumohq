/**
 * ledger-date: invalid OCR dates must not become "this month".
 * Run: node --experimental-strip-types --no-warnings lib/insights/__tests__/ledger-date.test.ts
 */

import {
  isValidLedgerDate,
  monthKeyFromLedgerDate,
  resolveLedgerDate,
} from "../ledger-date.ts";

let failures = 0;
function assertEq(label: string, got: unknown, want: unknown): void {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  (got ${String(got)}, want ${String(want)})`}`);
  if (!ok) failures++;
}

assertEq("valid date", isValidLedgerDate("2026-08-08"), true);
assertEq("valid month key", monthKeyFromLedgerDate("2026-08-08"), "2026-08");
assertEq("garbage glued year", isValidLedgerDate("2019-05-2026"), false);
assertEq("garbage null day", isValidLedgerDate("2026-06-null"), false);
assertEq("garbage month key null", monthKeyFromLedgerDate("2019-05-2026"), null);
assertEq("empty null", monthKeyFromLedgerDate(""), null);
assertEq("impossible day", isValidLedgerDate("2026-02-31"), false);

assertEq(
  "resolve prefers valid extraction",
  resolveLedgerDate("2026-08-01", "2026-07-15"),
  "2026-08-01"
);
assertEq(
  "resolve falls back on garbage extraction",
  resolveLedgerDate("2019-05-2026", "2026-07-15"),
  "2026-07-15"
);
assertEq(
  "resolve falls back on null-day extraction",
  resolveLedgerDate("2026-06-null", "2026-06-16T12:00:00.000Z"),
  "2026-06-16"
);

// Regression: old monthKeyFromDate(NaN) → today's month (would be 2026-08 now).
const todayYm = new Date().toISOString().slice(0, 7);
assertEq(
  "garbage must NOT equal today month",
  monthKeyFromLedgerDate("2019-05-2026") === todayYm,
  false
);

if (failures > 0) {
  console.log(`\n${failures} TEST(S) FAILED`);
  throw new Error(`${failures} ledger-date test(s) failed`);
}
console.log("\nALL LEDGER-DATE TESTS PASSED");
