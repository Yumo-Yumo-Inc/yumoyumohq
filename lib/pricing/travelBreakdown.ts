/**
 * Travel & Mobility breakdown generator
 * Handles Flight/Train/Bus/Ferry tickets with specialized breakdown
 */

import { SeededRNG } from "./dirichlet";

export type Country = "TR" | "TH";
export type Channel = "OTA" | "direct";
export type DistanceBand = "short" | "medium" | "long";
export type OperatorType = "lowcost" | "legacy";

export interface TravelBreakdownInputs {
  paidTotal: number;
  taxesOnTicket?: number; // Parsed taxes from ticket/invoice (ONLY actual taxes, not service fees)
  serviceFeeOnTicket?: number; // Parsed service fee + seat selection + baggage + other optional services
  country: Country;
  currency: string;
  date: string;
  receiptId: string;
  channel?: Channel;
  distanceBand?: DistanceBand;
  operatorType?: OperatorType;
}

export interface TravelBreakdownBucket {
  label: string;
  amount: number;
  percentOfPaidTotal: number;
  estimated: boolean;
  reasons: string[];
}

export interface TravelBreakdownResult {
  baseTransportValue: TravelBreakdownBucket;
  operatorMargin: TravelBreakdownBucket;
  distributionAndSales: TravelBreakdownBucket;
  operationalAndInfrastructure: TravelBreakdownBucket;
  fuelAndEnergy: TravelBreakdownBucket;
  riskAndCompliance: TravelBreakdownBucket;
  stateLayerOnTicket: TravelBreakdownBucket;
  paidExTax: number;
  hiddenCostCore: number;
  reasons: string[];
}

/**
 * Generate deterministic pseudo-random adjustment based on date and merchant
 * Returns adjustment factor in range [0.92, 1.08] (±8%)
 */
function getTimeFactor(seed: string): number {
  const rng = new SeededRNG(seed);
  // Generate value in [0, 1) then map to [0.92, 1.08]
  return 0.92 + (rng.next() * 0.16);
}

/**
 * Get baseline ratios for travel subtype
 */
function getBaselineRatios(
  distanceBand: DistanceBand,
  operatorType: OperatorType
): Record<string, number> {
  // Baseline ratios (before adjustments)
  const baselines: Record<string, Record<string, Record<string, number>>> = {
    short: {
      lowcost: {
        baseTransportValue: 0.45,
        operatorMargin: 0.12,
        distributionAndSales: 0.15,
        operationalAndInfrastructure: 0.18,
        fuelAndEnergy: 0.08,
        riskAndCompliance: 0.02,
      },
      legacy: {
        baseTransportValue: 0.40,
        operatorMargin: 0.15,
        distributionAndSales: 0.18,
        operationalAndInfrastructure: 0.20,
        fuelAndEnergy: 0.05,
        riskAndCompliance: 0.02,
      },
    },
    medium: {
      lowcost: {
        baseTransportValue: 0.42,
        operatorMargin: 0.13,
        distributionAndSales: 0.14,
        operationalAndInfrastructure: 0.16,
        fuelAndEnergy: 0.13,
        riskAndCompliance: 0.02,
      },
      legacy: {
        baseTransportValue: 0.38,
        operatorMargin: 0.16,
        distributionAndSales: 0.17,
        operationalAndInfrastructure: 0.18,
        fuelAndEnergy: 0.09,
        riskAndCompliance: 0.02,
      },
    },
    long: {
      lowcost: {
        baseTransportValue: 0.40,
        operatorMargin: 0.14,
        distributionAndSales: 0.13,
        operationalAndInfrastructure: 0.14,
        fuelAndEnergy: 0.17,
        riskAndCompliance: 0.02,
      },
      legacy: {
        baseTransportValue: 0.35,
        operatorMargin: 0.17,
        distributionAndSales: 0.16,
        operationalAndInfrastructure: 0.16,
        fuelAndEnergy: 0.14,
        riskAndCompliance: 0.02,
      },
    },
  };

  return baselines[distanceBand][operatorType];
}

