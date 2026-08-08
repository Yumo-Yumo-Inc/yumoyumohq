import { describe, expect, it } from "vitest";
import { comparePackages, parsePackage } from "../market-fiyati-parser";

/**
 * The catalog stores a parsed package ("1x180ml") while canonical_products stores a written
 * size ("180 ml", "1 L", "150g"). Comparing those as strings marked every candidate as a
 * package conflict, which blocked suggestions outright — these cases pin the comparison to
 * quantities instead.
 */
describe("package comparison against a canonical typical size", () => {
  it.each([
    ["1x180ml", "180 ml"],
    ["1x1lt", "1 L"],
    ["1x150g", "150g"],
    ["1x1kg", "1000 g"],
    ["1x1lt", "1000 ml"],
    ["6x180ml", "6x180 ml"],
  ])("matches %s with %s", (signature, typicalUnitSize) => {
    expect(comparePackages(parsePackage(signature), parsePackage(typicalUnitSize))).toBe(1);
  });

  it.each([
    ["1x180ml", "1 L"],
    ["6x180ml", "180 ml"],
    ["1x150g", "150 ml"],
    ["1x500g", "1 kg"],
  ])("separates %s from %s", (signature, typicalUnitSize) => {
    expect(comparePackages(parsePackage(signature), parsePackage(typicalUnitSize))).toBe(0);
  });

  it("treats a missing size as unknown rather than as a mismatch", () => {
    expect(comparePackages(parsePackage("unknown"), parsePackage("180 ml"))).toBeNull();
    expect(comparePackages(parsePackage("1x180ml"), parsePackage(""))).toBeNull();
  });

  it("keeps the three ayran packages in separate price groups", () => {
    const single = parsePackage("Ayran 180 ml");
    const litre = parsePackage("Ayran 1 Lt");
    const multipack = parsePackage("Ayran 6x180 ml");
    expect(comparePackages(single, litre)).toBe(0);
    expect(comparePackages(single, multipack)).toBe(0);
    expect(comparePackages(litre, multipack)).toBe(0);
    expect(new Set([single.signature, litre.signature, multipack.signature]).size).toBe(3);
  });
});
