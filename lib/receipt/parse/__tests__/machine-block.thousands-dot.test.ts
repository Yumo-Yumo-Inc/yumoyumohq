/**
 * Test: dot-as-thousands separator correction (B1).
 *
 * Some locales (e.g. Indonesia, IDR) print "85.325" to mean 85325 with the dot
 * as a THOUSANDS separator and no minor unit. The prompt's "use a dot" guidance
 * made Gemini keep the dot, and Number("85.325") then read it as 85.325 — a
 * 1000x error. The parser now resolves this deterministically, gated on currency:
 *   - For non-3-decimal currencies, a lone ".XXX" (exactly 3 digits, non-zero
 *     leading integer digit) is a thousands group and the dot is removed.
 *   - For 3-decimal currencies (KWD/BHD/OMR/TND/JOD/LYD/IQD) the dot is a real
 *     decimal and is left untouched.
 *   - Leading-zero fractions ("0.696" weight) and 1-2 decimal money ("12.50")
 *     are never touched.
 *
 * Run: node --experimental-strip-types --no-warnings lib/receipt/parse/__tests__/machine-block.thousands-dot.test.ts
 */

import { parseMachineOutput } from "../machine-block.ts";

let failures = 0;
function assertEq(label: string, got: unknown, want: unknown): void {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  (got ${String(got)}, want ${String(want)})`}`);
  if (!ok) failures++;
}

// --- Case 1: IDR receipt with dot-thousands (real fc08b133 values) ---
const IDR_DOT = `PT BHAKTI KARYA DISTRIBUSI
<YUMO_MACHINE_DATA>
document_type: receipt
country_code: ID
currency: IDR
total_paid: 85.325
total_vat: 8.455
items_count: 2
</YUMO_MACHINE_DATA>
<YUMO_LINE_ITEMS>
LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE | CATEGORY | SUBCATEGORY
1 | MENTOS SAK FRUIT | null | 1 | adet | 6.400 | 6.400 | null | null | null
2 | CHITATO 15GR | null | 1 | adet | 17.500 | 17.500 | null | null | null
</YUMO_LINE_ITEMS>`;

const idr = parseMachineOutput(IDR_DOT);
assertEq("IDR total_paid 85.325 -> 85325", idr.data?.total_paid, 85325);
assertEq("IDR total_vat 8.455 -> 8455", idr.data?.total_vat, 8455);
assertEq("IDR line1 unit_price 6.400 -> 6400", idr.line_items[0]?.unit_price, 6400);
assertEq("IDR line1 total 6.400 -> 6400", idr.line_items[0]?.total, 6400);
assertEq("IDR line2 total 17.500 -> 17500", idr.line_items[1]?.total, 17500);

// --- Case 2: comma-decimal money must stay (TR) ---
const TR_COMMA = `X
<YUMO_MACHINE_DATA>
document_type: receipt
country_code: TR
currency: TRY
total_paid: 1.034,30
total_vat: 81,17
</YUMO_MACHINE_DATA>`;
const tr = parseMachineOutput(TR_COMMA);
assertEq("TR 1.034,30 -> 1034.30", tr.data?.total_paid, 1034.3);
assertEq("TR 81,17 -> 81.17", tr.data?.total_vat, 81.17);

// --- Case 3: plain dot-decimal money (2 digits) must stay ---
const DOT2 = `X
<YUMO_MACHINE_DATA>
document_type: receipt
currency: USD
total_paid: 31475.00
total_vat: 12.50
</YUMO_MACHINE_DATA>`;
const dot2 = parseMachineOutput(DOT2);
assertEq("USD 31475.00 stays", dot2.data?.total_paid, 31475);
assertEq("USD 12.50 stays", dot2.data?.total_vat, 12.5);

// --- Case 4: 3-decimal currency keeps its decimals (KWD) ---
const KWD = `X
<YUMO_MACHINE_DATA>
document_type: receipt
currency: KWD
total_paid: 12.625
total_vat: 1.500
</YUMO_MACHINE_DATA>`;
const kwd = parseMachineOutput(KWD);
assertEq("KWD 12.625 stays decimal", kwd.data?.total_paid, 12.625);
assertEq("KWD 1.500 stays decimal", kwd.data?.total_vat, 1.5);

// --- Case 5: leading-zero 3-decimal weight must NOT be de-separated ---
const WEIGHT = `X
<YUMO_MACHINE_DATA>
document_type: receipt
currency: TRY
</YUMO_MACHINE_DATA>
<YUMO_LINE_ITEMS>
LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE | CATEGORY | SUBCATEGORY
1 | DOMATES | null | 0.696 | kg | 25.000 | 17.40 | 0.01 | null | null
</YUMO_LINE_ITEMS>`;
const w = parseMachineOutput(WEIGHT);
// qty is parsed WITHOUT the currency hint, so 3-decimal weights are always safe.
assertEq("weight qty 0.696 stays", w.line_items[0]?.qty, 0.696);
// 25.000 in TRY is a thousands-style ".000" group -> 25000 (deterministic rule).
// ".000" can never be a meaningful money decimal; unit price follows the same
// currency-gated thousands rule as totals.
assertEq("TRY unit_price 25.000 -> 25000", w.line_items[0]?.unit_price, 25000);
assertEq("TRY line total 17.40 stays", w.line_items[0]?.total, 17.4);

// --- Case 6: qty/weight with dot must NEVER be de-separated (regression).
// "1.350" kg quantity and "2.88" m2 stay as fractions; only monetary fields with
// a currency hint get the thousands-dot fix. Bug seen in batch 2026-06-01 (lokum
// ET qty 1.350 -> 1350).
const QTY_DOT = `x
<YUMO_MACHINE_DATA>
country_code: TR
currency: TRY
</YUMO_MACHINE_DATA>
<YUMO_LINE_ITEMS>
LINE | NAME | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | ET | 1.350 | kg | 2850 | 3847.50 | null
2 | MOZAIK | 2.88 | m2 | 2699.71 | 7775.18 | null
</YUMO_LINE_ITEMS>`;
const q = parseMachineOutput(QTY_DOT);
assertEq("qty 1.350 kg stays 1.35 (not 1350)", q.line_items[0]?.qty, 1.35);
assertEq("qty 2.88 m2 stays", q.line_items[1]?.qty, 2.88);
assertEq("line1 total 3847.50 stays", q.line_items[0]?.total, 3847.5);

if (failures > 0) {
  console.log(`\n${failures} TEST(S) FAILED`);
  throw new Error(`${failures} thousands-dot test(s) failed`);
}
console.log("\nALL THOUSANDS-DOT TESTS PASSED");
