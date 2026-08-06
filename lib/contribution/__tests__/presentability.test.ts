import { describe, expect, it } from "vitest";
import {
  candidateLabel,
  candidateSignature,
  namesReadableBrand,
  presentabilityScore,
} from "@/lib/contribution/build-tasks";
import type { ProductCandidate } from "@/lib/canonical/retrieve-product-candidates";

/**
 * The options must read like real branded products so the user can pick their product's
 * brand + full name. Trigram ranking prefers short fragments, so presentabilityScore
 * re-ranks toward well-formed branded names. All labels below are real PROD catalog rows.
 */

function cand(display: string, brand: string | null): ProductCandidate {
  return {
    id: "x",
    canonical_name: display,
    display_name_tr: display,
    brand_slug: brand,
    category_path: null,
    attributes: {},
    unit_type: null,
    typical_unit_size: null,
    score: 0.5,
    source: "trgm",
    price_median: null,
    price_ratio: null,
  };
}

const BAR = 4;

describe("candidateLabel — brand prefix when the name lacks it", () => {
  it("prefixes the brand for a bare name", () => {
    expect(candidateLabel(cand("Gofret 81g", "eti_bidolu"))).toBe("Eti Gofret 81g");
  });
  it("does not double the brand when already present", () => {
    expect(candidateLabel(cand("Eti Karam Gofret 50g", "eti"))).toBe("Eti Karam Gofret 50g");
    expect(candidateLabel(cand("Dost Krema 200ml", "dost"))).toBe("Dost Krema 200ml");
  });
  it("leaves an unbranded name untouched", () => {
    expect(candidateLabel(cand("200ml 18 Krem", null))).toBe("200ml 18 Krem");
  });
});

describe("presentabilityScore — real branded products pass, fragments fail", () => {
  const shown = [
    cand("Eti Karam Gofret 50g", "eti"),
    cand("Nabati Richeese Gofret 37g", "nabati"),
    cand("Harras Kakaolu Gofret 142g", "harras"),
    cand("Hoşbeş Fındıklı Gofret 142g", "hosbes"),
    cand("Dost Krema 200ml", "dost"),
  ];
  for (const c of shown) {
    it(`shows ${JSON.stringify(candidateLabel(c))}`, () => {
      expect(presentabilityScore(c)).toBeGreaterThanOrEqual(BAR);
    });
  }

  const hidden = [
    cand("Gofret So", "gofrik"), // "So" fragment
    cand("18krem 200ml", null), // no brand, malformed
    cand("200ml 18 Krem", null), // size-led fragment
  ];
  for (const c of hidden) {
    it(`hides ${JSON.stringify(c.display_name_tr)}`, () => {
      expect(presentabilityScore(c)).toBeLessThan(BAR);
    });
  }

  it("ranks a well-formed branded product above a fragment", () => {
    expect(presentabilityScore(cand("Eti Karam Gofret 50g", "eti"))).toBeGreaterThan(
      presentabilityScore(cand("Gofret So", "gofrik")),
    );
  });
});

describe("candidateSignature — collapse spelling duplicates, keep real variants", () => {
  it("collapses the same product spelled three ways", () => {
    const a = candidateSignature("Winston Slender Blue");
    expect(candidateSignature("Winston Slen. Blue")).toBe(a);
    expect(candidateSignature("Winston Slen Blue")).toBe(a);
  });
  it("keeps different sizes distinct", () => {
    expect(candidateSignature("Eti Gofret 50g")).not.toBe(candidateSignature("Eti Gofret 81g"));
  });
  it("keeps different products distinct", () => {
    expect(candidateSignature("Dost Krema 200ml")).not.toBe(
      candidateSignature("Nestlé Fındık Kremalı"),
    );
  });
});

describe("namesReadableBrand — skip strings that already name their brand", () => {
  const brands = new Set(["winston", "kizilay", "parliament", "fuse", "tadelle", "eti"]);

  it("skips a fully readable branded product (answer = question)", () => {
    expect(namesReadableBrand("WINSTON SLENDER BLUE", brands)).toBe(true);
    expect(namesReadableBrand("KIZILAY MADEN SUYU", brands)).toBe(true);
    expect(namesReadableBrand("FUSE TEA SEFTALI 1 L", brands)).toBe(true);
  });

  it("keeps a branded string that still abbreviates the product with a dot", () => {
    // Brand is clear (Tadelle) but "FIND.SUT.CIK" is encoded — worth asking for the name.
    expect(namesReadableBrand("TADELLE FIND.SUT.CIK", brands)).toBe(false);
  });

  it("keeps a cryptic string with no readable brand", () => {
    expect(namesReadableBrand("K.GOFRET", brands)).toBe(false);
    expect(namesReadableBrand("REÇEL ÇİLEK 380 G", brands)).toBe(false);
  });
});
