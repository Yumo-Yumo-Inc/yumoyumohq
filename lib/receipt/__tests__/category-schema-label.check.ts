/**
 * Category schema labels must never fall back to "General".
 * Run: npx tsx lib/receipt/__tests__/category-schema-label.check.ts
 */
import assert from "node:assert/strict";
import {
  getCategorySchemaLabel,
  getReceiptCategoryKind,
} from "../cost-layer-display.ts";
import {
  refineReceiptCategoryFromMerchantEvidence,
} from "../categories.ts";

function check(label: string, got: unknown, want: unknown) {
  assert.equal(got, want, label);
  console.log(`PASS  ${label}`);
}

check("kiosk -> market kind", getReceiptCategoryKind("kiosk"), "market");
check("kiosk label TR", getCategorySchemaLabel("kiosk", "tr"), "Market");
check("services -> services kind", getReceiptCategoryKind("services"), "services");
check("services label TR", getCategorySchemaLabel("services", "tr"), "Hizmetler");
check("healthcare label TR", getCategorySchemaLabel("healthcare", "tr"), "Sağlık");
check("beauty kind", getReceiptCategoryKind("beauty"), "beauty");
check("personal_care kind", getReceiptCategoryKind("personal_care"), "beauty");
check("sports -> retail", getReceiptCategoryKind("sports"), "retail");
check("specialty_retail -> retail", getReceiptCategoryKind("specialty_retail"), "retail");
check("other -> null kind", getReceiptCategoryKind("other"), null);
check("other -> empty label", getCategorySchemaLabel("other", "en"), "");
check("empty -> empty label", getCategorySchemaLabel(null, "en"), "");

check(
  "services+hastane -> healthcare",
  refineReceiptCategoryFromMerchantEvidence("services", "ANKARA ŞEHİR HASTANESİ"),
  "healthcare"
);
check(
  "services+clinic -> healthcare",
  refineReceiptCategoryFromMerchantEvidence("services", "Bangkok Clinic"),
  "healthcare"
);
check(
  "services without health stays unset refine",
  refineReceiptCategoryFromMerchantEvidence("services", "Acme Consulting Ltd"),
  undefined
);

console.log("\nALL CATEGORY SCHEMA CHECKS PASSED");
