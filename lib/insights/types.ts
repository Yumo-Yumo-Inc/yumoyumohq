/**
 * Insights data model types
 */

import type { IncomeBandKey } from "@/config/income-bands";

export type ConfidenceLevel = "verified" | "low" | "rejected";

/** Per-category budget progress for the current month (Plan tab + radar). */
export interface BudgetUsageEntry {
  category: string;
  limit: number;
  spent: number;
  pct: number;
  projectedOverrunDays: number | null;
}

/** Client-side anomaly / behavior signal for radar cards. */
export interface AnomalySignal {
  id: string;
  severity: RadarSeverityLevel;
  title: string;
  detail: string;
}

export type RadarSeverityLevel = "info" | "warning" | "alert";

export type IncomeRatioAlertKind =
  | "overall_over"
  | "needs_over"
  | "wants_over"
  | "low_savings";

export interface IncomeRatioAlert {
  id: string;
  kind: IncomeRatioAlertKind;
  severity: RadarSeverityLevel;
  title: string;
  detail: string;
  metric: number;
}

export interface IncomeRatioSummary {
  incomeMidpoint: number;
  currency: string;
  monthlySpend: number;
  spendRatio: number;
  bandKey: IncomeBandKey;
  recommendedNeedsCap: number;
  recommendedWantsCap: number;
  recommendedSavingsCap: number;
  actualNeedsSpend: number;
  actualWantsSpend: number;
  actualOtherSpend: number;
  needsRatio: number;
  wantsRatio: number;
  savingsRatio: number;
  alertLevel: "ok" | "watch" | "over";
  alerts: IncomeRatioAlert[];
}

/** Normalized subscription row for insights UI (monthly-equivalent amounts). */
export interface SubscriptionSummary {
  merchantName: string;
  monthlyAmount: number;
  annualAmount: number;
  cadence: "weekly" | "monthly" | "yearly" | "unknown";
  source: "manual" | "auto_detected";
  confidence: number;
  status: "active" | "paused" | "cancelled";
  category?: string;
}

export interface ImpulseScoreSnapshot {
  score: number;
}

export interface MonthSpendForecast {
  overBudgetRisk: number;
  projectedMonthEnd: number;
}

export interface ReceiptSummary {
  id: string;
  merchantName: string;
  country: string;
  currency: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time?: string; // Time string (HH:MM format, optional)
  totalPaid: number;
  taxAmount?: number;
  paidExTax: number;
  hiddenCostCore: number;
  importSystemCost: number;
  retailHiddenCost: number;
  productValue: number;
  confidence: ConfidenceLevel;
  category?: string;
}

export interface TimeSeriesPoint {
  date: string; // ISO date string
  spend: number;
  hiddenCostCore: number;
  productValue: number;
  taxAmount: number;
}

export interface MerchantStats {
  merchantName: string;
  receiptCount: number;
  totalHiddenCostCore: number;
  avgHiddenPercent: number;
  totalSpend: number;
  transparencyScore?: number;
}

export interface CategoryStats {
  category: string;
  receiptCount: number;
  totalHiddenCostCore: number;
  avgHiddenPercent: number;
}

export interface TrustCounts {
  verified: number;
  low: number;
  rejected: number;
  total: number;
}

export interface InsightsAggregate {
  // Totals
  totalSpend: number;
  totalPaidExTax: number;
  totalHiddenCostCore: number;
  totalProductValue: number;
  totalTaxAmount: number;
  totalImportSystemCost: number;
  totalRetailHiddenCost: number;
  
  // Rates
  hiddenCostCoreRate: number; // percentage
  confidenceCoverage: number; // percentage of verified receipts
  
  // Time series
  timeSeries: TimeSeriesPoint[];
  
  // Aggregates
  merchantStats: MerchantStats[];
  categoryStats: CategoryStats[];
  
  // Trust
  trustCounts: TrustCounts;
  
  // Baselines (for transparency scoring)
  categoryBaselines: Record<string, number>; // category -> avg hidden %
  countryBaselines: Record<string, number>; // country -> avg hidden %

  /** Enriched by dashboard / plan pipelines (optional). */
  budgetUsage?: BudgetUsageEntry[];
  anomalies?: AnomalySignal[];
  impulseScore?: ImpulseScoreSnapshot;
  forecast?: MonthSpendForecast;
}

export interface InsightsFilters {
  timeRange?: "7d" | "30d" | "90d" | "all";
  country?: string;
  currency?: string;
  category?: string;
  merchant?: string;
}

