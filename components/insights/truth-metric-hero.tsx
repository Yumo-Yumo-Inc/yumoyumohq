"use client";

import { ThemeCard } from "@/components/app/theme-card";
import { AlertCircle } from "lucide-react";
import type { InsightsAggregate } from "@/lib/insights/types";
import { formatCurrency } from "@/lib/insights/format";
import { useAppLocale } from "@/lib/i18n/app-context";

interface TruthMetricHeroProps {
  aggregate: InsightsAggregate;
  currency: string;
  timeRange: string;
  accountLevel?: number;
}

export function TruthMetricHero({
  aggregate,
  currency,
  timeRange,
  accountLevel = 1,
}: TruthMetricHeroProps) {
  const { t } = useAppLocale();

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
        <div className="space-y-4">
          {/* Title */}
          <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--app-text-primary)" }}>
            {t("insights.truthMetric.title")}
          </h2>
          <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
              {t("insights.truthMetric.subtitle")} ({timeRange})
            </p>
          </div>

          {/* Primary Metric */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: "var(--app-primary)" }}>
              {formatCurrency(aggregate.totalHiddenCostCore, currency)}
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ border: "1px solid var(--app-primary)", color: "var(--app-primary)" }}
            >
              {t("insights.truthMetric.percentOfSpending", { percent: aggregate.hiddenCostCoreRate.toFixed(1) })}
            </span>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: "var(--app-border)" }}>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--app-text-muted)" }}>{t("insights.truthMetric.totalSpend")}</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                {formatCurrency(aggregate.totalSpend, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--app-text-muted)" }}>{t("insights.truthMetric.paidExTax")}</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                {formatCurrency(aggregate.totalPaidExTax, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--app-text-muted)" }}>{t("insights.truthMetric.productValue")}</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--app-primary)" }}>
                {formatCurrency(aggregate.totalProductValue, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--app-text-muted)" }}>{t("insights.truthMetric.hiddenIndex")}</p>
              <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                {aggregate.hiddenCostCoreRate.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Disclaimer & Confidence */}
          <div className="flex items-start gap-3 pt-2 border-t" style={{ borderColor: "var(--app-border)" }}>
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--app-text-muted)" }} />
            <div className="flex-1 space-y-1">
              <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                {t("insights.truthMetric.disclaimer")}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: "var(--app-primary)" }} />
                  <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                    {t("insights.truthMetric.confidence", { percent: aggregate.confidenceCoverage.toFixed(0) })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </ThemeCard>
  );
}

