"use client";

import type { ReceiptAnalysis } from "@/lib/receipt/types";
import type { CachedReceiptRecord } from "@/lib/offline/types";
import type { HiddenCost, Receipt, Reward, TotalCandidate } from "@/lib/mock/types";
import { displayHiddenCost, resolveRawHiddenCost } from "@/lib/receipt/display-hidden-cost";

function timestampVersion(updatedAt: string): number {
  const value = Date.parse(updatedAt);
  return Number.isFinite(value) ? value : Date.now();
}

export function createOptimisticReceiptRecord(file: File, tempId?: string): CachedReceiptRecord {
  const updatedAt = new Date().toISOString();
  const id = tempId ?? `temp:${Date.now()}`;
  return {
    id,
    receiptId: id,
    status: "processing",
    createdAt: updatedAt,
    merchantName: file.name,
    merchantCountry: null,
    merchantCategory: null,
    merchantPlaceId: null,
    totalPaid: 0,
    vatAmount: 0,
    paidExTax: 0,
    currency: "USD",
    hiddenCostCore: 0,
    hiddenTotal: 0,
    contributionPoints: 0,
    extractionDate: updatedAt.slice(0, 10),
    extractionTime: null,
    walletAddress: null,
    updated_at: updatedAt,
    version: timestampVersion(updatedAt),
  };
}

export function createProcessingReceiptFromUpload(upload: {
  receiptId: string;
  filename?: string | null;
}): CachedReceiptRecord {
  const updatedAt = new Date().toISOString();
  return {
    id: upload.receiptId,
    receiptId: upload.receiptId,
    status: "processing",
    createdAt: updatedAt,
    merchantName: upload.filename ?? "Processing receipt",
    merchantCountry: null,
    merchantCategory: null,
    merchantPlaceId: null,
    totalPaid: 0,
    vatAmount: 0,
    paidExTax: 0,
    currency: "USD",
    hiddenCostCore: 0,
    hiddenTotal: 0,
    contributionPoints: 0,
    extractionDate: updatedAt.slice(0, 10),
    extractionTime: null,
    walletAddress: null,
    updated_at: updatedAt,
    version: timestampVersion(updatedAt),
  };
}

export function createReceiptRecordFromAnalysis(analysis: ReceiptAnalysis): CachedReceiptRecord {
  const updatedAt = analysis.createdAt ?? new Date().toISOString();
  const totalPaid = Number(analysis.pricing?.totalPaid ?? 0) || 0;
  const hiddenCostCore = Number(analysis.hiddenCost?.hiddenCostCore ?? 0) || 0;
  const hiddenTotal = displayHiddenCost({
    totalPaid,
    hiddenTotal: resolveRawHiddenCost({
      hiddenTotal: analysis.hiddenCost?.hiddenTotal,
      hiddenCostCore,
    }),
    hiddenCostCore,
  });
  return {
    id: analysis.receiptId,
    receiptId: analysis.receiptId,
    status: analysis.status ?? "pending",
    createdAt: analysis.createdAt ?? updatedAt,
    merchantName: analysis.merchant?.name ?? null,
    merchantCountry: analysis.merchant?.country ?? null,
    merchantCategory: analysis.merchant?.category ?? null,
    merchantPlaceId: analysis.merchant?.placeId ?? null,
    totalPaid,
    vatAmount: Number(analysis.pricing?.vatAmount ?? 0) || 0,
    paidExTax: Number(analysis.pricing?.paidExTax ?? 0) || 0,
    currency: analysis.pricing?.currency ?? "USD",
    hiddenCostCore,
    hiddenTotal,
    // cPoints are awarded by background post-process; this optimistic record
    // starts at 0 and is reconciled on the next sync from contribution_point_events.
    contributionPoints: 0,
    extractionDate: analysis.extraction?.date?.value ?? null,
    extractionTime: analysis.extraction?.time?.value ?? null,
    walletAddress: analysis.walletAddress ?? null,
    noRewardReasonCode: analysis.reward?.noRewardReasonCode ?? null,
    updated_at: updatedAt,
    version: timestampVersion(updatedAt),
  };
}

