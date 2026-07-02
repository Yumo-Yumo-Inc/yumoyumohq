"use client";

import { ThemeCard } from "@/components/app/theme-card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { InsightsAggregate } from "@/lib/insights/types";
import { formatCurrency } from "@/lib/insights/format";
import { useAppLocale } from "@/lib/i18n/app-context";

interface MoneyFlowBreakdownProps {
  aggregate: InsightsAggregate;
  currency: string;
  accountLevel?: number;
}

export function MoneyFlowBreakdown({
  aggregate,
  currency,
  accountLevel = 1,
}: MoneyFlowBreakdownProps) {
  const { t } = useAppLocale();

  // Calculate breakdown
  const total = aggregate.totalPaidExTax;
  const productValue = aggregate.totalProductValue;
  const importSystem = aggregate.totalImportSystemCost;
  const retailHidden = aggregate.totalRetailHiddenCost;
  const taxAmount = aggregate.totalTaxAmount;

  const breakdownData = [
    {
      name: t("insights.moneyFlow.productValue"),
      value: productValue,
      color: "hsl(150, 70%, 50%)", // Green
    },
    {
      name: t("insights.moneyFlow.retailHidden"),
      value: retailHidden,
      color: "hsl(25, 100%, 55%)", // Orange
    },
    {
      name: t("insights.moneyFlow.importSystem"),
      value: importSystem,
      color: "hsl(200, 70%, 55%)", // Blue
    },
    {
      name: t("insights.moneyFlow.taxVat"),
      value: taxAmount,
      color: "hsl(280, 60%, 60%)", // Purple (info only)
    },
  ].filter((item) => item.value > 0); // Only show non-zero values

  // Calculate percentages for insight text
  const productPct = total > 0 ? (productValue / total) * 100 : 0;
  const retailPct = total > 0 ? (retailHidden / total) * 100 : 0;
  const importPct = total > 0 ? (importSystem / total) * 100 : 0;
  const taxPct = total > 0 ? (taxAmount / total) * 100 : 0;

  // Example: "Out of 1,000 THB you paid: 620 product / 180 retail / 120 system / 80 tax."
  const exampleAmount = 1000;
  const insightText = t("insights.moneyFlow.insightText", {
    total: formatCurrency(exampleAmount, currency),
    product: formatCurrency((productPct / 100) * exampleAmount, currency),
    retail: formatCurrency((retailPct / 100) * exampleAmount, currency),
    system: formatCurrency((importPct / 100) * exampleAmount, currency),
    tax: formatCurrency((taxPct / 100) * exampleAmount, currency),
  });

  // Calculate percentages for legend
  const totalForPercent = breakdownData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("insights.moneyFlow.title")}</h3>
        <p className="text-sm mt-1" style={{ color: "var(--app-text-muted)" }}>
          {insightText}
        </p>
      </div>
      <div className="mt-4">
        <div style={{ pointerEvents: "none" }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={true}
                activeIndex={undefined}
                onClick={undefined}
              >
                {breakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with percentages */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--app-border)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {breakdownData.map((item, index) => {
              const percent = totalForPercent > 0 ? (item.value / totalForPercent) * 100 : 0;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 ${
                    item.name === "Tax/VAT" ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--app-text-primary)" }}>
                      {item.name} ({percent.toFixed(1)}%)
                    </p>
                    <p className="text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                      {formatCurrency(item.value, currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {taxAmount > 0 && (
            <p className="text-xs mt-3 italic" style={{ color: "var(--app-text-muted)" }}>
              {t("insights.truthMetric.disclaimer")}
            </p>
          )}
        </div>
      </div>
    </ThemeCard>
  );
}

