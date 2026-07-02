"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { HiddenCost } from "@/lib/mock/types";

interface HeroPieChartProps {
  hiddenCost: HiddenCost;
  currency: string;
  className?: string;
}

const COLORS = {
  hiddenCost: "hsl(25, 100%, 55%)", // Brand orange
  productValue: "hsl(150, 40%, 45%)", // Muted green
  importSystem: "hsl(220, 8%, 45%)", // Desaturated gray
  retailBrand: "hsl(220, 8%, 40%)", // Desaturated gray (darker)
  state: "hsl(220, 8%, 42%)", // Desaturated gray
};

export function HeroPieChart({
  hiddenCost,
  currency,
  className,
}: HeroPieChartProps) {
  const total = hiddenCost.totalHidden + hiddenCost.productValue;
  
  const data = [
    {
      name: "Hidden Cost",
      value: hiddenCost.totalHidden,
      color: COLORS.hiddenCost,
    },
    {
      name: "Product Value",
      value: hiddenCost.productValue,
      color: COLORS.productValue,
    },
  ].filter(item => item.value > 0);

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Cost Breakdown
          </h3>
        </div>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  `${value.toFixed(2)} ${currency}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS.hiddenCost }}
              />
              <span className="text-muted-foreground">Hidden Cost</span>
            </div>
            <span className="font-mono tabular-nums text-primary">
              {hiddenCost.totalHidden.toFixed(0)} {currency}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS.productValue }}
              />
              <span className="text-muted-foreground">Product Value</span>
            </div>
            <span className="font-mono tabular-nums text-emerald-400/60">
              {hiddenCost.productValue.toFixed(0)} {currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

