/**
 * Hospitality & Lodging breakdown generator
 * Handles Hotel/Hostel/Resort/Apartment receipts with specialized breakdown
 */

import { SeededRNG } from "./dirichlet";

export type Country = "TR" | "TH";
export type Channel = "OTA" | "direct";
export type LodgingSubtype = "hotel" | "hostel" | "resort" | "apartment";

export interface HospitalityBreakdownInputs {
  paidTotal: number;
  taxOnInvoice?: number; // Parsed taxes from invoice
  currency: string;
  date: string;
  country: Country;
  merchant: string;
  receiptId: string;
  nights?: number; // Extracted from "Period ... (X night(s))"
  roomType?: string; // Extracted room type
  channel?: Channel; // OTA or direct booking
  invoiceCurrency?: string; // Currency on invoice
  chargedCurrency?: string; // Currency actually charged
}

export interface HospitalityBreakdownBucket {
  label: string;
  amount: number;
  percentOfPaidTotal: number;
  estimated: boolean;
  reasons: string[];
}

export interface HospitalityBreakdownResult {
  baseStayValue: HospitalityBreakdownBucket;
  propertyAndFacilities: HospitalityBreakdownBucket;
  staffAndService: HospitalityBreakdownBucket;
  utilitiesAndMaintenance: HospitalityBreakdownBucket;
  housekeepingAndLaundry: HospitalityBreakdownBucket;
  amenitiesAndConsumables: HospitalityBreakdownBucket;
  distributionAndOTACommission: HospitalityBreakdownBucket;
  paymentAndFXFees: HospitalityBreakdownBucket;
  brandMarketingLoyalty: HospitalityBreakdownBucket;
  operatorMargin: HospitalityBreakdownBucket;
  stateLayerOnInvoice: HospitalityBreakdownBucket;
  paidExTax: number;
  hiddenCostCore: number;
  reasons: string[];
}

/**
 * Extract nights from text (e.g., "Period ... (7 night(s))")
 */
export function extractNights(text: string): number | undefined {
  const lowerText = text.toLowerCase();
  
  // Pattern: "X night(s)" or "X nights" or "Period ... (X night(s))"
  const patterns = [
    /\((\d+)\s*night\(s\)\)/i,
    /(\d+)\s*night\(s\)/i,
    /(\d+)\s*nights/i,
    /period.*?\((\d+)\s*night/i,
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      const nights = parseInt(match[1], 10);
      if (nights > 0 && nights <= 365) {
        return nights;
      }
    }
  }
  
  return undefined;
}

/**
 * Detect lodging subtype from text
 */
export function detectLodgingSubtype(text: string, merchant: string): LodgingSubtype {
  const lowerText = text.toLowerCase();
  const lowerMerchant = merchant.toLowerCase();
  
  if (lowerText.includes('hostel') || lowerMerchant.includes('hostel')) {
    return 'hostel';
  }
  if (lowerText.includes('resort') || lowerMerchant.includes('resort')) {
    return 'resort';
  }
  if (lowerText.includes('apartment') || lowerText.includes('apt') || lowerMerchant.includes('apartment')) {
    return 'apartment';
  }
  
  // Default to hotel
  return 'hotel';
}

/**
 * Detect channel (OTA vs direct)
 */
export function detectChannel(merchant: string): Channel {
  const lowerMerchant = merchant.toLowerCase();
  const otaMerchants = ['agoda', 'booking.com', 'booking', 'expedia', 'airbnb', 'trip.com', 'hotels.com', 'priceline'];
  
  if (otaMerchants.some(ota => lowerMerchant.includes(ota))) {
    return 'OTA';
  }
  
  return 'direct';
}

/**
 * Get baseline ratios for lodging subtype
 */