export function createReceiptRecordFromApiReceipt(
  receipt: Partial<ReceiptAnalysis> & {
    receiptId?: string;
    username?: string | null;
    displayName?: string | null;
  }
): CachedReceiptRecord {
  const createdAt = receipt.createdAt ?? new Date().toISOString();
  const totalPaid = Number(receipt.pricing?.totalPaid ?? 0) || 0;
  const hiddenCostCore = Number(receipt.hiddenCost?.hiddenCostCore ?? 0) || 0;
  const hiddenTotal = displayHiddenCost({
    totalPaid,
    hiddenTotal: resolveRawHiddenCost({
      hiddenTotal: receipt.hiddenCost?.hiddenTotal,
      hiddenCostCore,
    }),
    hiddenCostCore,
  });

  return {
    id: String(receipt.receiptId ?? ""),
    receiptId: String(receipt.receiptId ?? ""),
    status: receipt.status ?? "pending",
    createdAt,
    merchantName: receipt.merchant?.name ?? null,
    merchantCountry: receipt.merchant?.country ?? null,
    merchantCategory: receipt.merchant?.category ?? null,
    merchantPlaceId: receipt.merchant?.placeId ?? null,
    totalPaid,
    vatAmount: Number(receipt.pricing?.vatAmount ?? 0) || 0,
    paidExTax: Number(receipt.pricing?.paidExTax ?? 0) || 0,
    currency: receipt.pricing?.currency ?? "USD",
    hiddenCostCore,
    hiddenTotal,
    // Reconciled from contribution_point_events on the next sync.
    contributionPoints: 0,
    extractionDate: receipt.extraction?.date?.value ?? null,
    extractionTime: receipt.extraction?.time?.value ?? null,
    walletAddress: receipt.walletAddress ?? null,
    username: receipt.username ?? null,
    displayName: receipt.displayName ?? null,
    noRewardReasonCode: receipt.reward?.noRewardReasonCode ?? null,
    updated_at: createdAt,
    version: timestampVersion(createdAt),
  };
}

function toReceiptStatus(status: string): Receipt["status"] {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "verified" || normalized === "saved") return "VERIFIED";
  if (normalized === "rewarded_other") return "rewarded_other";
  if (normalized === "rejected") return "REJECTED";
  if (normalized === "analyzed") return "analyzed";
  if (normalized === "scanned") return "scanned";
  if (normalized === "pending") return "PENDING";
  return "PENDING";
}

export function convertCachedReceiptToReceipt(record: CachedReceiptRecord): Receipt {
  const stateLayer = record.vatAmount;
  const totalPaid = record.totalPaid;
  const shownHidden = displayHiddenCost({
    totalPaid,
    hiddenTotal: record.hiddenTotal,
    hiddenCostCore: record.hiddenCostCore,
  });
  const productValue = Math.max(totalPaid - shownHidden - stateLayer, 0);
  const retailBrand = Math.max(shownHidden - record.hiddenCostCore, 0);
  const hiddenCost: HiddenCost = {
    importSystem: Math.max(record.hiddenCostCore - stateLayer, 0),
    retailBrand,
    state: stateLayer,
    productValue,
    totalHidden: shownHidden,
    breakdownItems: [],
  };
  const reward: Reward = {
    amount: record.contributionPoints,
    symbol: "cPoints",
    claimable:
      toReceiptStatus(record.status) === "VERIFIED" ||
      toReceiptStatus(record.status) === "rewarded_other",
    noRewardReasonCode: record.noRewardReasonCode ?? undefined,
  };
  const pickedTotalCandidate: TotalCandidate = {
    value: record.totalPaid,
    score: 0,
    fromLine: 0,
    reasons: [],
  };

  return {
    id: record.receiptId,
    merchantName: record.merchantName ?? "Receipt",
    merchantPlaceId: record.merchantPlaceId ?? undefined,
    country: record.merchantCountry ?? "TH",
    currency: record.currency,
    date: record.extractionDate ?? record.createdAt?.slice(0, 10) ?? record.updated_at.slice(0, 10),
    time: record.extractionTime ?? undefined,
    total: record.totalPaid,
    totalPaid: record.totalPaid,
    vat: record.vatAmount,
    paidExTax: record.paidExTax,
    status: toReceiptStatus(record.status),
    expenseType:
      String(record.status || "").toLowerCase() === "rewarded_other" ? "other" : "personal",
    confidence: 0,
    hiddenCost,
    reward,
    reasons: [],
    ocrLines: [],
    pickedTotalCandidate,
    duplicateCheck: { isDuplicate: false },
    createdAt: record.createdAt ?? record.updated_at,
    category: record.merchantCategory ?? undefined,
    username: record.username ?? undefined,
    displayName: record.displayName ?? undefined,
    merchantChannel: "other",
  };
}
