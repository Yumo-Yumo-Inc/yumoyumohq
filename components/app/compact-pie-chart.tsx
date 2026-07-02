"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { Receipt } from "@/lib/mock/types";

export type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

interface CompactPieChartProps {
  receipts: Receipt[];
  currency: string;
  className?: string;
  /** When set, period is controlled by parent (e.g. dashboard). No client-side date filter. */
  period?: TimePeriod;
  /** Called when user changes period in dropdown. Parent should refetch and pass new receipts. */
  onPeriodChange?: (period: TimePeriod) => void;
}

// Category mapping based on merchant names (supports both English and Turkish)
const getCategory = (merchantName: string): string => {
  const name = merchantName.toLowerCase();
  
  // Restaurant/Cafe
  if (name.includes("starbucks") || name.includes("coffee") || name.includes("restaurant") || 
      name.includes("restoran") || name.includes("cafe") || name.includes("kahve") || 
      name.includes("food") || name.includes("yemek") || name.includes("sizzler") ||
      name.includes("mcdonalds") || name.includes("burger") || name.includes("kfc")) {
    return "Restaurant";
  }
  
  // Grocery/Store
  if (name.includes("7-eleven") || name.includes("family") || name.includes("convenience") || 
      name.includes("tesco") || name.includes("big c") || name.includes("central") ||
      name.includes("migros") || name.includes("carrefour") || name.includes("a101") ||
      name.includes("bim") || name.includes("şok") || name.includes("metro") ||
      name.includes("real") || name.includes("market") || name.includes("süpermarket") ||
      name.includes("grocery") || name.includes("store")) {
    return "Grocery";
  }
  
  // Electronics
  if (name.includes("electronics") || name.includes("elektronik") || name.includes("tech") || 
      name.includes("phone") || name.includes("computer") || name.includes("media markt") ||
      name.includes("teknosa") || name.includes("vatan")) {
    return "Electronics";
  }
  
  // Health/Pharmacy
  if (name.includes("pharmacy") || name.includes("eczane") || name.includes("drug") || 
      name.includes("health") || name.includes("sağlık")) {
    return "Health";
  }
  
  // Fuel/Transport
  if (name.includes("gas") || name.includes("fuel") || name.includes("petrol") ||
      name.includes("benzin") || name.includes("akaryakıt") || name.includes("shell") ||
      name.includes("bp") || name.includes("petrol ofisi") || name.includes("tüpraş") ||
      name.includes("opet") || name.includes("total") || name.includes("pompa") ||
      name.includes("istasyon") || name.includes("station")) {
    return "Transport";
  }
  
  // Fashion/Apparel
  if (name.includes("fashion") || name.includes("moda") || name.includes("zara") ||
      name.includes("mango") || name.includes("h&m") || name.includes("lc waikiki") ||
      name.includes("defacto") || name.includes("koton") || name.includes("mavi") ||
      name.includes("apparel") || name.includes("clothing")) {
    return "Fashion";
  }
  
  return "Other";
};

// Distinct colors for each category - each category has a unique color
const CATEGORY_COLORS: Record<string, string> = {
  Grocery: "hsl(25, 100%, 55%)",      // Orange - unique
  Restaurant: "hsl(150, 70%, 50%)",   // Green - unique
  Electronics: "hsl(200, 70%, 55%)",  // Blue - unique
  Health: "hsl(280, 60%, 60%)",       // Purple - unique
  Transport: "hsl(40, 80%, 60%)",     // Yellow/Amber - unique
  Fashion: "hsl(320, 60%, 60%)",      // Pink - unique
  Other: "hsl(0, 70%, 55%)",          // Red - unique
};

// Fallback color palette for unknown categories - all unique, no duplicates
// These colors are different from CATEGORY_COLORS to ensure uniqueness
const FALLBACK_COLORS = [
  "hsl(180, 70%, 55%)",  // Cyan - unique
  "hsl(270, 60%, 60%)",  // Violet - unique
  "hsl(90, 70%, 50%)",   // Lime - unique
  "hsl(195, 70%, 55%)",  // Sky Blue - unique
  "hsl(350, 70%, 60%)",  // Rose - unique
  "hsl(170, 60%, 50%)",  // Teal - unique
  "hsl(250, 60%, 60%)",  // Indigo - unique
  "hsl(15, 90%, 55%)",   // Red-Orange - unique
  "hsl(60, 80%, 55%)",   // Bright Yellow - unique
  "hsl(300, 60%, 60%)",  // Magenta - unique
];

const getDateRange = (period: TimePeriod): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  switch (period) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      start.setDate(now.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(now.getMonth() - 1);
      break;
    case "yearly":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }
  return { start, end };
};