function getBaselineRatios(
  subtype: LodgingSubtype,
  channel: Channel
): Record<string, number> {
  // Baseline ratios (before adjustments)
  const baselines: Record<string, Record<string, Record<string, number>>> = {
    hotel: {
      OTA: {
        baseStayValue: 0.35,
        propertyAndFacilities: 0.15,
        staffAndService: 0.12,
        utilitiesAndMaintenance: 0.08,
        housekeepingAndLaundry: 0.05,
        amenitiesAndConsumables: 0.04,
        distributionAndOTACommission: 0.15,
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.03,
        operatorMargin: 0.01,
      },
      direct: {
        baseStayValue: 0.40,
        propertyAndFacilities: 0.18,
        staffAndService: 0.14,
        utilitiesAndMaintenance: 0.10,
        housekeepingAndLaundry: 0.06,
        amenitiesAndConsumables: 0.05,
        distributionAndOTACommission: 0.00, // No OTA commission for direct
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.04,
        operatorMargin: 0.01,
      },
    },
    hostel: {
      OTA: {
        baseStayValue: 0.40,
        propertyAndFacilities: 0.12,
        staffAndService: 0.10,
        utilitiesAndMaintenance: 0.08,
        housekeepingAndLaundry: 0.06,
        amenitiesAndConsumables: 0.03,
        distributionAndOTACommission: 0.15,
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.02,
        operatorMargin: 0.02,
      },
      direct: {
        baseStayValue: 0.45,
        propertyAndFacilities: 0.15,
        staffAndService: 0.12,
        utilitiesAndMaintenance: 0.10,
        housekeepingAndLaundry: 0.08,
        amenitiesAndConsumables: 0.04,
        distributionAndOTACommission: 0.00,
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.03,
        operatorMargin: 0.01,
      },
    },
    resort: {
      OTA: {
        baseStayValue: 0.30,
        propertyAndFacilities: 0.20,
        staffAndService: 0.15,
        utilitiesAndMaintenance: 0.10,
        housekeepingAndLaundry: 0.06,
        amenitiesAndConsumables: 0.08,
        distributionAndOTACommission: 0.12,
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.05,
        operatorMargin: 0.02,
      },
      direct: {
        baseStayValue: 0.35,
        propertyAndFacilities: 0.22,
        staffAndService: 0.16,
        utilitiesAndMaintenance: 0.12,
        housekeepingAndLaundry: 0.07,
        amenitiesAndConsumables: 0.09,
        distributionAndOTACommission: 0.00,
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.06,
        operatorMargin: 0.01,
      },
    },
    apartment: {
      OTA: {
        baseStayValue: 0.45,
        propertyAndFacilities: 0.15,
        staffAndService: 0.05,
        utilitiesAndMaintenance: 0.08,
        housekeepingAndLaundry: 0.04,
        amenitiesAndConsumables: 0.03,
        distributionAndOTACommission: 0.15,
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.02,
        operatorMargin: 0.01,
      },
      direct: {
        baseStayValue: 0.50,
        propertyAndFacilities: 0.18,
        staffAndService: 0.06,
        utilitiesAndMaintenance: 0.10,
        housekeepingAndLaundry: 0.05,
        amenitiesAndConsumables: 0.04,
        distributionAndOTACommission: 0.00,
        paymentAndFXFees: 0.02,
        brandMarketingLoyalty: 0.04,
        operatorMargin: 0.01,
      },
    },
  };

  return baselines[subtype][channel];
}

/**
 * Calculate OTA commission rate with adjustments
 */
function calculateOTARate(
  channel: Channel,
  nights: number | undefined,
  date: string,
  receiptId: string
): number {
  if (channel === 'direct') {
    return 0;
  }

  // Base OTA rate: 12-20% with deterministic jitter
  const seed = `${receiptId}-${date}-ota-rate`;
  const rng = new SeededRNG(seed);
  const baseRate = 0.12 + (rng.next() * 0.08); // 12-20%

  // Adjustments based on stay length
  let adjustedRate = baseRate;
  if (nights) {
    if (nights >= 7) {
      adjustedRate *= 0.95; // Slight discount for longer stays
    } else if (nights <= 1) {
      adjustedRate *= 1.05; // Slight premium for single night
    }
  }

  // Season adjustment (simplified: month-based)
  const month = new Date(date).getMonth() + 1; // 1-12
  const isPeakSeason = month >= 6 && month <= 8; // Summer months
  if (isPeakSeason) {
    adjustedRate *= 1.03; // Slight premium during peak season
  }

  // Clamp to valid range
  return Math.max(0.12, Math.min(0.20, adjustedRate));
}

/**
 * Apply dynamic adjustments to ratios
 */
