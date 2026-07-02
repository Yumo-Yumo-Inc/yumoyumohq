/**
 * Tests for VAT extraction negative filters
 * Ensures alphanumeric IDs are NOT extracted as VAT
 * 
 * Critical test: "Sicil No/GST Kayıt No: 201613701E" should NOT extract "201" as VAT
 */

import { extractVAT } from "../ocr-extraction";
import { extractVATRobust } from "../../extractors/robust-extraction";
import { OCRLine } from "../types";

describe("VAT Extraction - Negative Filters", () => {
  it("should NOT extract '201' from 'GST Kayıt No: 201613701E' (Trip.com receipt)", () => {
    const lines: OCRLine[] = [
      { text: "Trip.com Travel Singapore Pte. Ltd.", lineNo: 1 },
      { text: "Sicil No/GST Kayıt No: 201613701E", lineNo: 2 }, // Should NOT extract "201"
      { text: "Fare: 1.386,67 TL", lineNo: 3 },
      { text: "Taxes & fees: 2.494,87 TL", lineNo: 4 },
      { text: "Total: 4.126,82 TL", lineNo: 5 },
    ];

    const result = extractVAT(lines);
    const resultRobust = extractVATRobust(lines, 4126.82);

    // Should NOT extract 201 from "201613701E"
    // Should return no VAT (or undefined/0) since there's no explicit VAT line
    expect(result.value).toBe(0);
    expect(result.confidence).toBeLessThan(0.5);
    
    // Robust extractor should also NOT extract 201
    expect(resultRobust.value).toBe(0);
    expect(resultRobust.confidence).toBeLessThan(0.5);
    
    // Verify 201 was NOT extracted
    expect(result.value).not.toBe(201);
    expect(resultRobust.value).not.toBe(201);
  });

  it("should NOT extract from E-ticket numbers", () => {
    const lines: OCRLine[] = [
      { text: "Passenger & E-ticket No: 310-2159990016", lineNo: 1 },
      { text: "Total: 4.126,82 TL", lineNo: 2 },
    ];

    const result = extractVAT(lines);

    // Should NOT extract 310 or 2159990016 as VAT
    expect(result.value).toBe(0);
  });

  it("should extract valid VAT when present", () => {
    const lines: OCRLine[] = [
      { text: "KDV: 237,69 TL", lineNo: 1 },
      { text: "Total: 2.607,98 TL", lineNo: 2 },
    ];

    const result = extractVAT(lines);

    expect(result.value).toBeCloseTo(237.69, 2);
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});

