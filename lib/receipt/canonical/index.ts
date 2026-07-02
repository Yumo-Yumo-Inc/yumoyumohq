export {
  extractCanonicalFromVision,
  parseGeminiLineItemsFromReceiptData,
  parseStructuredLineItemsFromReceiptData,
  allocateLinePricesWhenMissing,
} from "./extract-canonical";
export { resolveCanonicalObservations } from "./resolve-canonical-product";
export { resolveCanonicalObservationsV3 } from "./resolve-canonical-product-v3";
export type {
  ExtractCanonicalContext,
  GeminiStructuredLineItem,
  GeminiStructuredLineUnitType,
  VisionResponseLike,
} from "./extract-canonical";
export {
  computeLineHiddenCosts,
  fetchProductionCostWeights,
  fetchEconomicIndexMultipliers,
  fetchEconomicYoYMap,
  fetchTaxonomyBulk,
  fetchTaxonomyBulkV3,
} from "./line-hidden-cost";
export type {
  ComputeLineHiddenCostInput,
  LineHiddenCostResult,
  ProductionCostWeightsRow,
  EconomicIndexMultipliers,
  TaxonomyRow,
} from "./line-hidden-cost";
export type { HiddenCostModelType } from "@/lib/mining/types";
export type { CanonicalPayload, CanonicalObservation, CanonicalMerchant } from "../canonical-types";
export { enrichCanonicalProduct } from "./knowledge-engine";
export type { EnrichmentInput, EnrichmentResult } from "./knowledge-engine";
