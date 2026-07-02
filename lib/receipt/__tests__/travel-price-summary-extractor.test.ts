/**
 * Tests for TravelPriceSummaryExtractor v2
 */

import { extractTravelPriceSummary, shouldCallTravelExtractor } from "../travel-price-summary-extractor";
import { OCRLine } from "../types";

describe("TravelPriceSummaryExtractor v2", () => {
  describe("shouldCallTravelExtractor", () => {
    it("should detect Trip.com receipt with Price Summary", () => {
      const fullText = "Trip.com Travel Singapore Pte. Ltd.\nPrice Summary";
      expect(shouldCallTravelExtractor(fullText, "Trip.com", "travel")).toBe(true);
    });

    it("should detect Fiyat Özeti header", () => {
      const fullText = "Fiyat Özeti Tutar\nÜcret\nVergiler ve ücretler";
      expect(shouldCallTravelExtractor(fullText)).toBe(true);
    });

    it("should detect label sets: Fare + Taxes & fees + Total", () => {
      const fullText = "Fare\nTaxes & fees\nTotal";
      expect(shouldCallTravelExtractor(fullText)).toBe(true);
    });

    it("should NOT detect non-travel receipt", () => {
      const fullText = "Restaurant Receipt\nTotal: 100 TL";
      expect(shouldCallTravelExtractor(fullText)).toBe(false);
    });
  });

  describe("extractTravelPriceSummary - Trip.com PDF format", () => {
    it("should extract fare, taxesAndFees, seatSelection, total from table format", () => {
      // Trip.com PDF format: labels and amounts on separate lines
      const ocrLines: OCRLine[] = [
        { text: "Fiyat Özeti", lineNo: 1 },
        { text: "Tutar", lineNo: 2 },
        { text: "Ücret", lineNo: 3 },
        { text: "Vergiler ve ücretler", lineNo: 4 },
        { text: "Koltuk Seçimi", lineNo: 5 },
        { text: "1.386,67 TL", lineNo: 6 },
        { text: "2.494,87 TL", lineNo: 7 },
        { text: "245,28 TL", lineNo: 8 },
        { text: "Toplam", lineNo: 9 },
        { text: "4.126,82 TL", lineNo: 10 },
        { text: "GST Kayıt No: 201613701E", lineNo: 11 }, // Should NOT be extracted as amount
        { text: "Passenger & E-ticket No: 310-2159990016", lineNo: 12 }, // Should NOT be extracted
      ];

      const result = extractTravelPriceSummary(ocrLines, "Fiyat Özeti");

      expect(result).not.toBeNull();
      expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
      expect(result?.taxesAndFees?.value).toBeCloseTo(2494.87, 2);
      expect(result?.seatSelection?.value).toBeCloseTo(245.28, 2);
      expect(result?.total.value).toBeCloseTo(4126.82, 2);
      expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
      
      // Reconciliation should pass
      const sum = (result?.fare?.value || 0) + 
                  (result?.taxesAndFees?.value || 0) + 
                  (result?.seatSelection?.value || 0);
      expect(Math.abs(sum - result!.total.value)).toBeLessThanOrEqual(0.5);
    });

    it("should NOT extract numeric IDs as amounts", () => {
      const ocrLines: OCRLine[] = [
        { text: "Fiyat Özeti", lineNo: 1 },
        { text: "Ücret", lineNo: 2 },
        { text: "1.386,67 TL", lineNo: 3 },
        { text: "GST Kayıt No: 201613701E", lineNo: 4 }, // Should NOT extract "201" from this
        { text: "Passenger & E-ticket No: 310-2159990016", lineNo: 5 }, // Should NOT extract
      ];

      const result = extractTravelPriceSummary(ocrLines, "Fiyat Özeti");

      // Should only extract fare, not IDs
      expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
      // Should NOT have extracted 201 or 310 from IDs
      expect(result?.taxesAndFees).toBeUndefined();
    });

    it("should handle English labels", () => {
      const ocrLines: OCRLine[] = [
        { text: "Price Summary", lineNo: 1 },
        { text: "Fare", lineNo: 2 },
        { text: "Taxes & fees", lineNo: 3 },
        { text: "Seat Selection", lineNo: 4 },
        { text: "1,386.67 USD", lineNo: 5 },
        { text: "2,494.87 USD", lineNo: 6 },
        { text: "245.28 USD", lineNo: 7 },
        { text: "Total", lineNo: 8 },
        { text: "4,126.82 USD", lineNo: 9 },
      ];

      const result = extractTravelPriceSummary(ocrLines, "Price Summary");

      expect(result).not.toBeNull();
      expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
      expect(result?.taxesAndFees?.value).toBeCloseTo(2494.87, 2);
      expect(result?.seatSelection?.value).toBeCloseTo(245.28, 2);
      expect(result?.total.value).toBeCloseTo(4126.82, 2);
    });
  });
});