function applyAdjustments(
  ratios: Record<string, number>,
  inputs: HospitalityBreakdownInputs,
  seed: string
): { adjustedRatios: Record<string, number>; reasons: string[] } {
  const reasons: string[] = [];
  const adjusted = { ...ratios };
  const rng = new SeededRNG(seed);

  // Apply small seeded jitter per bucket (±2-4%)
  const bucketKeys = Object.keys(adjusted);
  for (const key of bucketKeys) {
    const jitter = 0.96 + (rng.next() * 0.08); // ±4% jitter
    adjusted[key] *= jitter;
  }
  reasons.push(`Applied ±4% jitter per bucket (seed=${seed})`);

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
 * Calculate FX spread if currencies differ
 */
function calculateFXSpread(
  invoiceCurrency: string | undefined,
  chargedCurrency: string | undefined,
  receiptId: string,
  date: string
): number {
  if (!invoiceCurrency || !chargedCurrency || invoiceCurrency === chargedCurrency) {
    return 0;
  }

  // FX spread estimate: 0-2% with seeded jitter
  const seed = `${receiptId}-${date}-fx-spread`;
  const rng = new SeededRNG(seed);
  const spread = rng.next() * 0.02; // 0-2%

  return spread;
}

/**
 * Generate hospitality breakdown
 */
export function generateHospitalityBreakdown(
  inputs: HospitalityBreakdownInputs
): HospitalityBreakdownResult {
  const {
    paidTotal,
    taxOnInvoice = 0,
    currency,
    date,
    country,
    merchant,
    receiptId,
    nights,
    roomType,
    channel,
    invoiceCurrency,
    chargedCurrency,
  } = inputs;

  const reasons: string[] = [];

  // StateLayer = taxes on invoice (not part of hidden cost)
  const stateLayerAmount = taxOnInvoice;
  const paidExTax = paidTotal - stateLayerAmount;

  reasons.push(`paidTotal=${paidTotal.toFixed(2)} ${currency}`);
  reasons.push(`taxOnInvoice=${stateLayerAmount.toFixed(2)} (StateLayer, not in hidden cost)`);
  reasons.push(`paidExTax=${paidExTax.toFixed(2)}`);

  // Detect subtype and channel if not provided
  const detectedSubtype = detectLodgingSubtype(merchant, merchant);
  const detectedChannel = channel || detectChannel(merchant);
  const detectedNights = nights;

  reasons.push(`subtype=${detectedSubtype}, channel=${detectedChannel}`);
  if (detectedNights) {
    reasons.push(`nights=${detectedNights}`);
  }
  if (roomType) {
    reasons.push(`roomType=${roomType}`);
  }

  // Get baseline ratios
  const baselineRatios = getBaselineRatios(detectedSubtype, detectedChannel);
  reasons.push(`baseline ratios loaded for ${detectedSubtype}/${detectedChannel}`);

  // Calculate OTA commission rate if OTA channel
  let otaRate = 0;
  if (detectedChannel === 'OTA') {
    otaRate = calculateOTARate(detectedChannel, detectedNights, date, receiptId);
    reasons.push(`OTA rate=${(otaRate * 100).toFixed(1)}% (adjusted for ${detectedNights || 'unknown'} nights)`);
  }

  // Apply dynamic adjustments
  const seed = `${receiptId}-${date}-${detectedSubtype}-${detectedChannel}`;
  const { adjustedRatios, reasons: adjustmentReasons } = applyAdjustments(
    baselineRatios,
    inputs,
    seed
  );
  reasons.push(...adjustmentReasons);

  // Calculate FX spread if currencies differ
  const fxSpread = calculateFXSpread(invoiceCurrency, chargedCurrency, receiptId, date);
  if (fxSpread > 0) {
    reasons.push(`FX spread=${(fxSpread * 100).toFixed(2)}% (${invoiceCurrency} -> ${chargedCurrency})`);
  }

  // Compute amounts from ratios (on paidExTax)
  const baseStayValue = paidExTax * adjustedRatios.baseStayValue;
  const propertyAndFacilities = paidExTax * adjustedRatios.propertyAndFacilities;
  const staffAndService = paidExTax * adjustedRatios.staffAndService;
  const utilitiesAndMaintenance = paidExTax * adjustedRatios.utilitiesAndMaintenance;
  const housekeepingAndLaundry = paidExTax * adjustedRatios.housekeepingAndLaundry;
  const amenitiesAndConsumables = paidExTax * adjustedRatios.amenitiesAndConsumables;
  
  // Distribution & OTA Commission
  let distributionAndOTACommission = paidExTax * adjustedRatios.distributionAndOTACommission;
  if (detectedChannel === 'OTA' && otaRate > 0) {
    // Override with calculated OTA commission
    distributionAndOTACommission = paidExTax * otaRate;
    reasons.push(`OTA commission calculated: ${distributionAndOTACommission.toFixed(2)} (${(otaRate * 100).toFixed(1)}% of paidExTax)`);
  }

  // Payment & FX Fees
  let paymentAndFXFees = paidExTax * adjustedRatios.paymentAndFXFees;
  if (fxSpread > 0) {
    paymentAndFXFees += paidExTax * fxSpread;
    reasons.push(`FX spread added to payment fees: ${(paidExTax * fxSpread).toFixed(2)}`);
  }

  const brandMarketingLoyalty = paidExTax * adjustedRatios.brandMarketingLoyalty;
  const operatorMargin = paidExTax * adjustedRatios.operatorMargin;

  // Calculate hiddenCostCore = PaidExTax - BaseStayValue
  const hiddenCostCore = paidExTax - baseStayValue;

  // Create breakdown buckets
  const createBucket = (
    label: string,
    amount: number,
    estimated: boolean,
    bucketReasons: string[] = []
  ): HospitalityBreakdownBucket => ({
    label,
    amount: Math.round(amount * 100) / 100,
    percentOfPaidTotal: paidTotal > 0 ? Math.round((amount / paidTotal) * 100 * 10) / 10 : 0,
    estimated,
    reasons: bucketReasons,
  });

  return {
    baseStayValue: createBucket(
      "Base Stay Value",
      baseStayValue,
      true,
      [`ratio=${adjustedRatios.baseStayValue.toFixed(3)}`]
    ),
    propertyAndFacilities: createBucket(
      "Property & Facilities",
      propertyAndFacilities,
      true,
      [`ratio=${adjustedRatios.propertyAndFacilities.toFixed(3)}`]
    ),
    staffAndService: createBucket(
      "Staff & Service",
      staffAndService,
      true,
      [`ratio=${adjustedRatios.staffAndService.toFixed(3)}`]
    ),
    utilitiesAndMaintenance: createBucket(
      "Utilities & Maintenance",
      utilitiesAndMaintenance,
      true,
      [`ratio=${adjustedRatios.utilitiesAndMaintenance.toFixed(3)}`]
    ),
    housekeepingAndLaundry: createBucket(
      "Housekeeping & Laundry",
      housekeepingAndLaundry,
      true,
      [`ratio=${adjustedRatios.housekeepingAndLaundry.toFixed(3)}`]
    ),
    amenitiesAndConsumables: createBucket(
      "Amenities & Consumables",
      amenitiesAndConsumables,
      true,
      [`ratio=${adjustedRatios.amenitiesAndConsumables.toFixed(3)}`]
    ),
    distributionAndOTACommission: createBucket(
      "Distribution & OTA Commission",
      distributionAndOTACommission,
      detectedChannel === 'OTA' && otaRate > 0 ? false : true, // Explicit if OTA calculated
      detectedChannel === 'OTA' && otaRate > 0
        ? [`OTA rate=${(otaRate * 100).toFixed(1)}%`]
        : [`ratio=${adjustedRatios.distributionAndOTACommission.toFixed(3)}`]
    ),
    paymentAndFXFees: createBucket(
      "Payment & FX Fees",
      paymentAndFXFees,
      fxSpread > 0 ? false : true, // Explicit if FX spread calculated
      fxSpread > 0
        ? [`base=${adjustedRatios.paymentAndFXFees.toFixed(3)}, FX spread=${(fxSpread * 100).toFixed(2)}%`]
        : [`ratio=${adjustedRatios.paymentAndFXFees.toFixed(3)}`]
    ),
    brandMarketingLoyalty: createBucket(
      "Brand/Marketing/Loyalty",
      brandMarketingLoyalty,
      true,
      [`ratio=${adjustedRatios.brandMarketingLoyalty.toFixed(3)}`]
    ),
    operatorMargin: createBucket(
      "Operator Margin",
      operatorMargin,
      true,
      [`ratio=${adjustedRatios.operatorMargin.toFixed(3)}`]
    ),
    stateLayerOnInvoice: createBucket(
      "State Layer (On Invoice)",
      stateLayerAmount,
      false, // Taxes are explicit on invoice
      ["from.invoice"]
    ),
    paidExTax,
    hiddenCostCore: Math.round(hiddenCostCore * 100) / 100,
    reasons,
  };
}



