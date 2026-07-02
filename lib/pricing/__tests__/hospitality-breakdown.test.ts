/**
 * Tests for Hospitality & Lodging breakdown
 */

import { generateHospitalityBreakdown, extractNights, detectChannel, detectLodgingSubtype } from "../hospitalityBreakdown";

describe("Hospitality Breakdown", () => {
  describe("extractNights", () => {
    it("should extract nights from 'Period ... (7 night(s))' pattern", () => {
      const text = "Period: 2025-01-01 to 2025-01-08 (7 night(s))";
      const nights = extractNights(text);
      expect(nights).toBe(7);
    });

    it("should extract nights from 'X nights' pattern", () => {
      const text = "Stay duration: 3 nights";
      const nights = extractNights(text);
      expect(nights).toBe(3);
    });

    it("should extract nights from 'X night(s)' pattern", () => {
      const text = "Total for 1 night(s)";
      const nights = extractNights(text);
      expect(nights).toBe(1);
    });

    it("should return undefined if no nights found", () => {
      const text = "Hotel receipt without night information";
      const nights = extractNights(text);
      expect(nights).toBeUndefined();
    });
  });

  describe("detectChannel", () => {
    it("should detect OTA channel for Agoda", () => {
      const merchant = "Agoda Company Pte. Ltd.";
      const channel = detectChannel(merchant);
      expect(channel).toBe("OTA");
    });

    it("should detect OTA channel for Booking.com", () => {
      const merchant = "Booking.com";
      const channel = detectChannel(merchant);
      expect(channel).toBe("OTA");
    });

    it("should detect direct channel for hotel name", () => {
      const merchant = "Grand Hotel Istanbul";
      const channel = detectChannel(merchant);
      expect(channel).toBe("direct");
    });
  });

  describe("detectLodgingSubtype", () => {
    it("should detect hostel subtype", () => {
      const text = "Hostel booking receipt";
      const merchant = "Backpacker Hostel";
      const subtype = detectLodgingSubtype(text, merchant);
      expect(subtype).toBe("hostel");
    });

    it("should detect resort subtype", () => {
      const text = "Resort accommodation";
      const merchant = "Beach Resort";
      const subtype = detectLodgingSubtype(text, merchant);
      expect(subtype).toBe("resort");
    });

    it("should detect apartment subtype", () => {
      const text = "Apartment rental";
      const merchant = "City Apartment";
      const subtype = detectLodgingSubtype(text, merchant);
      expect(subtype).toBe("apartment");
    });

    it("should default to hotel subtype", () => {
      const text = "Hotel booking";
      const merchant = "Grand Hotel";
      const subtype = detectLodgingSubtype(text, merchant);
      expect(subtype).toBe("hotel");
    });
  });

  describe("generateHospitalityBreakdown", () => {
    it("should generate breakdown for Agoda hostel receipt with 7 nights", () => {
      const inputs = {
        paidTotal: 1000.00,
        taxOnInvoice: 100.00,
        currency: "USD",
        date: "2025-01-08",
        country: "TH" as const,
        merchant: "Agoda",
        receiptId: "test-receipt-001",
        nights: 7,
        roomType: "Standard Room",
        channel: "OTA" as const,
      };

      const result = generateHospitalityBreakdown(inputs);

      // Verify category classification signals
      expect(result.reasons.some(r => r.includes("subtype=hostel"))).toBe(true);
      expect(result.reasons.some(r => r.includes("channel=OTA"))).toBe(true);
      expect(result.reasons.some(r => r.includes("nights=7"))).toBe(true);

      // Verify paidExTax calculation
      expect(result.paidExTax).toBe(900.00); // 1000 - 100

      // Verify hiddenCostCore = paidExTax - baseStayValue
      const expectedHiddenCostCore = result.paidExTax - result.baseStayValue.amount;
      expect(Math.abs(result.hiddenCostCore - expectedHiddenCostCore)).toBeLessThan(0.01);

      // Verify all buckets sum to paidExTax (within rounding tolerance)
      const bucketSum = 
        result.baseStayValue.amount +
        result.propertyAndFacilities.amount +
        result.staffAndService.amount +
        result.utilitiesAndMaintenance.amount +
        result.housekeepingAndLaundry.amount +
        result.amenitiesAndConsumables.amount +
        result.distributionAndOTACommission.amount +
        result.paymentAndFXFees.amount +
        result.brandMarketingLoyalty.amount +
        result.operatorMargin.amount;

      expect(Math.abs(bucketSum - result.paidExTax)).toBeLessThan(0.01);

      // Verify total (buckets + taxes) equals paidTotal
      const totalWithTaxes = bucketSum + result.stateLayerOnInvoice.amount;
      expect(Math.abs(totalWithTaxes - inputs.paidTotal)).toBeLessThan(0.01);

      // Verify OTA commission is explicitly shown for OTA channel
      expect(result.distributionAndOTACommission.label).toBe("Distribution & OTA Commission");
      expect(result.distributionAndOTACommission.amount).toBeGreaterThan(0);
      
      // Verify OTA commission is not estimated (explicit calculation)
      expect(result.distributionAndOTACommission.estimated).toBe(false);
    });

    it("should ensure sums: buckets + taxes == paidTotal (with rounding tolerance)", () => {
      const inputs = {
        paidTotal: 500.00,
        taxOnInvoice: 50.00,
        currency: "TRY",
        date: "2025-01-08",
        country: "TR" as const,
        merchant: "Booking.com",
        receiptId: "test-receipt-002",
        nights: 2,
        channel: "OTA" as const,
      };

      const result = generateHospitalityBreakdown(inputs);

      const bucketSum = 
        result.baseStayValue.amount +
        result.propertyAndFacilities.amount +
        result.staffAndService.amount +
        result.utilitiesAndMaintenance.amount +
        result.housekeepingAndLaundry.amount +
        result.amenitiesAndConsumables.amount +
        result.distributionAndOTACommission.amount +
        result.paymentAndFXFees.amount +
        result.brandMarketingLoyalty.amount +
        result.operatorMargin.amount;

      const totalWithTaxes = bucketSum + result.stateLayerOnInvoice.amount;
      
      // Allow 0.01 rounding tolerance
      expect(Math.abs(totalWithTaxes - inputs.paidTotal)).toBeLessThan(0.01);
    });

    it("should handle FX spread when invoice currency differs from charged currency", () => {
      const inputs = {
        paidTotal: 1000.00,
        taxOnInvoice: 100.00,
        currency: "USD",
        date: "2025-01-08",
        country: "TH" as const,
        merchant: "Agoda",
        receiptId: "test-receipt-003",
        nights: 3,
        channel: "OTA" as const,
        invoiceCurrency: "THB",
        chargedCurrency: "USD",
      };

      const result = generateHospitalityBreakdown(inputs);

      // Verify FX spread is mentioned in reasons
      expect(result.reasons.some(r => r.includes("FX spread"))).toBe(true);
      
      // Payment & FX Fees should include FX spread
      expect(result.paymentAndFXFees.amount).toBeGreaterThan(0);
    });

    it("should never label hospitality receipts as fuel", () => {
      const inputs = {
        paidTotal: 800.00,
        taxOnInvoice: 80.00,
        currency: "USD",
        date: "2025-01-08",
        country: "TH" as const,
        merchant: "Agoda",
        receiptId: "test-receipt-004",
        nights: 5,
        channel: "OTA" as const,
      };

      const result = generateHospitalityBreakdown(inputs);

      // Verify it's hospitality breakdown, not fuel
      expect(result.baseStayValue.label).toBe("Base Stay Value");
      expect(result.distributionAndOTACommission.label).toBe("Distribution & OTA Commission");
      
      // No fuel-related buckets
      const allLabels = [
        result.baseStayValue.label,
        result.propertyAndFacilities.label,
        result.staffAndService.label,
        result.utilitiesAndMaintenance.label,
        result.housekeepingAndLaundry.label,
        result.amenitiesAndConsumables.label,
        result.distributionAndOTACommission.label,
        result.paymentAndFXFees.label,
        result.brandMarketingLoyalty.label,
        result.operatorMargin.label,
      ];
      
      expect(allLabels.some(l => l.toLowerCase().includes("fuel"))).toBe(false);
    });
  });
});

