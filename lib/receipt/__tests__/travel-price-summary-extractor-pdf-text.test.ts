/**
 * Unit tests for TravelPriceSummaryExtractor with PDF text layer input
 */

import { extractTravelPriceSummary } from "../travel-price-summary-extractor";

describe("TravelPriceSummaryExtractor - PDF Text Input", () => {
  it("should extract travel price summary from PDF text layer (TR format)", () => {
    // Sample PDF text layer content (from Trip.com receipt)
    const pdfText = `Trip.com Group
Trip.com Travel Singapore Pte. Ltd.
Sicil No/GST Kayıt No: 201613701E
Rezervasyon No: 1638317632017532
Rezervasyon Tarihi: 30 Kasım 2025 17:27 (GMT+8)

Fiyat Özeti
Ücret
Vergiler ve ücretler
Koltuk Seçimi
1.386,67 TL
2.494,87 TL
245,28 TL
Toplam
4.126,82 TL

Yolcu ve E-bilet No.
310-2159990016`;

    const result = extractTravelPriceSummary(pdfText, pdfText);

    expect(result).not.toBeNull();
    expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
    expect(result?.taxesAndFees?.value).toBeCloseTo(2494.87, 2);
    expect(result?.seatSelection?.value).toBeCloseTo(245.28, 2);
    expect(result?.total.value).toBeCloseTo(4126.82, 2);
    expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
    
    // Verify reconciliation
    const sum = (result?.fare?.value || 0) + 
                (result?.taxesAndFees?.value || 0) + 
                (result?.seatSelection?.value || 0);
    expect(Math.abs(sum - result!.total.value)).toBeLessThanOrEqual(0.5);
  });

  it("should extract travel price summary from PDF text layer (EN format)", () => {
    const pdfText = `Trip.com Travel Singapore Pte. Ltd.
GST Reg No: 201613701E
Booking No: 1638317632017532

Price Summary
Fare
Taxes & fees
Seat Selection
TRY 1,386.67
TRY 2,494.87
TRY 245.28
Total
TRY 4,126.82

Passenger & E-ticket No.
310-2159990016`;

    const result = extractTravelPriceSummary(pdfText, pdfText);

    expect(result).not.toBeNull();
    expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
    expect(result?.taxesAndFees?.value).toBeCloseTo(2494.87, 2);
    expect(result?.seatSelection?.value).toBeCloseTo(245.28, 2);
    expect(result?.total.value).toBeCloseTo(4126.82, 2);
    expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("should NOT extract numeric IDs as amounts", () => {
    const pdfText = `Trip.com Travel Singapore Pte. Ltd.
Sicil No/GST Kayıt No: 201613701E
Rezervasyon No: 1638317632017532
Yolcu ve E-bilet No.
310-2159990016

Fiyat Özeti
Ücret
1.386,67 TL
Vergiler ve ücretler
2.494,87 TL
Koltuk Seçimi
245,28 TL
Toplam
4.126,82 TL`;

    const result = extractTravelPriceSummary(pdfText, pdfText);

    expect(result).not.toBeNull();
    // Should NOT extract 201613701E, 1638317632017532, or 310-2159990016 as amounts
    expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
    expect(result?.taxesAndFees?.value).toBeCloseTo(2494.87, 2);
    expect(result?.seatSelection?.value).toBeCloseTo(245.28, 2);
    expect(result?.total.value).toBeCloseTo(4126.82, 2);
  });

  it("should handle table format with labels and amounts on separate lines", () => {
    const pdfText = `Fiyat Özeti Tutar
Ücret
Vergiler ve ücretler
Koltuk Seçimi
1.386,67 TL
2.494,87 TL
245,28 TL
Toplam ... 4.126,82 TL`;

    const result = extractTravelPriceSummary(pdfText, pdfText);

    expect(result).not.toBeNull();
    expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
    expect(result?.taxesAndFees?.value).toBeCloseTo(2494.87, 2);
    expect(result?.seatSelection?.value).toBeCloseTo(245.28, 2);
    expect(result?.total.value).toBeCloseTo(4126.82, 2);
  });

  it("should return null if extraction fails (missing total)", () => {
    const pdfText = `Fiyat Özeti
Ücret
1.386,67 TL
Vergiler ve ücretler
2.494,87 TL`;

    const result = extractTravelPriceSummary(pdfText, pdfText);

    expect(result).toBeNull();
  });

  it("should handle mixed TR/EN labels", () => {
    const pdfText = `Price Summary
Ücret
Taxes & fees
Seat Selection
1.386,67 TL
2.494,87 TL
245,28 TL
Total
4.126,82 TL`;

    const result = extractTravelPriceSummary(pdfText, pdfText);

    expect(result).not.toBeNull();
    expect(result?.fare?.value).toBeCloseTo(1386.67, 2);
    expect(result?.taxesAndFees?.value).toBeCloseTo(2494.87, 2);
    expect(result?.seatSelection?.value).toBeCloseTo(245.28, 2);
    expect(result?.total.value).toBeCloseTo(4126.82, 2);
  });
});



