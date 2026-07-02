"use client";

import { useMemo } from "react";
import { useTier } from "@/lib/theme/theme-context";
import { ThemeCard } from "@/components/app/theme-card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { HiddenCost } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

/** Clear, distinct tones — so the layers stay visually distinguishable in the chart */
const PIE_COLORS = {
  productValue: "#22c55e",   // green — real product value
  importSystem: "#0ea5e9",   // blue — system / infrastructure
  retailBrand: "#f59e0b",    // orange — retail / brand share
  state: "#8b5cf6",          // purple — government / VAT
};

interface BreakdownDonutProps {
  hiddenCost: HiddenCost;
  currency: string;
  accountLevel?: number;
  className?: string;
}

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = data.payload.percentage || 0;
    return (
      <div
        className="rounded-xl p-3 shadow-lg pointer-events-none"
        style={{
          background: "var(--app-bg-elevated)",
          border: "1px solid var(--app-border)",
        }}
      >
        <p className="font-semibold text-sm mb-1" style={{ color: "var(--app-text-primary)" }}>
          {data.name}
        </p>
        <p className="text-sm font-mono tabular-nums" style={{ color: "var(--app-text-secondary)" }}>
          {data.value.toFixed(2)} {currency}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--app-text-muted)" }}>
          {percentage.toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

export function BreakdownDonut({
  hiddenCost,
  currency,
  accountLevel = 1,
  className,
}: BreakdownDonutProps) {
  const tier = useTier(accountLevel);
  const acc = tier.accent;

  const data = useMemo(() => {
    const items = [
      { name: "Product Value", value: hiddenCost.productValue, color: PIE_COLORS.productValue },
      { name: "Import & System", value: hiddenCost.importSystem, color: PIE_COLORS.importSystem },
      { name: "Retail/Brand", value: hiddenCost.retailBrand, color: PIE_COLORS.retailBrand },
    ];
    if (hiddenCost.state > 0) {
      items.push({ name: "State (VAT)", value: hiddenCost.state, color: PIE_COLORS.state });
    }
    return items.filter((item) => item.value > 0);
  }, [hiddenCost]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));

  return (
    <ThemeCard accountLevel={accountLevel} className={cn("p-4", className)}>
      <h3 className="text-base font-semibold mb-3" style={{ color: "var(--app-text-primary)" }}>
        Cost Breakdown
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="flex items-center justify-center relative w-full h-[200px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="70%"
                paddingAngle={4}
                stroke="var(--app-bg-elevated)"
                strokeWidth={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: acc }}>
                {total.toFixed(0)}
              </div>
              <div className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                {currency}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3 flex flex-col justify-center">
          {dataWithPercentage.map((item) => (
            <div key={item.name} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: "var(--app-bg-elevated)" }}>
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--app-text-primary)" }}>
                    {item.name}
                  </span>
                  <span className="text-xs font-mono tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm font-mono tabular-nums" style={{ color: "var(--app-text-secondary)" }}>
                  {item.value.toFixed(2)} {currency}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ThemeCard>
  );
}