/**
 * Apply dynamic adjustments to ratios
 */
function applyAdjustments(
  ratios: Record<string, number>,
  inputs: TravelBreakdownInputs,
  seed: string
): { adjustedRatios: Record<string, number>; reasons: string[] } {
  const reasons: string[] = [];
  const adjusted = { ...ratios };
  const rng = new SeededRNG(seed);

  // Time factor (CPI/FX/fuelIndex delta simulation)
  const timeFactor = getTimeFactor(seed + "-time");
  reasons.push(`timeFactor=${timeFactor.toFixed(3)} (simulated CPI/FX/fuelIndex delta)`);

  // Apply time factor with jitter (±8% per bucket)
  const bucketKeys = Object.keys(adjusted);
  for (const key of bucketKeys) {
    const jitter = 0.92 + (rng.next() * 0.16); // ±8% jitter
    adjusted[key] *= timeFactor * jitter;
    reasons.push(`${key}: jitter=${jitter.toFixed(3)}`);
  }

  // Channel adjustment (OTA increases Distribution)
  if (inputs.channel === "OTA") {
    const otaBoost = 1.15; // 15% increase
    adjusted.distributionAndSales *= otaBoost;
    // Reduce other buckets proportionally
    const reduction = (otaBoost - 1) * adjusted.distributionAndSales / (bucketKeys.length - 1);
    for (const key of bucketKeys) {
      if (key !== "distributionAndSales") {
        adjusted[key] = Math.max(0.01, adjusted[key] - reduction / (bucketKeys.length - 1));
      }
    }
    reasons.push("channel=OTA: +15% Distribution, others reduced proportionally");
  }

  // Distance band adjustment
  if (inputs.distanceBand === "long") {
    adjusted.fuelAndEnergy *= 1.20; // 20% increase for long distance
    const reduction = (1.20 - 1) * adjusted.fuelAndEnergy / (bucketKeys.length - 1);
    for (const key of bucketKeys) {
      if (key !== "fuelAndEnergy") {
        adjusted[key] = Math.max(0.01, adjusted[key] - reduction / (bucketKeys.length - 1));
      }
    }
    reasons.push("distanceBand=long: +20% Fuel, others reduced proportionally");
  } else if (inputs.distanceBand === "short") {
    adjusted.operationalAndInfrastructure *= 1.15; // 15% increase for short distance
    const reduction = (1.15 - 1) * adjusted.operationalAndInfrastructure / (bucketKeys.length - 1);
    for (const key of bucketKeys) {
      if (key !== "operationalAndInfrastructure") {
        adjusted[key] = Math.max(0.01, adjusted[key] - reduction / (bucketKeys.length - 1));
      }
    }
    reasons.push("distanceBand=short: +15% Ops, others reduced proportionally");
  }

  // Normalize ratios so sum = 1.0
  const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (const key of Object.keys(adjusted)) {
      adjusted[key] /= sum;
    }
    reasons.push(`normalized: sum=${sum.toFixed(3)} -> 1.0`);
  }

  return { adjustedRatios: adjusted, reasons };
}

/**
 * Generate travel breakdown
 */
