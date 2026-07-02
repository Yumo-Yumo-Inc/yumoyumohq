/**
 * Smoke test: sample Çağrı receipt produces a sane parse.
 *
 * Not a Jest test — runnable via tsx/ts-node from the repo root:
 *   npx tsx lib/receipt/parse/__tests__/machine-block.cagri.test.ts
 *
 * It exits with code 1 if any of the basic assertions fail.
 */

import { parseMachineOutput } from "../machine-block.ts";
import { machineOutputToGeminiResult } from "../to-gemini-result.ts";

// Exact shape we expect Gemini to emit, mirroring the user's hand-written sample.
const SAMPLE_OUTPUT = `# Çağrı Mağazacılık — Süpermarket Fişi

**İşletme:** Çağrı Mağazacılık A.Ş.
**Adres:** Tatlısu Mah. Akdağ Cad. No:45/1 Ümraniye / İstanbul
**Tarih:** 11/04/2026 — 14:17:10
**Fiş No:** 00081
**Ödeme:** Visa **** 5394 — 1553.27 TRY
**Toplam:** 1553.27 TRY (KDV 152.33)

<YUMO_MACHINE_DATA>
document_type: receipt
document_subtype: supermarket_pos_receipt
document_confidence: 0.97
rejection_reason: null
merchant_legal_name: ÇAĞRI MAĞAZACILIK A.Ş.
merchant_display_name: Çağrı
merchant_category: supermarket
merchant_address: TATLISU MAH. AKDAĞ CAD. NO:45/1 ÜMRANİYE / İSTANBUL
branch_info: CAGRI GIDA- SERIFALI ÜMRANİYE/İSTANBUL
address_city: İstanbul
address_district: Ümraniye
address_neighborhood: Tatlısu Mah.
address_street: Akdağ Cad. No:45/1
tax_office: B.MÜKELLEFLER V.D
tax_number: 2200621779
receipt_date: 2026-04-11
receipt_time: 14:17:10
receipt_no: 00081
currency: TRY
items_count: 16
total_vat: 152.33
total_paid: 1553.27
total_raw: *1.553,27
vat_raw: *152,33
vat_rate: null
payment_method: visa
payment_amount: 1553.27
payment_proven: true
pos_provider: Isbank Visa
card_last4: 5394
category: grocery
utility_type: null
confidence: 0.97
integrity_is_complete: true
integrity_has_handwriting: false
integrity_has_tampering: false
integrity_is_photo_of_screen: false
integrity_is_crumpled: false
integrity_alteration_notes: null
low_confidence_fields: null
reasoning: Fiş tam görünüyor, alanlar net.
</YUMO_MACHINE_DATA>

<YUMO_LINE_ITEMS>
LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE | CATEGORY | SUBCATEGORY
1 | Parodontax Diş Macunu 50ml | Parodontax | 2 | adet | 79.95 | 159.90 | 0.10 | Kişisel Bakım & Kozmetik | Diş Bakımı
2 | Çağrı A-156 Kasa Poşeti | Çağrı | 3 | adet | 1.00 | 3.00 | 0.20 | Ev & Yaşam | Ambalaj
3 | Mabel Marseille Oda Spreyi | Mabel | 1 | adet | 76.95 | 76.95 | 0.20 | Ev & Yaşam | Koku
4 | Colgate Diş Fırçası Brilliant | Colgate | 1 | adet | 79.95 | 79.95 | 0.10 | Kişisel Bakım & Kozmetik | Diş Bakımı
5 | Doa Yüzey Temizleyici 1000ml Beyaz | Doa | 1 | adet | 59.95 | 59.95 | 0.20 | Temizlik & Deterjan | Yüzey Temizliği
6 | Doa Arap Sabunu 1000ml | Doa | 1 | adet | 49.95 | 49.95 | 0.20 | Temizlik & Deterjan | Genel Temizlik
7 | Barilla Makarna 500g Yassı | Barilla | 2 | adet | 39.95 | 79.90 | 0.01 | Bakliyat & Tahıllar | Makarna
8 | Tukaş Sos Basilico 360g | Tukaş | 2 | adet | 44.95 | 89.90 | 0.01 | Yağ & Baharat & Sos | Sos
9 | Blade Deodorant 150ml Cool Fresh | Blade | 1 | adet | 139.95 | 139.95 | 0.20 | Kişisel Bakım & Kozmetik | Deodorant
10 | Blade Deodorant 150ml Self Confidence | Blade | 1 | adet | 139.95 | 139.95 | 0.20 | Kişisel Bakım & Kozmetik | Deodorant
11 | Perwoll Bakım Deterjanı 2.97 L | Perwoll | 1 | adet | 279.95 | 279.95 | 0.20 | Temizlik & Deterjan | Çamaşır Deterjanı
12 | Saka Su 5L | Saka | 2 | adet | 44.95 | 89.90 | 0.01 | İçecekler | Su
13 | Limon Lamas | null | 0.696 | kg | 99.99 | 69.59 | 0.01 | Meyve & Sebze | Taze Meyve
14 | Muz İthal | null | 0.422 | kg | 149.99 | 63.30 | 0.01 | Meyve & Sebze | Taze Meyve
15 | Greyfurt | null | 1.756 | kg | 59.99 | 105.34 | 0.01 | Meyve & Sebze | Taze Meyve
16 | Mandalina Murkott | null | 1.316 | kg | 49.99 | 65.79 | 0.01 | Meyve & Sebze | Taze Meyve
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

const parsed = parseMachineOutput(SAMPLE_OUTPUT);

console.log(`-- warnings (${parsed.warnings.length}) --`);
for (const w of parsed.warnings) console.log("  - " + w);

console.log(`-- markdown report length: ${parsed.markdown_report.length} --`);

const d = parsed.data;
if (!d) {
  console.error("FAIL  machine_data was null");
  process.exit(1);
}

assertEq("document_type", d.document_type, "receipt");
assertEq("document_subtype", d.document_subtype, "supermarket_pos_receipt");
assertEq("document_confidence", d.document_confidence, 0.97);
assertEq("rejection_reason", d.rejection_reason, null);
assertEq("merchant_legal_name", d.merchant_legal_name, "ÇAĞRI MAĞAZACILIK A.Ş.");
assertEq("merchant_display_name", d.merchant_display_name, "Çağrı");
assertEq("merchant_category", d.merchant_category, "supermarket");
assertEq("address_city", d.address_city, "İstanbul");
assertEq("address_district", d.address_district, "Ümraniye");
assertEq("receipt_date", d.receipt_date, "2026-04-11");
assertEq("receipt_time", d.receipt_time, "14:17:10");
assertEq("receipt_no", d.receipt_no, "00081");
assertEq("currency", d.currency, "TRY");
assertEq("items_count", d.items_count, 16);
assertEq("total_vat", d.total_vat, 152.33);
assertEq("total_paid", d.total_paid, 1553.27);
assertEq("payment_method", d.payment_method, "visa");
assertEq("payment_proven", d.payment_proven, true);
assertEq("card_last4", d.card_last4, "5394");
assertEq("confidence", d.confidence, 0.97);
assertEq("integrity_is_complete", d.integrity_is_complete, true);
assertEq("integrity_has_tampering", d.integrity_has_tampering, false);
assertEq("integrity_alteration_notes (null list)", d.integrity_alteration_notes, null);
assertEq("low_confidence_fields (null list)", d.low_confidence_fields, null);
assertEq("vat_rate (null literal)", d.vat_rate, null);
assertEq("utility_type (null literal)", d.utility_type, null);

assertEq("line_items count", parsed.line_items.length, 16);

const it1 = parsed.line_items[0];
assertEq("li[0].line", it1.line, 1);
assertEq("li[0].name", it1.name, "Parodontax Diş Macunu 50ml");
assertEq("li[0].brand", it1.brand, "Parodontax");
assertEq("li[0].qty", it1.qty, 2);
assertEq("li[0].unit", it1.unit, "adet");
assertEq("li[0].unit_price", it1.unit_price, 79.95);
assertEq("li[0].total", it1.total, 159.9);
assertEq("li[0].vat_rate", it1.vat_rate, 0.1);
assertEq("li[0].category", it1.category, "Kişisel Bakım & Kozmetik");

const it13 = parsed.line_items[12]; // Limon Lamas — kg
assertEq("li[12].name", it13.name, "Limon Lamas");
assertEq("li[12].brand (null literal in row)", it13.brand, null);
assertEq("li[12].unit", it13.unit, "kg");
assertEq("li[12].qty", it13.qty, 0.696);
assertEq("li[12].unit_price", it13.unit_price, 99.99);
assertEq("li[12].total", it13.total, 69.59);

const mapped = machineOutputToGeminiResult(parsed);
if (!mapped) {
  console.error("FAIL  machineOutputToGeminiResult returned null");
  process.exit(1);
}

// New behavior: merchantName = display_name takes priority (storefront/signage name).
// Legal name is kept in a separate field (merchantLegalName).
assertEq("mapped.merchantName (display)", mapped.merchantName, "Çağrı");
assertEq("mapped.merchantLegalName", (mapped as { merchantLegalName: string | null }).merchantLegalName, "ÇAĞRI MAĞAZACILIK A.Ş.");
assertEq("mapped.merchantDisplayName", (mapped as { merchantDisplayName: string | null }).merchantDisplayName, "Çağrı");
assertEq("mapped.countryCode", (mapped as { countryCode: string | null }).countryCode, null);
assertEq("mapped.taxOffice", (mapped as { taxOffice: string | null }).taxOffice, "B.MÜKELLEFLER V.D");
assertEq("mapped.taxNumber", (mapped as { taxNumber: string | null }).taxNumber, "2200621779");
assertEq("mapped.posProvider", (mapped as { posProvider: string | null }).posProvider, "Isbank Visa");
assertEq("mapped.cardLast4", (mapped as { cardLast4: string | null }).cardLast4, "5394");
assertEq("mapped.paymentMethod", (mapped as { paymentMethod: string | null }).paymentMethod, "visa");
assertEq("mapped.paymentProven", (mapped as { paymentProven: boolean | null }).paymentProven, true);
assertEq("mapped.documentType", (mapped as { documentType: string | null }).documentType, "receipt");
assertEq("mapped.rejectionReason", (mapped as { rejectionReason: string | null }).rejectionReason, null);
assertEq("mapped.total", mapped.total, 1553.27);
assertEq("mapped.vat", mapped.vat, 152.33);
assertEq("mapped.date", mapped.date, "2026-04-11");
assertEq("mapped.time", mapped.time, "14:17:10");
assertEq("mapped.currency", mapped.currency, "TRY");
assertEq("mapped.confidence", mapped.confidence, 0.97);
assertEq("mapped.lineItems.length", mapped.lineItems.length, 16);
assertEq("mapped.lineItems[0].name", mapped.lineItems[0].name, "Parodontax Diş Macunu 50ml");
assertEq("mapped.lineItems[0].unitType", mapped.lineItems[0].unitType, "adet");
assertEq("mapped.lineItems[12].unitType", mapped.lineItems[12].unitType, "kg");
assertEq("mapped.integrity.isComplete", mapped.integrity.isComplete, true);

if (process.exitCode === 1) {
  console.log("\nSOME TESTS FAILED");
} else {
  console.log("\nALL TESTS PASSED");
}
