"use client";

import { useMemo, useState } from "react";
import { ThemeCard } from "@/components/app/theme-card";
import {
  computeHeatmap,
  computeOverallStats,
  generateInsights,
  TIME_BUCKETS,
  getDayName,
  type HeatmapCell,
} from "@/lib/insights/behavior";
import type { ReceiptSummary } from "@/lib/insights/types";
import { formatCurrency } from "@/lib/insights/format";
import { useAppLocale } from "@/lib/i18n/app-context";

interface BehaviorTrapDetectorProps {
  receipts: ReceiptSummary[];
  currency: string;
  accountLevel?: number;
}

const MIN_DATA_THRESHOLD = 8;

export function BehaviorTrapDetector({
  receipts,
  currency,
  accountLevel = 1,
}: BehaviorTrapDetectorProps) {
  const { t } = useAppLocale();
  const [hoveredCell, setHoveredCell] = useState<{
    day: number;
    bucket: number;
  } | null>(null);

  const { heatmap, overallStats, insights } = useMemo(() => {
    const stats = computeOverallStats(receipts);
    const heatmapResult = computeHeatmap(receipts, 1); // Show cells with at least 1 receipt
    const insightsResult = generateInsights(heatmapResult, stats, receipts);

    return {
      heatmap: heatmapResult,
      overallStats: stats,
      insights: insightsResult,
    };
  }, [receipts]);

  // Color scale: from yellow (low) to red (high)
  const getCellColor = (rate: number | null): string => {
    if (rate === null) return "var(--app-bg-elevated)";
    
    const normalized = (rate - heatmap.minRate) / (heatmap.maxRate - heatmap.minRate || 1);
    // Yellow (hue ~50) to Red (hue ~0)
    // Interpolate: yellow at 0, orange at 0.5, red at 1.0
    const hue = 50 - (normalized * 50); // 50 (yellow) -> 0 (red)
    const saturation = 70 + (normalized * 20); // 70% (yellow) -> 90% (red) for more vibrant red
    const lightness = 45 + (normalized * 15); // 45% (yellow) -> 60% (red) for better visibility
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const getCellOpacity = (cell: HeatmapCell | null): number => {
    if (!cell) return 0.3;
    return 0.6 + (cell.avgRate / heatmap.maxRate) * 0.4;
  };

  const hasEnoughData = receipts.length >= MIN_DATA_THRESHOLD;

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("insights.behaviorTrap.title")}</h3>
        <p className="text-sm mt-1" style={{ color: "var(--app-text-muted)" }}>
          {t("insights.behaviorTrap.subtitle")}
        </p>
      </div>
      <div className="mt-4">
        {!hasEnoughData ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
              {t("insights.behaviorTrap.notEnoughData")}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--app-text-muted)" }}>
              {t("insights.behaviorTrap.needReceipts", { count: MIN_DATA_THRESHOLD })}
            </p>
          </div>
        ) : (
          <>
            {/* Insights */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>{insights.primary}</p>
              {insights.secondary && (
                <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
                  {insights.secondary}
                </p>
              )}
              {insights.action && (
                <p className="text-xs italic mt-2" style={{ color: "var(--app-text-muted)" }}>
                  💡 {insights.action}
                </p>
              )}
            </div>

            {/* Heatmap */}
            <div className="space-y-4">
              {/* Y-axis labels (time buckets) */}
              <div className="grid grid-cols-8 gap-2">
                <div className="col-span-1"></div> {/* Spacer for day labels */}
                <div className="col-span-7 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className="text-xs text-center font-medium"
                      style={{ color: "var(--app-text-muted)" }}
                    >
                      {getDayName(i)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap grid */}
              <div className="grid grid-cols-8 gap-2">
                {/* Y-axis: Time buckets */}
                <div className="col-span-1 flex flex-col justify-around">
                  {TIME_BUCKETS.map((bucket) => (
                    <div
                      key={bucket.id}
                      className="text-xs font-medium text-right pr-2"
                      style={{ color: "var(--app-text-muted)" }}
                    >
                      {bucket.label}
                    </div>
                  ))}
                </div>

                {/* Heatmap cells - Rows are time buckets, columns are days */}
                <div className="col-span-7 space-y-2">
                  {TIME_BUCKETS.map((bucket, bucketIdx) => (
                    <div key={bucket.id} className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }, (_, dayIdx) => {
                        const cell = heatmap.matrix[dayIdx][bucketIdx];
                        const isHovered =
                          hoveredCell?.day === dayIdx &&
                          hoveredCell?.bucket === bucketIdx;

                        return (
                          <div
                            key={`${dayIdx}-${bucketIdx}`}
                            className="relative aspect-square rounded border transition-all duration-200 cursor-pointer"
                            style={{
                              backgroundColor: getCellColor(cell?.avgRate ?? null),
                              opacity: getCellOpacity(cell),
                              borderWidth: isHovered ? "2px" : "1px",
                              borderColor: isHovered
                                ? "var(--app-primary)"
                                : "var(--app-border)",
                              transform: isHovered ? "scale(1.05)" : "scale(1)",
                              zIndex: isHovered ? 10 : 1,
                            }}
                            onMouseEnter={() => setHoveredCell({ day: dayIdx, bucket: bucketIdx })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {cell && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                                  {(cell.avgRate * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}

                            {/* Tooltip */}
                            {isHovered && cell && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20">
                                <div className="rounded-lg p-3 shadow-lg min-w-[200px]" style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}>
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold" style={{ color: "var(--app-text-primary)" }}>
                                      {getDayName(dayIdx)} {TIME_BUCKETS[bucketIdx].label}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                                      {t("insights.behaviorTrap.avgHiddenRate")}{" "}
                                      <span className="font-semibold" style={{ color: "var(--app-text-primary)" }}>
                                        {(cell.avgRate * 100).toFixed(1)}%
                                      </span>
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                                      {t("receipts.title")}:{" "}
                                      <span className="font-semibold" style={{ color: "var(--app-text-primary)" }}>
                                        {cell.count}
                                      </span>
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                                      {t("insights.behaviorTrap.totalSpend")}{" "}
                                      <span className="font-semibold" style={{ color: "var(--app-text-primary)" }}>
                                        {formatCurrency(cell.sumSpend, currency)}
                                      </span>
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                                      {t("insights.behaviorTrap.totalHidden")}{" "}
                                      <span className="font-semibold" style={{ color: "var(--app-text-primary)" }}>
                                        {formatCurrency(cell.sumHidden, currency)}
                                      </span>
                                    </p>
                                  </div>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                    <div className="w-2 h-2 rotate-45" style={{ background: "var(--app-bg-elevated)", borderRight: "1px solid var(--app-border)", borderBottom: "1px solid var(--app-border)" }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t" style={{ borderColor: "var(--app-border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.behaviorTrap.low")}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => {
                      const rate = (i / 4) * (heatmap.maxRate - heatmap.minRate) + heatmap.minRate;
                      return (
                        <div
                          key={i}
                          className="w-4 h-4 rounded border"
                          style={{
                            borderColor: "var(--app-border)",
                            backgroundColor: getCellColor(rate),
                            opacity: getCellOpacity({ avgRate: rate, count: 1, sumSpend: 0, sumHidden: 0 }),
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>{t("insights.behaviorTrap.high")}</span>
                </div>
                <div className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                  {t("insights.behaviorTrap.rateRange", { 
                    min: (heatmap.minRate * 100).toFixed(0), 
                    max: (heatmap.maxRate * 100).toFixed(0) 
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ThemeCard>
  );
}