export function generateTravelBreakdown(
  inputs: TravelBreakdownInputs
): TravelBreakdownResult {
  const {
    paidTotal,
    taxesOnTicket = 0,
    serviceFeeOnTicket = 0,
    country,
    currency,
    date,
    receiptId,
    channel = "direct",
    distanceBand = "medium",
    operatorType = "legacy",
  } = inputs;

  const reasons: string[] = [];

  // StateLayer = taxes parsed from ticket (not part of hidden cost)
  const stateLayerAmount = taxesOnTicket;
  const paidExTax = paidTotal - stateLayerAmount;

  reasons.push(`paidTotal=${paidTotal.toFixed(2)} ${currency}`);
  reasons.push(`taxesOnTicket=${stateLayerAmount.toFixed(2)} (StateLayer, not in hidden cost)`);
  reasons.push(`paidExTax=${paidExTax.toFixed(2)}`);

  // Get baseline ratios
  const baselineRatios = getBaselineRatios(distanceBand, operatorType);
  reasons.push(`baseline: distanceBand=${distanceBand}, operatorType=${operatorType}`);

  // Apply dynamic adjustments
  const seed = `${receiptId}-${date}-${channel}-${distanceBand}-${operatorType}`;
  const { adjustedRatios, reasons: adjustmentReasons } = applyAdjustments(
    baselineRatios,
    inputs,
    seed
  );
  reasons.push(...adjustmentReasons);

  // Compute amounts from ratios (on paidExTax)
  const baseTransportValue = paidExTax * adjustedRatios.baseTransportValue;
  const operatorMargin = paidExTax * adjustedRatios.operatorMargin;
  const distributionAndSales = paidExTax * adjustedRatios.distributionAndSales;
  const operationalAndInfrastructure = paidExTax * adjustedRatios.operationalAndInfrastructure;
  const fuelAndEnergy = paidExTax * adjustedRatios.fuelAndEnergy;
  const riskAndCompliance = paidExTax * adjustedRatios.riskAndCompliance;

  // Add service fee to distribution if present
  // Service fee includes: booking fee, seat selection, baggage, and other optional services
  let finalDistribution = distributionAndSales;
  if (serviceFeeOnTicket > 0) {
    finalDistribution += serviceFeeOnTicket;
    reasons.push(`serviceFeeOnTicket=${serviceFeeOnTicket.toFixed(2)} (includes booking/seat selection/baggage fees) added to Distribution`);
  }

  // Calculate hiddenCostCore = PaidExTax - BaseTransportValue
  const hiddenCostCore = paidExTax - baseTransportValue;

  // Create breakdown buckets
  const createBucket = (
    label: string,
    amount: number,
    estimated: boolean,
    bucketReasons: string[] = []
  ): TravelBreakdownBucket => ({
    label,
    amount: Math.round(amount * 100) / 100,
    percentOfPaidTotal: paidTotal > 0 ? Math.round((amount / paidTotal) * 100 * 10) / 10 : 0,
    estimated,
    reasons: bucketReasons,
  });

  return {
    baseTransportValue: createBucket(
      "Base Transport Value",
      baseTransportValue,
      true,
      [`ratio=${adjustedRatios.baseTransportValue.toFixed(3)}`]
    ),
    operatorMargin: createBucket(
      "Operator Margin",
      operatorMargin,
      true,
      [`ratio=${adjustedRatios.operatorMargin.toFixed(3)}`]
    ),
    distributionAndSales: createBucket(
      "Distribution & Sales",
      finalDistribution,
      serviceFeeOnTicket > 0 ? false : true, // Service fee is explicit, rest is estimated
      serviceFeeOnTicket > 0
        ? [`ratio=${adjustedRatios.distributionAndSales.toFixed(3)}`, `+serviceFee=${serviceFeeOnTicket.toFixed(2)}`]
        : [`ratio=${adjustedRatios.distributionAndSales.toFixed(3)}`]
    ),
    operationalAndInfrastructure: createBucket(
      "Operational & Infrastructure",
      operationalAndInfrastructure,
      true,
      [`ratio=${adjustedRatios.operationalAndInfrastructure.toFixed(3)}`]
    ),
    fuelAndEnergy: createBucket(
      "Fuel & Energy",
      fuelAndEnergy,
      true,
      [`ratio=${adjustedRatios.fuelAndEnergy.toFixed(3)}`]
    ),
    riskAndCompliance: createBucket(
      "Risk & Compliance",
      riskAndCompliance,
      true,
      [`ratio=${adjustedRatios.riskAndCompliance.toFixed(3)}`]
    ),
    stateLayerOnTicket: createBucket(
      "State Layer (Taxes)",
      stateLayerAmount,
      false, // Taxes are explicit on ticket
      ["from.ticket"]
    ),
    paidExTax,
    hiddenCostCore: Math.round(hiddenCostCore * 100) / 100,
    reasons,
  };
}

