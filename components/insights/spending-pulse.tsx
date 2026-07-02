"use client";

import { useMemo } from "react";
import { ThemeCard } from "@/components/app/theme-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/insights/format";
import {
  computeSpendingPulse,
  type SpendingPulseData,
} from "@/lib/insights/spendingPulse";
import type { ReceiptSummary } from "@/lib/insights/types";
import { TrendingUp, Calendar, ReceiptText } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";

interface SpendingPulseProps {
  receipts: ReceiptSummary[];
  currency: string;
  filters?: { timeRange?: "7d" | "30d" | "90d" | "all" };
  accountLevel?: number;
}

const MIN_DATA_THRESHOLD = 3; // Minimum receipts needed to show meaningful insights

export function SpendingPulse({
  receipts,
  currency,
  filters,
  accountLevel = 1,
}: SpendingPulseProps) {
  const { t } = useAppLocale();
  const pulseData: SpendingPulseData | null = useMemo(() => {
    if (receipts.length < MIN_DATA_THRESHOLD) {
      return null;
    }
    return computeSpendingPulse(receipts, filters);
  }, [receipts, filters]);

  // Prepare chart data (combine actual and projection)
  const chartData = useMemo(() => {
    if (!pulseData) return [];

    const data: Array<{
      day: string;
      date: string;
      actual: number | null;
      projected: number | null;
      daySpend: number;
    }> = [];

    // Add actual series
    pulseData.currentMonthSeries.forEach((point) => {
      data.push({
        day: point.dayLabel,
        date: point.date,
        actual: point.cumulativeSpend,
        projected: null,
        daySpend: point.daySpend,
      });
    });

    // Add projection series (overwrite where projection exists)
    pulseData.projectionSeries.forEach((point) => {
      const existing = data.find((d) => d.date === point.date);
      if (existing) {
        existing.projected = point.cumulativeSpend;
      } else {
        data.push({
          day: point.dayLabel,
          date: point.date,
          actual: null,
          projected: point.cumulativeSpend,
          daySpend: point.daySpend,
        });
      }
    });

    return data;
  }, [pulseData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg p-3 shadow-lg" style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)" }}>
          <p className="font-medium mb-1" style={{ color: "var(--app-text-primary)" }}>{label}</p>
          <p className="text-xs mb-2" style={{ color: "var(--app-text-muted)" }}>{data.date}</p>
          {data.actual !== null && (
            <p className="text-sm" style={{ color: "var(--app-text-primary)" }}>
              <span style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.cumulative")}: </span>
              <span className="font-semibold">
                {formatCurrency(data.actual, currency)}
              </span>
            </p>
          )}
          {data.daySpend > 0 && (
            <p className="text-sm" style={{ color: "var(--app-text-primary)" }}>
              <span style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.daySpend")}: </span>
              <span className="font-semibold">
                {formatCurrency(data.daySpend, currency)}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Empty state
  if (!pulseData || receipts.length < MIN_DATA_THRESHOLD) {
    return (
      <ThemeCard accountLevel={accountLevel} className="p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--app-text-primary)" }}>{t("insights.spendingPulse.title")}</h3>
        <div className="text-center py-8" style={{ color: "var(--app-text-muted)" }}>
          <ReceiptText className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: "var(--app-text-muted)" }} />
          <p className="text-sm">
            {t("insights.spendingPulse.notEnoughData")}
          </p>
        </div>
      </ThemeCard>
    );
  }

  // Get today's date for reference line
  const today = new Date();
  const todayDate = today.getDate();
  const todayLabel = `Day ${todayDate}`;
  
  // Find the index of today in the chart data
  const todayIndex = chartData.findIndex((d) => d.date === today.toISOString().split("T")[0]);

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("insights.spendingPulse.title")}</h3>
          <p className="text-sm mt-1" style={{ color: "var(--app-text-muted)" }}>
            {t("insights.spendingPulse.subtitle")}
          </p>
        </div>
        {/* Top row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.dailyBurnRate")}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
              {formatCurrency(pulseData.dailyBurnRate, currency)}
            </p>
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.perDay")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.receiptFrequency")}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
              {pulseData.receiptFrequency.toFixed(1)}
            </p>
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.receiptsPerDay")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.projectedMonthEnd")}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--app-primary)" }}>
              {formatCurrency(pulseData.projectedMonthEnd, currency)}
            </p>
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.forecast")}</p>
          </div>
        </div>

        {/* Insight sentence */}
        <div className="rounded-lg p-4" style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}>
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--app-primary)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>{pulseData.insight}</p>
          </div>
        </div>

        {/* Main chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("insights.spendingPulse.cumulativeSpend")}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" opacity={0.3} />
              <XAxis
                dataKey="day"
                stroke="var(--app-text-muted)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="var(--app-text-muted)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => {
                  // Format as compact number (e.g., 1.2K, 5.5K)
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {todayIndex >= 0 && chartData[todayIndex] && (
                <ReferenceLine
                  x={chartData[todayIndex].day}
                  stroke="var(--app-text-muted)"
                  strokeDasharray="2 2"
                  opacity={0.5}
                />
              )}
              {/* Actual cumulative line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="var(--app-primary)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                name={t("insights.spendingPulse.actual")}
              />
              {/* Projected cumulative line (dashed) */}
              <Line
                type="monotone"
                dataKey="projected"
                stroke="var(--app-text-muted)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                name={t("insights.spendingPulse.projected")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Micro-breakdown */}
        {(pulseData.topSpendingDay || pulseData.mostFrequentCategory) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: "var(--app-border)" }}>
            {pulseData.topSpendingDay && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" style={{ color: "var(--app-text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.topSpendingDay")}</p>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--app-text-primary)" }}>
                    {pulseData.topSpendingDay.weekday}
                  </p>
                  <p className="text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                    {formatCurrency(pulseData.topSpendingDay.amount, currency)}
                  </p>
                </div>
              </div>
            )}
            {pulseData.mostFrequentCategory && (
              <div className="flex items-center gap-3">
                <ReceiptText className="h-4 w-4" style={{ color: "var(--app-text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.spendingPulse.mostFrequentCategory")}</p>
                  <p className="text-sm font-medium truncate capitalize" style={{ color: "var(--app-text-primary)" }}>
                    {pulseData.mostFrequentCategory.category}
                  </p>
                  <p className="text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                    {pulseData.mostFrequentCategory.count} receipt
                    {pulseData.mostFrequentCategory.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ThemeCard>
  );
}

