import { describe, expect, it } from "vitest";
import { isAbbreviationLike } from "@/lib/receipt/canonical/resolve-canonical-product-v3";

/**
 * isAbbreviationLike decides whether an alias learned at ANOTHER merchant may be
 * reused for this string. Getting it wrong is asymmetric:
 *
 *   false positive  → one extra LLM call (cheap, self-correcting)
 *   false negative  → a cross-merchant alias links two different products under one
 *                     canonical, pollutes the price median, and reaches the chain
 *                     through price_epochs (not reversible)
 *
 * So these cases are the guard rail. All strings below are real, taken from the
 * 2026-07-17 PROD/DEV measurement.
 */

describe("isAbbreviationLike — merchant shorthand (must NOT cross merchants)", () => {
  const shorthand = [
    "K.GOFRET", // the canonical example: "K." could be Kremalı / Kakaolu / Karışık
    "KRM.SNT.150GDORBI",
    "TADELLE FND.SUT.CIK.",
    "MAK YAJ SUNG. LIONE",
    "GOFRET KAK. KREM142G", // trailing dot = truncated word
    "K.BENZIN95 SVP",
    "UNLU MAM.",
  ];

  for (const s of shorthand) {
    it(`treats ${JSON.stringify(s)} as shorthand`, () => {
      expect(isAbbreviationLike(s)).toBe(true);
    });
  }
});

describe("isAbbreviationLike — generic words (too thin to identify a product)", () => {
  for (const s of ["EKMEK", "DOMATES", "SU"]) {
    it(`treats ${JSON.stringify(s)} as too short`, () => {
      expect(isAbbreviationLike(s)).toBe(true);
    });
  }
});

describe("isAbbreviationLike — real names (SHOULD generalise across merchants)", () => {
  const realNames = [
    "PINAR SÜT TAM YAĞLI 1L",
    "UNO TAM BUĞDAY EKMEK 350G",
    "SÜTAŞ SÜZME YOĞURT 900G",
    "ERİKLİ DOĞAL KAYNAK SUYU 5L",
    "ERİKLİ SU 0.5L", // the dot here is a size (0.5), not a truncation
    "CP YUMURTA 15Lİ", // "15Lİ" is a size token and must not count as a stub word
    "HALK EKMEK",
    "SALATALIK KG",
    "KREMA 18 YAĞLI 200ML",
  ];

  for (const s of realNames) {
    it(`lets ${JSON.stringify(s)} generalise`, () => {
      expect(isAbbreviationLike(s)).toBe(false);
    });
  }
});