export function CompactPieChart({
  receipts,
  currency,
  className,
  period: periodProp,
  onPeriodChange,
}: CompactPieChartProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [timePeriodLocal, setTimePeriodLocal] = useState<TimePeriod>("monthly");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const isControlled = periodProp != null && onPeriodChange != null;
  const timePeriod = isControlled ? periodProp! : timePeriodLocal;
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const { start, end } = getDateRange(timePeriod);
  const filteredReceipts = isControlled
    ? receipts
    : receipts.filter((receipt) => {
        const receiptDate = new Date(receipt.createdAt || receipt.date);
        return receiptDate >= start && receiptDate <= end;
      });
  
  // Calculate hidden cost by category from actual receipts
  const categoryData: Record<string, number> = {};
  let totalHidden = 0;
  let totalSpent = 0;
  
  filteredReceipts.forEach((receipt) => {
    const hiddenCost = receipt.hiddenCost?.totalHidden || 0;
    const spent = receipt.totalPaid || receipt.total || 0;
    
    // Get category from receipt or infer from merchant name
    let category = receipt.category;
    if (!category) {
      category = getCategory(receipt.merchantName);
    }
    
    // Normalize category name (capitalize first letter)
    const normalizedCategory = category 
      ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
      : "Other";
    
    if (!categoryData[normalizedCategory]) {
      categoryData[normalizedCategory] = 0;
    }
    
    categoryData[normalizedCategory] += hiddenCost;
    totalHidden += hiddenCost;
    totalSpent += spent;
  });
  
  // Convert to chart data format with unique color assignment
  // Track used colors to ensure no duplicates
  const usedColors = new Set<string>();
  const allCategories = Object.keys(categoryData);
  
  // Assign predefined colors to known categories first
  const categoryColorMap = new Map<string, string>();
  allCategories.forEach((name) => {
    if (CATEGORY_COLORS[name] && !usedColors.has(CATEGORY_COLORS[name])) {
      categoryColorMap.set(name, CATEGORY_COLORS[name]);
      usedColors.add(CATEGORY_COLORS[name]);
    }
  });
  
  // Then, assign unique fallback colors to remaining categories
  let fallbackIndex = 0;
  allCategories.forEach((name) => {
    if (!categoryColorMap.has(name)) {
      // Find next unused fallback color
      while (fallbackIndex < FALLBACK_COLORS.length && usedColors.has(FALLBACK_COLORS[fallbackIndex])) {
        fallbackIndex++;
      }
      if (fallbackIndex < FALLBACK_COLORS.length) {
        categoryColorMap.set(name, FALLBACK_COLORS[fallbackIndex]);
        usedColors.add(FALLBACK_COLORS[fallbackIndex]);
        fallbackIndex++;
      } else {
        // If all fallback colors are used, generate a unique color dynamically
        // Use a hash-based approach to generate consistent colors
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = (hash * 137.508) % 360; // Golden angle for good distribution
        categoryColorMap.set(name, `hsl(${hue}, 70%, 55%)`);
      }
    }
  });
  
  const data = Object.entries(categoryData)
    .map(([name, value]) => ({
      name,
      value,
      color: categoryColorMap.get(name) || FALLBACK_COLORS[0], // Final fallback
      currency,
      total: totalHidden,
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
  
  const hiddenPercent = totalSpent > 0 ? ((totalHidden / totalSpent) * 100).toFixed(1) : "0";

  // Key used to force a chart re-render
  const chartKey = `${timePeriod}-${totalHidden}`;

  const hoveredData = hoveredCategory 
    ? data.find(item => item.name === hoveredCategory)
    : null;

  return (
    <div className={className}>
      {/* Time Period Selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative">
          <select
            value={timePeriod}
            onChange={(e) => {
              const next = e.target.value as TimePeriod;
              if (isControlled) {
                onPeriodChange?.(next);
              } else {
                setTimePeriodLocal(next);
              }
            }}
            className="appearance-none bg-background border border-input rounded-lg px-3 py-1.5 text-xs pr-7 cursor-pointer hover:bg-muted transition-colors"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
          {/* Left: Info Panel */}
          <div className="space-y-2 order-2 md:order-1">
            {hoveredData ? (
              <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: hoveredData.color }}
                  />
                  <h4 className="text-sm font-semibold">{hoveredData.name}</h4>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono tabular-nums font-semibold">
                      {hoveredData.value.toFixed(0)} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Percentage:</span>
                    <span className="font-mono tabular-nums">
                      {totalHidden > 0 ? ((hoveredData.value / totalHidden) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Hover over chart segments to see details</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Hidden:</span>
                    <span className="font-mono tabular-nums font-semibold">
                      {totalHidden.toFixed(0)} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hidden %:</span>
                    <span className="font-mono tabular-nums">
                      {hiddenPercent}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Chart */}
          <div className="relative flex items-center justify-center order-1 md:order-2" style={{ minHeight: "180px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart key={chartKey}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={600}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => {
                    if (data[index]) {
                      setHoveredCategory(data[index].name);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredCategory(null);
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}-${timePeriod}`} 
                      fill={entry.color}
                      style={{
                        cursor: "pointer",
                        opacity: hoveredCategory && hoveredCategory !== entry.name ? 0.5 : 1,
                        transition: "opacity 0.2s",
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={cn(
                  "text-xl font-bold text-primary transition-all duration-500",
                  isLoaded ? "opacity-100" : "opacity-0"
                )}>
                  {hiddenPercent}%
                </div>
                <div className="text-xs text-muted-foreground">hidden</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="space-y-1.5 text-xs mt-3">
        {data.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            No receipts found for this period
          </div>
        ) : (
          data.map((item) => {
            const percentage = totalHidden > 0 ? ((item.value / totalHidden) * 100).toFixed(1) : 0;
          return (
            <div 
              key={item.name} 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors"
              onMouseEnter={() => setHoveredCategory(item.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-mono tabular-nums text-muted-foreground">
                {item.value.toFixed(0)} {currency} ({percentage}%)
              </span>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
