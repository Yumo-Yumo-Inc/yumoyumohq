"use client";

import { buildOfflineInsightsRecord } from "@/lib/insights/offline-summary";
import type { ConfidenceLevel, ReceiptSummary } from "@/lib/insights/types";
import { localDb } from "@/lib/local-db";
import { readCachedReceipts } from "@/lib/offline/cache";

function confidenceFromStatus(status: string | null | undefined): ConfidenceLevel {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "verified" || normalized === "saved") return "verified";
  if (normalized === "rejected") return "rejected";
  return "low";
}

export async function rebuildLocalInsightsFromReceipts(): Promise<void> {
  const receipts = await readCachedReceipts();
  const summaries: ReceiptSummary[] = receipts
    .filter((receipt) => String(receipt.status ?? "").toLowerCase() !== "rejected")
    .map((receipt) => {
      const hiddenCostCore = Number(receipt.hiddenCostCore ?? 0) || 0;
      const hiddenTotal = Number(receipt.hiddenTotal ?? hiddenCostCore) || hiddenCostCore;
      const retailHiddenCost = Math.max(0, hiddenTotal - hiddenCostCore);
      const totalPaid = Number(receipt.totalPaid ?? 0) || 0;
      const taxAmount = Number(receipt.vatAmount ?? 0) || 0;
      return {
        id: receipt.receiptId,
        merchantName: receipt.merchantName ?? "Unknown",
        country: receipt.merchantCountry ?? "",
        currency: receipt.currency || "TRY",
        date: receipt.extractionDate ?? receipt.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        time: receipt.extractionTime ?? undefined,
        totalPaid,
        taxAmount,
        paidExTax: Number(receipt.paidExTax ?? 0) || Math.max(0, totalPaid - taxAmount),
        hiddenCostCore,
        importSystemCost: 0,
        retailHiddenCost,
        productValue: Math.max(0, totalPaid - taxAmount - hiddenTotal),
        confidence: confidenceFromStatus(receipt.status),
        category: receipt.merchantCategory ?? undefined,
      };
    });

  const updatedAt = new Date().toISOString();
  await localDb.set(
    "insights",
    buildOfflineInsightsRecord({
      receipts: summaries,
      updatedAt,
      version: Date.parse(updatedAt),
    })
  );
}
