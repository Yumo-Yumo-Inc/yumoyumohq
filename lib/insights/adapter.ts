/**
 * Adapter: CachedReceiptRecord -> ReceiptSummary
 *
 * The insights engine (aggregation, behavior, spending pulse) operates on
 * `ReceiptSummary`. The offline store holds `CachedReceiptRecord`. This adapter
 * keeps the two decoupled so that the insights OS can feed from the local
 * offline-first cache without round-tripping to the server.
 */

import type { CachedReceiptRecord } from "@/lib/offline/types";
import type { ConfidenceLevel, ReceiptSummary } from "./types";

function resolveConfidence(status: string | null | undefined): ConfidenceLevel {
  if (!status) return "low";
  if (status === "verified" || status === "saved" || status === "mined") return "verified";
  if (status === "rejected" || status === "failed") return "rejected";
  return "low";
}

function resolveDate(record: CachedReceiptRecord): string {
  if (record.extractionDate) return record.extractionDate;
  if (record.createdAt) return record.createdAt;
  return new Date().toISOString();
}

function resolveProductValue(record: CachedReceiptRecord): number {
  // Best-effort: totalPaid - vat - hidden = approximate product value.
  const candidate = record.paidExTax - record.hiddenCostCore;
  return candidate > 0 ? candidate : Math.max(record.paidExTax, 0);
}

export function cachedReceiptToSummary(record: CachedReceiptRecord): ReceiptSummary {
  return {
    id: record.receiptId,
    merchantName: record.merchantName ?? "Unknown",
    country: record.merchantCountry ?? "",
    currency: record.currency,
    date: resolveDate(record),
    time: record.extractionTime ?? undefined,
    totalPaid: record.totalPaid,
    taxAmount: record.vatAmount,
    paidExTax: record.paidExTax,
    hiddenCostCore: record.hiddenCostCore,
    importSystemCost: 0,
    retailHiddenCost: Math.max(record.hiddenTotal - record.hiddenCostCore, 0),
    productValue: resolveProductValue(record),
    confidence: resolveConfidence(record.status),
    category: record.merchantCategory ?? "other",
  };
}

export function cachedReceiptsToSummaries(records: CachedReceiptRecord[]): ReceiptSummary[] {
  return records
    .map(cachedReceiptToSummary)
    .filter((summary) => summary.totalPaid > 0 || summary.paidExTax > 0);
}
