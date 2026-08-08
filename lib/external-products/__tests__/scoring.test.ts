import { describe, expect, it } from "vitest";
import { scoreExternalCanonicalMatch } from "../scoring";

const config = {
  external_suggest_min: 0.78,
  external_review_min: 0.52,
  external_name_weight: 0.44,
  external_alias_weight: 0.18,
  external_embedding_weight: 0.1,
  external_merchant_weight: 0.08,
  external_brand_weight: 0.08,
  external_product_type_weight: 0.05,
  external_package_weight: 0.05,
  external_price_weight: 0.02,
};

describe("external canonical scoring", () => {
  it("suggests a compatible identity with strong text evidence", () => {
    const result = scoreExternalCanonicalMatch(
      { name: 0.92, alias: 0.96, merchant: 1, brand: 1, productType: 1, package: 1, price: 0.8 },
      config
    );
    expect(result.decision).toBe("suggested");
  });

  it("sends an ambiguous OCR line to review", () => {
    const result = scoreExternalCanonicalMatch(
      { name: 0.55, embedding: 0.72, merchant: 1, productType: 1, price: 0.95 },
      config
    );
    expect(result.decision).toBe("needs_review");
  });

  it("never lets price alone create a suggestion", () => {
    const result = scoreExternalCanonicalMatch(
      { name: 0.05, merchant: 1, price: 1 },
      config
    );
    expect(result.decision).not.toBe("suggested");
    expect(result.evidence.price_is_auxiliary).toBe(true);
  });

  it("blocks suggestions when package identity conflicts", () => {
    const result = scoreExternalCanonicalMatch(
      { name: 0.99, alias: 0.99, merchant: 1, brand: 1, package: 0, packageConflict: true },
      config
    );
    expect(result.decision).not.toBe("suggested");
  });
});

