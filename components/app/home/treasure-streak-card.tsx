"use client";

import { ThemeCard } from "@/components/app/theme-card";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { cn } from "@/lib/utils";

interface TreasureStreakCardProps {
  streak?: number;
  ayumo?: number;
  accountLevel?: number;
  className?: string;
}

export function TreasureStreakCard({
  streak = 0,
  ayumo = 0,
  accountLevel = 1,
  className,
}: TreasureStreakCardProps) {
  const { t, locale } = useAppLocale();
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };
  const tier = useTier(accountLevel);

  return (
    <ThemeCard accountLevel={accountLevel} className={cn("space-y-3 p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, var(--app-gold-glow, rgba(201,168,76,0.15)), transparent)`,
              border: `1px solid var(--app-gold-border, rgba(201,168,76,0.18))`,
            }}
          >
            🔥
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("quests.streak")}</p>
            <p className="text-[11px]" style={{ color: "var(--app-text-muted)" }}>{t("home.treasure")}</p>
          </div>
        </div>
        <span className="font-mono text-[22px] font-bold tabular-nums" style={{ color: tier.accent }}>
          {streak}
        </span>
      </div>

      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, transparent, var(--app-gold-border, rgba(201,168,76,0.18)), transparent)`,
        }}
      />

      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--app-text-muted)" }}
        >
          cPoints {byLocale("bakiyesi", "balance", "баланс", "ยอดคงเหลือ", "saldo", "余额")}
        </span>
        <span
          className="font-mono text-[15px] font-bold tabular-nums"
          style={{ color: "var(--app-gold-light, #E8C97A)" }}
        >
          {ayumo.toFixed(2)}
        </span>
      </div>
    </ThemeCard>
  );
}
