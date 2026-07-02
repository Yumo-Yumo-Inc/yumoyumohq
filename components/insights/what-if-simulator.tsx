"use client";

import { useState } from "react";
import { ThemeCard } from "@/components/app/theme-card";
import { Slider } from "@/components/ui/slider";
import { computeWhatIfSavings } from "@/lib/insights/compute";
import type { InsightsAggregate } from "@/lib/insights/types";
import { formatCurrency } from "@/lib/insights/format";
import { useAppLocale } from "@/lib/i18n/app-context";

interface WhatIfSimulatorProps {
  aggregate: InsightsAggregate;
  currency: string;
  accountLevel?: number;
}

const PRESETS = [10, 25, 50];

export function WhatIfSimulator({
  aggregate,
  currency,
  accountLevel = 1,
}: WhatIfSimulatorProps) {
  const { t } = useAppLocale();
  const [reductionPercent, setReductionPercent] = useState(25);

  const savings = computeWhatIfSavings(
    aggregate.totalHiddenCostCore,
    reductionPercent
  );

  // Relatable equivalence (coffee example - adjust based on currency)
  const coffeePrice = currency === "THB" ? 100 : currency === "TRY" ? 50 : 5;
  const coffeeCount = Math.round(savings / coffeePrice);

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("insights.whatIf.title")}</h3>
          <p className="text-sm mt-1" style={{ color: "var(--app-text-muted)" }}>
            {t("insights.whatIf.subtitle")}
          </p>
        </div>
        {/* Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>{t("insights.whatIf.reduction")}</label>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--app-primary)" }}>
              {reductionPercent}%
            </span>
          </div>
          <Slider
            value={[reductionPercent]}
            onValueChange={(value) => setReductionPercent(value[0])}
            min={0}
            max={75}
            step={1}
            className="w-full"
          />
          
          {/* Preset buttons */}
          <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReductionPercent(preset)}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: reductionPercent === preset ? "var(--app-primary)" : "var(--app-bg-elevated)",
                  border: `1px solid ${reductionPercent === preset ? "var(--app-primary)" : "var(--app-border)"}`,
                  color: reductionPercent === preset ? "#0a0a0a" : "var(--app-text-primary)",
                }}
              >
                {t("insights.whatIf.reduceBy", { percent: preset })}
              </button>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="p-6 rounded-xl" style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}>
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>{t("insights.whatIf.youWouldHaveSaved")}</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--app-primary)" }}>
              {formatCurrency(savings, currency)}
            </p>
            {coffeeCount > 0 && (
              <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
                ≈ {coffeeCount} {coffeeCount === 1 ? "coffee" : "coffees"}
              </p>
            )}
          </div>
        </div>
      </div>
    </ThemeCard>
  );
}

