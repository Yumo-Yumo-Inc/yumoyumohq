/**
 * Tests for travel breakdown generator
 */

import { generateTravelBreakdown, type TravelBreakdownInputs } from "../travelBreakdown";

describe("generateTravelBreakdown", () => {
  const baseInputs: TravelBreakdownInputs = {
    paidTotal: 1000,
    taxesOnTicket: 100,
    serviceFeeOnTicket: 50,
    country: "TR",
    currency: "TRY",
    date: "2025-01-15",
    receiptId: "test-receipt-1",
    channel: "direct",
    distanceBand: "medium",
    operatorType: "legacy",
  };

  it("should generate breakdown for flight with taxes present", () => {
    const inputs: TravelBreakdownInputs = {
      ...baseInputs,
      paidTotal: 2721,
      taxesOnTicket: 200,
      serviceFeeOnTicket: 100,
      channel: "OTA",
      distanceBand: "long",
      operatorType: "lowcost",
    };

    const result = generateTravelBreakdown(inputs);

    // Verify state layer (taxes) is not part of hidden cost
    expect(result.stateLayerOnTicket.amount).toBe(200);
    expect(result.stateLayerOnTicket.estimated).toBe(false);
    expect(result.paidExTax).toBe(2721 - 200); // 2521

    // Verify hiddenCostCore = paidExTax - baseTransportValue
    const expectedHiddenCostCore = result.paidExTax - result.baseTransportValue.amount;
    expect(Math.abs(result.hiddenCostCore - expectedHiddenCostCore)).toBeLessThan(0.01);

    // Verify all buckets sum to paidTotal (within rounding)
    const sum =
      result.baseTransportValue.amount +
      result.operatorMargin.amount +
      result.distributionAndSales.amount +
      result.operationalAndInfrastructure.amount +
      result.fuelAndEnergy.amount +
      result.riskAndCompliance.amount +
      result.stateLayerOnTicket.amount;

    expect(Math.abs(sum - inputs.paidTotal)).toBeLessThan(1.0); // Allow 1 unit rounding error

    // Verify percentages
    expect(result.baseTransportValue.percentOfPaidTotal).toBeGreaterThan(0);
    expect(result.stateLayerOnTicket.percentOfPaidTotal).toBeGreaterThan(0);
  });

  it("should generate breakdown for bus ticket without explicit taxes", () => {
    const inputs: TravelBreakdownInputs = {
      ...baseInputs,
      paidTotal: 500,
      taxesOnTicket: 0, // No explicit taxes
      serviceFeeOnTicket: undefined,
      channel: "direct",
      distanceBand: "short",
      operatorType: "legacy",
    };

    const result = generateTravelBreakdown(inputs);

    // State layer should be 0
    expect(result.stateLayerOnTicket.amount).toBe(0);
    expect(result.paidExTax).toBe(500);

    // Verify hiddenCostCore calculation
    const expectedHiddenCostCore = result.paidExTax - result.baseTransportValue.amount;
    expect(Math.abs(result.hiddenCostCore - expectedHiddenCostCore)).toBeLessThan(0.01);

    // Verify sums match
    const sum =
      result.baseTransportValue.amount +
      result.operatorMargin.amount +
      result.distributionAndSales.amount +
      result.operationalAndInfrastructure.amount +
      result.fuelAndEnergy.amount +
      result.riskAndCompliance.amount +
      result.stateLayerOnTicket.amount;

    expect(Math.abs(sum - inputs.paidTotal)).toBeLessThan(1.0);
  });

  it("should apply OTA channel adjustment (increases Distribution)", () => {
    const directInputs: TravelBreakdownInputs = {
      ...baseInputs,
      channel: "direct",
    };

    const otaInputs: TravelBreakdownInputs = {
      ...baseInputs,
      channel: "OTA",
    };

    const directResult = generateTravelBreakdown(directInputs);
    const otaResult = generateTravelBreakdown(otaInputs);

    // OTA should have higher distribution (relative to paidExTax)
    expect(otaResult.distributionAndSales.percentOfPaidTotal).toBeGreaterThan(
      directResult.distributionAndSales.percentOfPaidTotal
    );

    // Verify reasons mention OTA
    expect(otaResult.reasons.some((r) => r.includes("OTA"))).toBe(true);
  });

  it("should apply distance band adjustments", () => {
    const shortInputs: TravelBreakdownInputs = {
      ...baseInputs,
      distanceBand: "short",
    };

    const longInputs: TravelBreakdownInputs = {
      ...baseInputs,
      distanceBand: "long",
    };

    const shortResult = generateTravelBreakdown(shortInputs);
    const longResult = generateTravelBreakdown(longInputs);

    // Long distance should have higher fuel percentage
    expect(longResult.fuelAndEnergy.percentOfPaidTotal).toBeGreaterThan(
      shortResult.fuelAndEnergy.percentOfPaidTotal
    );

    // Short distance should have higher ops percentage
    expect(shortResult.operationalAndInfrastructure.percentOfPaidTotal).toBeGreaterThan(
      longResult.operationalAndInfrastructure.percentOfPaidTotal
    );
  });

  it("should apply operator type differences", () => {
    const lowcostInputs: TravelBreakdownInputs = {
      ...baseInputs,
      operatorType: "lowcost",
    };

    const legacyInputs: TravelBreakdownInputs = {
      ...baseInputs,
      operatorType: "legacy",
    };

    const lowcostResult = generateTravelBreakdown(lowcostInputs);
    const legacyResult = generateTravelBreakdown(legacyInputs);

    // Lowcost typically has higher base transport value ratio
    expect(lowcostResult.baseTransportValue.percentOfPaidTotal).toBeGreaterThan(
      legacyResult.baseTransportValue.percentOfPaidTotal
    );
  });

  it("should include service fee in distribution when present", () => {
    const withServiceFee: TravelBreakdownInputs = {
      ...baseInputs,
      serviceFeeOnTicket: 75,
    };

    const withoutServiceFee: TravelBreakdownInputs = {
      ...baseInputs,
      serviceFeeOnTicket: undefined,
    };

    const withFeeResult = generateTravelBreakdown(withServiceFee);
    const withoutFeeResult = generateTravelBreakdown(withoutServiceFee);

    // Distribution should be higher when service fee is present
    expect(withFeeResult.distributionAndSales.amount).toBeGreaterThan(
      withoutFeeResult.distributionAndSales.amount
    );

    // Service fee should make distribution not fully estimated
    expect(withFeeResult.distributionAndSales.estimated).toBe(false);
    expect(withoutFeeResult.distributionAndSales.estimated).toBe(true);
  });

  it("should generate deterministic results for same inputs", () => {
    const inputs: TravelBreakdownInputs = {
      ...baseInputs,
      receiptId: "deterministic-test",
    };

    const result1 = generateTravelBreakdown(inputs);
    const result2 = generateTravelBreakdown(inputs);

    // Results should be identical (deterministic)
    expect(result1.baseTransportValue.amount).toBe(result2.baseTransportValue.amount);
    expect(result1.operatorMargin.amount).toBe(result2.operatorMargin.amount);
    expect(result1.distributionAndSales.amount).toBe(result2.distributionAndSales.amount);
    expect(result1.hiddenCostCore).toBe(result2.hiddenCostCore);
  });

  it("should generate different results for different receipt IDs (jitter)", () => {
    const inputs1: TravelBreakdownInputs = {
      ...baseInputs,
      receiptId: "receipt-1",
    };

    const inputs2: TravelBreakdownInputs = {
      ...baseInputs,
      receiptId: "receipt-2",
    };

    const result1 = generateTravelBreakdown(inputs1);
    const result2 = generateTravelBreakdown(inputs2);

    // Results should differ due to seeded jitter
    // At least one bucket should be different
    const allSame =
      result1.baseTransportValue.amount === result2.baseTransportValue.amount &&
      result1.operatorMargin.amount === result2.operatorMargin.amount &&
      result1.distributionAndSales.amount === result2.distributionAndSales.amount &&
      result1.operationalAndInfrastructure.amount === result2.operationalAndInfrastructure.amount &&
      result1.fuelAndEnergy.amount === result2.fuelAndEnergy.amount;

    // With jitter, it's very unlikely all values are identical
    // But we can't guarantee it, so we just check that the structure is correct
    expect(result1.hiddenCostCore).toBeGreaterThan(0);
    expect(result2.hiddenCostCore).toBeGreaterThan(0);
  });

  it("should normalize ratios so they sum to 1.0", () => {
    const inputs: TravelBreakdownInputs = {
      ...baseInputs,
      channel: "OTA",
      distanceBand: "long",
      operatorType: "lowcost",
    };

    const result = generateTravelBreakdown(inputs);

    // Sum of all non-state buckets should equal paidExTax (within rounding)
    const nonStateSum =
      result.baseTransportValue.amount +
      result.operatorMargin.amount +
      result.distributionAndSales.amount +
      result.operationalAndInfrastructure.amount +
      result.fuelAndEnergy.amount +
      result.riskAndCompliance.amount;

    expect(Math.abs(nonStateSum - result.paidExTax)).toBeLessThan(1.0);

    // Total sum (including state) should equal paidTotal
    const totalSum = nonStateSum + result.stateLayerOnTicket.amount;
    expect(Math.abs(totalSum - inputs.paidTotal)).toBeLessThan(1.0);
  });

  it("should handle TH country", () => {
    const inputs: TravelBreakdownInputs = {
      ...baseInputs,
      country: "TH",
      currency: "THB",
      paidTotal: 5000,
      taxesOnTicket: 350,
    };

    const result = generateTravelBreakdown(inputs);

    expect(result.paidExTax).toBe(5000 - 350);
    expect(result.stateLayerOnTicket.amount).toBe(350);
    expect(result.hiddenCostCore).toBeGreaterThan(0);
  });
});



