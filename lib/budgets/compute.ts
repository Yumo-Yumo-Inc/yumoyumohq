/**
 * Budget usage & suggestion helpers.
 *
 * Pure functions — no IO. Consumed by both the insights Plan tab (detailed
 * usage bars + overrun warnings) and the dashboard gauge (single aggregated
 * ratio). The suggestion engine uses the declared income band as its seed
 * and a 50/30/20 template (needs/wants/savings) as the distribution.
 */

import type { CachedBudgetRecord } from "@/lib/offline/types";
import type { ReceiptSummary, BudgetUsageEntry } from "@/lib/insights/types";
import {
  resolveIncomeBand,
} from "@/lib/insights/income-ratio";

/** Categories considered "needs" (50%) for suggestions. */
export const NEEDS_CATEGORIES = ["grocery", "groceries", "food", "health", "pharmacy", "transport", "utility", "home", "housing"];
/** Categories considered "wants" (30%). */
export const WANTS_CATEGORIES = ["cafe", "restaurant", "dining", "entertainment", "shopping", "electronics", "beauty", "travel"];

export function categoryBucket(category: string): "needs" | "wants" | "other" {
  const lower = category.toLowerCase();
  if (NEEDS_CATEGORIES.some((key) => lower.includes(key))) return "needs";
  if (WANTS_CATEGORIES.some((key) => lower.includes(key))) return "wants";
  return "other";
}

export function computeBudgetUsage(
  receipts: ReceiptSummary[],
  budgets: CachedBudgetRecord[],
  referenceDate: Date = new Date()
): BudgetUsageEntry[] {
  if (budgets.length === 0) return [];
  const monthKey = referenceDate.toISOString().slice(0, 7);
  const daysInMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0
  ).getDate();
  const currentDay = referenceDate.getDate();

  const spendByCategory = new Map<string, number>();
  for (const receipt of receipts) {
    if (!receipt.date.startsWith(monthKey)) continue;
    const cat = (receipt.category ?? "other").toLowerCase();
    spendByCategory.set(cat, (spendByCategory.get(cat) ?? 0) + receipt.totalPaid);
  }

  return budgets
    .filter((budget) => budget.active)
    .map((budget) => {
      const spent = spendByCategory.get(budget.category.toLowerCase()) ?? 0;
      const pct = budget.amount > 0 ? spent / budget.amount : 0;
      const dailyRate = currentDay > 0 ? spent / currentDay : 0;
      const remaining = Math.max(0, budget.amount - spent);
      const projectedOverrunDays =
        dailyRate > 0 && spent < budget.amount
          ? Math.round(remaining / dailyRate + currentDay)
          : null;
      const daysBeforeMonthEnd = daysInMonth - currentDay;
      return {
        category: budget.category,
        limit: budget.amount,
        spent,
        pct,
        projectedOverrunDays:
          projectedOverrunDays !== null && projectedOverrunDays < daysInMonth + daysBeforeMonthEnd
            ? projectedOverrunDays
            : null,
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

export interface BudgetSuggestion {
  category: string;
  amount: number;
  currency: string;
  reason: string;
}

/**
 * Generate category budget suggestions from income band + observed category stats.
 * Returns at most `limit` suggestions.
 */
export function suggestBudgets(params: {
  incomeBandKey: string | null | undefined;
  currency: string;
  categoryStats: { category: string; totalSpend: number; receiptCount: number }[];
  limit?: number;
}): BudgetSuggestion[] {
  const { incomeBandKey, currency } = params;
  const band = resolveIncomeBand(incomeBandKey, currency);
  if (!band) return [];

  // 50/30/20: needs=50%, wants=30%, savings=20%.
  const monthlyInCurrency = band.midpointInCurrency;
  const needsPool = monthlyInCurrency * 0.5;
  const wantsPool = monthlyInCurrency * 0.3;

  const limit = params.limit ?? 5;
  const ranked = [...params.categoryStats]
    .filter((c) => c.category && c.receiptCount >= 2)
    .sort((left, right) => right.totalSpend - left.totalSpend);

  const buckets = { needs: [] as typeof ranked, wants: [] as typeof ranked, other: [] as typeof ranked };
  for (const cat of ranked) {
    buckets[categoryBucket(cat.category)].push(cat);
  }

  const suggestions: BudgetSuggestion[] = [];

  if (buckets.needs.length > 0) {
    const perCategory = needsPool / buckets.needs.length;
    for (const cat of buckets.needs.slice(0, 3)) {
      suggestions.push({
        category: cat.category,
        amount: Math.round(perCategory),
        currency,
        reason: "50/30/20 · needs",
      });
    }
  }

  if (buckets.wants.length > 0) {
    const perCategory = wantsPool / Math.max(1, buckets.wants.length);
    for (const cat of buckets.wants.slice(0, 2)) {
      suggestions.push({
        category: cat.category,
        amount: Math.round(perCategory),
        currency,
        reason: "50/30/20 · wants",
      });
    }
  }

  if (suggestions.length === 0 && buckets.other.length > 0) {
    suggestions.push({
      category: buckets.other[0].category,
      amount: Math.round(monthlyInCurrency * 0.15),
      currency,
      reason: "observed top category",
    });
  }

  return suggestions.slice(0, limit);
}
