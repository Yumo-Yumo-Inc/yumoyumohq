"use client";

import { ThemeCard } from "@/components/app/theme-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { InsightsAggregate } from "@/lib/insights/types";
import { formatCurrency } from "@/lib/insights/format";
import { useAppLocale } from "@/lib/i18n/app-context";

interface TimePatternsProps {
  aggregate: InsightsAggregate;
  currency: string;
  accountLevel?: number;
}

export function TimePatterns({
  aggregate,
  currency,
  accountLevel = 1,
}: TimePatternsProps) {
  const { t } = useAppLocale();

  // Format dates for display
  const chartData = aggregate.timeSeries.map((point) => {
    const date = new Date(point.date);
    return {
      ...point,
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      weekLabel: t("insights.timePatterns.weekOf", {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }),
    };
  });

  // Detect patterns (simplified - can be enhanced)
  const detectPatterns = () => {
    if (aggregate.timeSeries.length < 4) {
      return [t("insights.timePatterns.notEnoughData")];
    }

    const patterns: string[] = [];

    // Calculate average hidden cost rate
    const avgHiddenRate = aggregate.hiddenCostCoreRate;
    
    // Check if there's a trend
    if (aggregate.timeSeries.length >= 2) {
      const first = aggregate.timeSeries[0];
      const last = aggregate.timeSeries[aggregate.timeSeries.length - 1];
      const firstRate =
        first.spend > 0 ? (first.hiddenCostCore / first.spend) * 100 : 0;
      const lastRate =
        last.spend > 0 ? (last.hiddenCostCore / last.spend) * 100 : 0;

      if (lastRate > firstRate * 1.1) {
        patterns.push(t("insights.timePatterns.trendingUp"));
      } else if (lastRate < firstRate * 0.9) {
        patterns.push(t("insights.timePatterns.trendingDown"));
      }
    }

    // Category insights
    if (aggregate.categoryStats.length > 0) {
      const topCategory = aggregate.categoryStats[0];
      if (topCategory.avgHiddenPercent > avgHiddenRate * 1.2) {
        const categoryName = topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1);
        patterns.push(
          t("insights.timePatterns.categoryAboveBaseline", {
            category: categoryName,
            categoryPercent: topCategory.avgHiddenPercent.toFixed(1),
            avgPercent: avgHiddenRate.toFixed(1),
          })
        );
      }
    }

    if (patterns.length === 0) {
      patterns.push(t("insights.timePatterns.noPatterns"));
    }

    return patterns;
  };

  const patterns = detectPatterns();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Trend Line */}
      <ThemeCard accountLevel={accountLevel} className="p-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("insights.timePatterns.title")}</h3>
          <p className="text-sm mt-1" style={{ color: "var(--app-text-muted)" }}>
            {t("insights.timePatterns.subtitle")}
          </p>
        </div>
        <div className="mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--app-border)"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="weekLabel"
                  stroke="var(--app-text-muted)"
                  tick={{ fill: "var(--app-text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--app-border)" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="var(--app-text-muted)"
                  tick={{ fill: "var(--app-text-muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--app-border)" }}
                  tickFormatter={(value) => formatCurrency(value, currency)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--app-bg)",
                    border: "1px solid var(--app-border)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                  formatter={(value: number) => formatCurrency(value, currency)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="spend"
                  stroke="hsl(200, 60%, 55%)"
                  strokeWidth={2}
                  name={t("insights.timePatterns.spend")}
                  dot={{ fill: "hsl(200, 60%, 55%)", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="hiddenCostCore"
                  stroke="hsl(25, 100%, 55%)"
                  strokeWidth={2}
                  name={t("insights.timePatterns.hiddenCost")}
                  dot={{ fill: "hsl(25, 100%, 55%)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: "var(--app-text-muted)" }}>
              {t("insights.timePatterns.notEnoughForTrend")}
            </p>
          )}
        </div>
      </ThemeCard>

      {/* Pattern Cards */}
      <ThemeCard accountLevel={accountLevel} className="p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--app-text-primary)" }}>{t("insights.timePatterns.patternInsights")}</h3>
        <div className="space-y-3">
          {patterns.map((pattern, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg"
              style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--app-text-primary)" }}>{pattern}</p>
              </div>
          ))}
        </div>
      </ThemeCard>
    </div>
  );
}

