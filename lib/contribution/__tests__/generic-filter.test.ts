import { describe, expect, it } from "vitest";
import { isGenericString } from "@/lib/contribution/build-tasks";

/**
 * The generator must not hand the crowd questions that identify nothing. All strings
 * below are real, from the first cron run against PROD (2026-07-17), where the top
 * pattern of junk was generic labels and fee lines.
 */

describe("isGenericString — generic labels never become tasks", () => {
  for (const s of [
    "EKMEK",
    "DOMATES",
    "TEMEL GIDA",
    "UNLU MAMÜLER", // single-L / Ü spelling variant that slipped through the first run
    "UNLU MAMULLERI",
    "MANAV",
    "YEDEK PARÇA",
  ]) {
    it(`treats ${JSON.stringify(s)} as generic`, () => {
      expect(isGenericString(s)).toBe(true);
    });
  }

  it("treats a generic head with only a unit as generic", () => {
    expect(isGenericString("DOMATES KG")).toBe(true);
    expect(isGenericString("EKMEK ADET")).toBe(true);
  });
});

describe("isGenericString — fee/charge lines are non-products", () => {
  for (const s of [
    "Servis Ücreti",
    "Telsiz Kullanım Ücreti",
    "Kargo Bedeli",
    "Hizmet Ücret",
  ]) {
    it(`treats ${JSON.stringify(s)} as generic`, () => {
      expect(isGenericString(s)).toBe(true);
    });
  }

  it("does not over-match a long descriptive name ending in ücreti", () => {
    // 4+ words: unusual for a fee line, likely a real product/service name — leave it
    // for the candidate/straggler filters rather than blanket-skipping here.
    expect(isGenericString("Aylık Sınırsız İnternet Paketi Ücreti")).toBe(false);
  });
});

describe("isGenericString — real products still generate tasks", () => {
  for (const s of [
    "K.GOFRET",
    "TADIM FISTIK 150G",
    "PINAR SÜT TAM YAĞLI 1L",
    "KRM.SNT.150GDORBI",
  ]) {
    it(`lets ${JSON.stringify(s)} through`, () => {
      expect(isGenericString(s)).toBe(false);
    });
  }
});
