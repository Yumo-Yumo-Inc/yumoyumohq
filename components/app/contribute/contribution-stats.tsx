"use client";

import { useCountUp } from "@/lib/hooks/use-count-up";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { ContributionStats } from "@/lib/contribution/client";

/**
 * The header strip: where a contributor's impact accumulates.
 *
 * Research on what makes people feel they genuinely contribute (Zooniverse, Local Guides,
 * Crowdsource): lead with CONCRETE impact, not an abstract point total. So the hero number
 * is "receipts your answers fixed", not points — the honest multiplier of the work. Points
 * and today's quota sit secondary. Count-up gives the numbers a small living moment.
 */

interface ContributionStatsHeaderProps {
  stats: ContributionStats | undefined;
}

export function ContributionStatsHeader({ stats }: ContributionStatsHeaderProps) {
  const { t, locale } = useAppLocale();
  const rowsFixed = stats?.me.rowsFixed ?? 0;
  const answered = stats?.me.answered ?? 0;
  const quota = stats?.me.quota ?? 0;
  const quotaRemaining = stats?.me.quotaRemaining ?? 0;
  const done = Math.max(0, quota - quotaRemaining);

  const rowsEased = Math.round(useCountUp(rowsFixed, { durationMs: 1100 }));
  const answeredEased = Math.round(useCountUp(answered, { durationMs: 900 }));
  const pct = quota > 0 ? Math.min(100, Math.round((done / quota) * 100)) : 0;
  const nf = (n: number) => n.toLocaleString(locale === "tr" ? "tr-TR" : "en-US");

  return (
    <div>
      {/* Hero impact: receipts fixed */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--app-text-muted)" }}
          >
            {t("contribute.stats.impactEyebrow")}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="font-mono text-[38px] font-black leading-none tabular-nums"
              style={{
                background: "linear-gradient(120deg, var(--app-gold-light), var(--app-gold))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {nf(rowsEased)}
            </span>
            <span className="text-[14px] font-medium" style={{ color: "var(--app-text-secondary)" }}>
              {t("contribute.stats.receiptsFixed")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-[20px] font-bold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
            {nf(answeredEased)}
          </span>
          <p className="text-[11px] font-medium" style={{ color: "var(--app-text-muted)" }}>
            {t("contribute.stats.identified")}
          </p>
        </div>
      </div>

      {/* Today's quota progress — momentum, not pressure */}
      {quota > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[12px] font-medium" style={{ color: "var(--app-text-secondary)" }}>
              {t("contribute.stats.today")}
            </span>
            <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: "var(--app-text-muted)" }}>
              {nf(done)} / {nf(quota)}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: "var(--app-bg-surface3)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--app-gold), var(--app-gold-light))",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
