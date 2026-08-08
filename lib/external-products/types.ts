export const MARKET_FIYATI_SOURCE = "marketfiyati" as const;

export type ExternalMatchStatus =
  | "pending"
  | "suggested"
  | "user_confirmed"
  | "rejected"
  | "needs_review";

export interface ParsedPackage {
  count: number;
  size: number | null;
  unit: string | null;
  signature: string;
}

/**
 * Parsed card. `normalized_name` is deliberately absent: the database derives it from
 * `raw_name` with `normalize_receipt_text`, the same function every other matching path
 * uses. A second normalizer in TypeScript would drift from it silently.
 */
export interface ParsedExternalProduct {
  sourceProductId: string;
  rawName: string;
  merchantLabel: string;
  priceTl: number;
  oldPriceTl: number | null;
  unitPriceTl: number | null;
  unitType: string | null;
  package: ParsedPackage;
  pageNumber: number | null;
}

export interface ExternalHtmlValidationError {
  cardIndex: number;
  pageNumber: number | null;
  code: "missing_name" | "missing_source_product_id" | "missing_merchant" | "missing_price";
  message: string;
}

export interface ParsedExternalHtmlPage {
  pageNumber: number | null;
  products: ParsedExternalProduct[];
  errors: ExternalHtmlValidationError[];
}

export interface ExternalImportPageInput {
  html: string;
  pageNumber?: number | null;
}

export interface ExternalImportInput {
  source: typeof MARKET_FIYATI_SOURCE;
  pages: ExternalImportPageInput[];
  batchKey?: string | null;
  searchTerm?: string | null;
  locationLabel?: string | null;
  observedAt: Date;
  createdBy?: string | null;
}

export interface ExternalImportError {
  pageNumber: number | null;
  cardIndex?: number;
  code: string;
  message: string;
}

export interface ExternalImportResult {
  batchId: string;
  batchKey: string;
  parsedCount: number;
  importedCount: number;
  observationCount: number;
  duplicateCount: number;
  errors: ExternalImportError[];
}

