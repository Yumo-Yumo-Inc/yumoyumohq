/**
 * Smoke test: UK receipt (£) — currency and country must not be hardcoded.
 *
 * This test verifies a critical fix from phase 3: when Gemini reports "currency: GBP",
 * the pipeline must not HARDCODE it to TRY. International receipts, like the EFES
 * Miami example, must be stored in the pipeline with their own currency.
 *
 * Run: node --experimental-strip-types --no-warnings lib/receipt/parse/__tests__/machine-block.efes-uk.test.ts
 */

import { parseMachineOutput } from "../machine-block.ts";
import { machineOutputToGeminiResult } from "../to-gemini-result.ts";

const EFES_UK_OUTPUT = `EFES Restaurant
1 Whitechapel Road, London
Order: 58
Table 12, Cover 3, Clerk FATME
27.12.2022 — 17:27:32

HUMMUS  £5.50
MIXED KEBABS  £21.95
YOGHURT ADANA  £18.50
STRAWBERRY MOCK  £5.90
TAP WATER  —
TURKISH TEA  £2.00 (x2)
MISC FOOD  £3.00
TEA F  —
Service (12.50%): £7.11
TOTAL: £63.96

<YUMO_MACHINE_DATA>
document_type: receipt
merchant_legal_name: EFES RESTAURANT
merchant_display_name: EFES
merchant_category: restaurant
merchant_address: 1 Whitechapel Road, London
address_city: London
address_district: null
address_neighborhood: null
address_street: 1 Whitechapel Road
tax_office: null
tax_number: null
branch_info: null
receipt_date: 2022-12-27
receipt_time: 17:27:32
receipt_no: 58
country_code: GB
currency: GBP
total_paid: 63.96
total_vat: null
payment_method: null
payment_proven: false
pos_provider: null
card_last4: null
rejection_reason: Payment not proven (order ticket, not a paid receipt)
items_count: 8
confidence: 0.9
</YUMO_MACHINE_DATA>

<YUMO_LINE_ITEMS>
LINE | NAME | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | HUMMUS | 1 | adet | 5.50 | 5.50 | null
2 | MIXED KEBABS | 1 | adet | 21.95 | 21.95 | null
3 | YOGHURT ADANA | 1 | adet | 18.50 | 18.50 | null
4 | STRAWBERRY MOCK | 1 | adet | 5.90 | 5.90 | null
5 | TURKISH TEA | 2 | adet | 1.00 | 2.00 | null
6 | MISC FOOD | 1 | adet | 3.00 | 3.00 | null
7 | Service (12.50%) | 1 | adet | 7.11 | 7.11 | null
</YUMO_LINE_ITEMS>
`;

function assertEq<T>(label: string, actual: T, expected: T): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`FAIL  ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS  ${label}`);
  }
}

const parsed = parseMachineOutput(EFES_UK_OUTPUT);
const d = parsed.data;
if (!d) {
  console.error("FAIL  machine_data was null");
  process.exit(1);
}

// Critical: currency and country code come from Gemini — no hardcoding.
assertEq("currency", d.currency, "GBP");
assertEq("country_code", d.country_code, "GB");
assertEq("address_city", d.address_city, "London");
assertEq("total_paid", d.total_paid, 63.96);
assertEq("total_vat", d.total_vat, null);
assertEq("payment_proven", d.payment_proven, false);
assertEq("document_type", d.document_type, "receipt");

const mapped = machineOutputToGeminiResult(parsed);
if (!mapped) {
  console.error("FAIL  mapped was null");
  process.exit(1);
}

// Mapper must carry the fields through correctly
assertEq("mapped.currency", mapped.currency, "GBP");
assertEq("mapped.countryCode", (mapped as { countryCode: string | null }).countryCode, "GB");
assertEq("mapped.addressCity", mapped.addressCity, "London");
assertEq("mapped.total", mapped.total, 63.96);
assertEq("mapped.paymentProven", (mapped as { paymentProven: boolean | null }).paymentProven, false);

if (process.exitCode === 1) {
  console.log("\nSOME TESTS FAILED");
} else {
  console.log("\nALL UK RECEIPT TESTS PASSED");
}
