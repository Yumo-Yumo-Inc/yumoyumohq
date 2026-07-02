"use client";

import { ThemeCard } from "@/components/app/theme-card";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface HeroLevelCardProps {
  accountLevel?: number;
  accountXp?: number;
  seasonLevel?: number;
  seasonXp?: number;
  /** XP needed for current account level (nextThreshold - prevThreshold) */
  accountXpToNext?: number;
  /** XP needed for current season level */
  seasonXpToNext?: number;
  /** XP at start of current account level (for progress calc) */
  accountXpPrev?: number;
  className?: string;
}

export function HeroLevelCard({
  accountLevel = 1,
  accountXp = 0,
  seasonLevel = 1,
  seasonXp = 0,
  accountXpToNext = 150,
  seasonXpToNext = 100,
  accountXpPrev = 0,
  className,
}: HeroLevelCardProps) {
  const { t } = useAppLocale();
  const tier = useTier(accountLevel);
  const accountXpInLevel = accountXp - accountXpPrev;
  const accountProgress = accountXpToNext > 0 ? (accountXpInLevel / accountXpToNext) * 100 : 0;
  const seasonProgress = seasonXpToNext > 0 ? (seasonXp % seasonXpToNext) / seasonXpToNext * 100 : 0;

  return (
    <ThemeCard accountLevel={accountLevel} className={cn("overflow-hidden", className)}>
      <div className="flex items-center gap-4 p-4">
        <div
          className="h-14 w-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: tier.cardBg, color: tier.accent, border: `2px solid ${tier.accent}50` }}
        >
          {accountLevel}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span style={{ color: "var(--app-text-secondary)" }}>{t("common.account")}</span>
              <span className="tabular-nums font-semibold" style={{ color: tier.accent }}>{accountXpInLevel} / {accountXpToNext} XP</span>
            </div>
            <Progress value={Math.min(accountProgress, 100)} className="h-3 rounded-full bg-white/10 [&>div]:rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span style={{ color: "var(--app-text-secondary)" }}>{t("leaderboard.seasonLabel")}</span>
              <span className="tabular-nums font-semibold" style={{ color: tier.accent }}>{seasonXp} XP</span>
            </div>
            <Progress value={Math.min(seasonProgress, 100)} className="h-3 rounded-full bg-white/10 [&>div]:rounded-full" />
          </div>
        </div>
      </div>
    </ThemeCard>
  );
}
