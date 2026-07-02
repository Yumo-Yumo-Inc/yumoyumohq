/**
 * Recurring transaction / subscription detection.
 *
 * Heuristic: group receipts by merchant, require at least 2 occurrences with a
 * stable amount (CoV <= 0.15) and infer cadence from median inter-arrival gap.
 *   - weekly   : 6..10 day gap
 *   - monthly  : 25..35 day gap
 *   - yearly   : 330..400 day gap
 *
 * Returns proposals only — the caller decides whether to materialize them as
 * `CachedSubscriptionRecord`s (usually after UI confirmation).
 */

import type { ReceiptSummary, SubscriptionSummary } from "@/lib/insights/types";
import type {
  CachedSubscriptionRecord,
  SubscriptionCadence,
} from "@/lib/offline/types";

export interface SubscriptionProposal {
  merchantName: string;
  category: string | null;
  amount: number;
  currency: string;
  cadence: SubscriptionCadence;
  confidence: number;
  sampleSize: number;
  firstSeen: string;
  lastSeen: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function cadenceFromDays(days: number): SubscriptionCadence {
  if (days >= 6 && days <= 10) return "weekly";
  if (days >= 25 && days <= 35) return "monthly";
  if (days >= 330 && days <= 400) return "yearly";
  return "unknown";
}

export function detectSubscriptions(
  receipts: ReceiptSummary[]
): SubscriptionProposal[] {
  if (receipts.length < 2) return [];

  const byMerchant = new Map<string, ReceiptSummary[]>();
  for (const r of receipts) {
    if (!r.merchantName) continue;
    const key = r.merchantName.toLowerCase();
    const list = byMerchant.get(key) ?? [];
    list.push(r);
    byMerchant.set(key, list);
  }

  const proposals: SubscriptionProposal[] = [];
  for (const [, group] of byMerchant.entries()) {
    if (group.length < 2) continue;
    const sorted = group
      .map((r) => ({ ...r, dateMs: Date.parse(r.date) }))
      .filter((r) => Number.isFinite(r.dateMs))
      .sort((left, right) => left.dateMs - right.dateMs);
    if (sorted.length < 2) continue;

    const amounts = sorted.map((r) => r.totalPaid);
    const avgAmount = amounts.reduce((acc, v) => acc + v, 0) / amounts.length;
    if (avgAmount <= 0) continue;
    const variance =
      amounts.reduce((acc, v) => acc + (v - avgAmount) ** 2, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cov = stdDev / avgAmount;
    if (cov > 0.15) continue;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const diffDays = (sorted[i].dateMs - sorted[i - 1].dateMs) / (24 * 60 * 60 * 1000);
      if (diffDays > 0) gaps.push(diffDays);
    }
    const medianGap = median(gaps);
    const cadence = cadenceFromDays(medianGap);
    if (cadence === "unknown") continue;

    const confidence = Math.min(
      1,
      0.5 + Math.min(0.3, sorted.length / 10) + (1 - cov) * 0.2
    );

    proposals.push({
      merchantName: sorted[0].merchantName,
      category: sorted[0].category ?? null,
      amount: Number(avgAmount.toFixed(2)),
      currency: sorted[0].currency,
      cadence,
      confidence,
      sampleSize: sorted.length,
      firstSeen: sorted[0].date,
      lastSeen: sorted[sorted.length - 1].date,
    });
  }

  return proposals.sort((a, b) => b.confidence - a.confidence);
}

export function summarizeSubscriptions(
  subscriptions: CachedSubscriptionRecord[]
): SubscriptionSummary[] {
  return subscriptions.map((record) => {
    const monthlyAmount =
      record.cadence === "weekly"
        ? record.amount * 4.345
        : record.cadence === "yearly"
          ? record.amount / 12
          : record.amount;
    const annualAmount =
      record.cadence === "yearly"
        ? record.amount
        : record.cadence === "weekly"
          ? record.amount * 52
          : record.amount * 12;
    return {
      merchantName: record.merchantName,
      monthlyAmount,
      annualAmount,
      cadence: record.cadence,
      source: record.source,
      confidence: record.confidence,
      status: record.status,
      category: record.category ?? undefined,
    };
  });
}
