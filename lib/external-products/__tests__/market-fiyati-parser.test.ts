import { describe, expect, it } from "vitest";
import {
  parseMarketFiyatiHtml,
  parsePackage,
  parseTurkishPrice,
} from "../market-fiyati-parser";
import { marketFiyatiPageFixture } from "./market-fiyati-fixture";

describe("Market Fiyati rendered HTML parser", () => {
  it("parses 25 products from one rendered page", () => {
    const result = parseMarketFiyatiHtml(marketFiyatiPageFixture({ page: 1 }));
    expect(result.pageNumber).toBe(1);
    expect(result.products).toHaveLength(25);
    expect(result.errors).toHaveLength(0);
  });

  it("combines four pages into 100 unique products", () => {
    const products = [1, 2, 3, 4].flatMap((page) =>
      parseMarketFiyatiHtml(marketFiyatiPageFixture({ page })).products
    );
    expect(products).toHaveLength(100);
    expect(new Set(products.map((product) => product.sourceProductId)).size).toBe(100);
  });

  it.each([
    ["9,75₺", 9.75],
    ["12,50₺", 12.5],
    ["54,17 ₺/Lt", 54.17],
    ["660,71 ₺/Kg", 660.71],
  ])("parses Turkish price %s", (raw, expected) => {
    expect(parseTurkishPrice(raw)).toBe(expected);
  });

  it("keeps current, old and unit prices separate", () => {
    const result = parseMarketFiyatiHtml(marketFiyatiPageFixture({ page: 1, count: 1, start: 9 }));
    expect(result.products[0]).toMatchObject({
      priceTl: 9.75,
      oldPriceTl: 12.5,
      unitPriceTl: 54.17,
      unitType: "lt",
    });
  });

  it("returns a validation error instead of a product when price is missing", () => {
    const result = parseMarketFiyatiHtml(
      marketFiyatiPageFixture({ page: 1, count: 1, missingPriceAt: 0 })
    );
    expect(result.products).toHaveLength(0);
    expect(result.errors[0]?.code).toBe("missing_price");
  });

  it("keeps package groups distinct", () => {
    expect(parsePackage("Ayran 180 ml").signature).toBe("1x180ml");
    expect(parsePackage("Süt 1 Lt").signature).toBe("1x1lt");
    expect(parsePackage("Ayran 6x180 ml").signature).toBe("6x180ml");
  });

  it("extracts the source id without returning product or image URLs", () => {
    const product = parseMarketFiyatiHtml(
      marketFiyatiPageFixture({ page: 1, count: 1 })
    ).products[0];
    expect(product.sourceProductId).toBe("P0001");
    expect(Object.keys(product)).not.toContain("url");
    expect(Object.keys(product)).not.toContain("imageUrl");
  });
});
