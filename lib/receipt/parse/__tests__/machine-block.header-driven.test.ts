/**
 * Test: header-driven line-item column mapping.
 *
 * The live <YUMO_LINE_ITEMS> prompt emits 8 columns (with BRAND)
 *   LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
 * while older fixtures use a 7-column form (no BRAND) or a full 10-column form.
 * The parser maps by HEADER name when present; header-less rows pick 7- vs 8-col
 * default from the first data row's width so TOTAL does not shift.
 *
 * Run: node --experimental-strip-types --no-warnings lib/receipt/parse/__tests__/machine-block.header-driven.test.ts
 */

import { parseMachineOutput } from "../machine-block.ts";

let failures = 0;
function assertEq(label: string, got: unknown, want: unknown): void {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  (got ${String(got)}, want ${String(want)})`}`);
  if (!ok) failures++;
}

// --- Case 1: live 7-column output (reproduces the GARAM bug) ---
const SEVEN_COL = `GARAM RESTORAN
<YUMO_MACHINE_DATA>
document_type: receipt
country_code: TR
currency: TRY
</YUMO_MACHINE_DATA>
<YUMO_LINE_ITEMS>
LINE | NAME | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | TUBORG 50CL | 2 | adet | 145.00 | 290.00 | 0.20
2 | TUBORG 50CL | 1 | adet | 330.00 | 330.00 | 0.20
</YUMO_LINE_ITEMS>`;

const s7 = parseMachineOutput(SEVEN_COL);
assertEq("7col li1 name", s7.line_items[0]?.name, "TUBORG 50CL");
assertEq("7col li1 qty", s7.line_items[0]?.qty, 2);
assertEq("7col li1 unit", s7.line_items[0]?.unit, "adet");
assertEq("7col li1 unit_price=145", s7.line_items[0]?.unit_price, 145);
assertEq("7col li1 total=290 (was 0.20 before fix)", s7.line_items[0]?.total, 290);
assertEq("7col li1 vat_rate=0.20", s7.line_items[0]?.vat_rate, 0.2);
assertEq("7col li1 brand stays null", s7.line_items[0]?.brand, null);
assertEq("7col li2 total=330", s7.line_items[1]?.total, 330);

// --- Case 2: full 10-column output still maps correctly ---
const TEN_COL = `X
<YUMO_LINE_ITEMS>
LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE | CATEGORY | SUBCATEGORY
1 | Parodontax 50ml | Parodontax | 2 | adet | 79.95 | 159.90 | 0.10 | Bakım | Diş
</YUMO_LINE_ITEMS>`;
const s10 = parseMachineOutput(TEN_COL);
assertEq("10col name", s10.line_items[0]?.name, "Parodontax 50ml");
assertEq("10col brand", s10.line_items[0]?.brand, "Parodontax");
assertEq("10col qty", s10.line_items[0]?.qty, 2);
assertEq("10col unit_price=79.95", s10.line_items[0]?.unit_price, 79.95);
assertEq("10col total=159.90", s10.line_items[0]?.total, 159.9);
assertEq("10col vat_rate=0.10", s10.line_items[0]?.vat_rate, 0.1);
assertEq("10col category", s10.line_items[0]?.category, "Bakım");

// --- Case 3: reordered header (TOTAL before UNIT_PRICE) ---
const REORDERED = `X
<YUMO_LINE_ITEMS>
LINE | NAME | QTY | TOTAL | UNIT_PRICE | VAT_RATE
1 | KALAMAR | 1 | 990.00 | 990.00 | 0.10
</YUMO_LINE_ITEMS>`;
const sr = parseMachineOutput(REORDERED);
assertEq("reordered name", sr.line_items[0]?.name, "KALAMAR");
assertEq("reordered total=990", sr.line_items[0]?.total, 990);
assertEq("reordered unit_price=990", sr.line_items[0]?.unit_price, 990);
assertEq("reordered vat_rate=0.10", sr.line_items[0]?.vat_rate, 0.1);

// --- Case 4: header-less rows fall back to default 7-col order ---
const NO_HEADER = `X
<YUMO_LINE_ITEMS>
1 | SU CAM ŞİŞE | 3 | adet | 130.00 | 390.00 | 0.10
</YUMO_LINE_ITEMS>`;
const nh = parseMachineOutput(NO_HEADER);
assertEq("noheader name", nh.line_items[0]?.name, "SU CAM ŞİŞE");
assertEq("noheader qty=3", nh.line_items[0]?.qty, 3);
assertEq("noheader unit_price=130", nh.line_items[0]?.unit_price, 130);
assertEq("noheader total=390", nh.line_items[0]?.total, 390);

// --- Case 5: header-less 8-col with BRAND (live prompt shape) ---
// Without width-aware default, TOTAL shifts into UNIT_PRICE and Σlines collapses
// (TH 7-Eleven: total=103 vs Σ=9).
const NO_HEADER_BRAND = `X
<YUMO_LINE_ITEMS>
1 | แซนวิชเคผักโขมชี | null | 1 | adet | null | 35.00 | null
2 | กล้วยหอมทอง | null | 2 | adet | 9.00 | 18.00 | null
3 | ASอเมริกาโน่ร้อน80 | null | 1 | adet | null | 50.00 | null
</YUMO_LINE_ITEMS>`;
const nhb = parseMachineOutput(NO_HEADER_BRAND);
assertEq("noheader8 name1", nhb.line_items[0]?.name, "แซนวิชเคผักโขมชี");
assertEq("noheader8 total1=35", nhb.line_items[0]?.total, 35);
assertEq("noheader8 total2=18", nhb.line_items[1]?.total, 18);
assertEq("noheader8 total3=50", nhb.line_items[2]?.total, 50);
assertEq("noheader8 unit_price2=9", nhb.line_items[1]?.unit_price, 9);
assertEq("noheader8 brand1 null", nhb.line_items[0]?.brand, null);
const sum8 = (nhb.line_items ?? []).reduce((a, it) => a + (it.total ?? 0), 0);
assertEq("noheader8 Σtotals=103", sum8, 103);

if (failures > 0) {
  console.log(`\n${failures} TEST(S) FAILED`);
  throw new Error(`${failures} header-driven test(s) failed`);
}
console.log("\nALL HEADER-DRIVEN TESTS PASSED");
