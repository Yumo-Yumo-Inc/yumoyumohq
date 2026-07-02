"use client";

import { ThemeCard } from "@/components/app/theme-card";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useTier } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

interface TokenStripProps {
  ayumo?: number;
  ryumo?: number;
  accountLevel?: number;
  className?: string;
}

function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Abbreviates large numbers:
 *  >= 1 000 000  →  "1.2M"
 *  >= 10 000     →  "655K"
 *  >= 1 000      →  "6 339"  (integer, no thousands separator)
 *  < 1 000       →  "0.00"   (2 decimals)
 */
function fmtToken(value: number): string {
  if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}M`;
  if (value >= 10_000)    return `${Math.floor(value / 1_000)}K`;
  if (value >= 1_000)     return Math.round(value).toLocaleString("tr-TR");
  return value.toFixed(2);
}

export function TokenStrip({
  ayumo = 0,
  ryumo = 0,
  accountLevel = 1,
  className,
}: TokenStripProps) {
  const { locale } = useAppLocale();
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };
  const tier = useTier(accountLevel);
  const a = asNumber(ayumo);
  const r = asNumber(ryumo);
  const total = a + r;

  const tokens = [
    { label: byLocale("Toplam cPoints", "Total cPoints", "Всего cPoints", "cPoints รวม", "Total cPoints", "总 cPoints"), value: total, color: tier.accent, desc: byLocale("Toplam katkı puanı", "Total contribution points", "Общие баллы вклада", "คะแนนการมีส่วนร่วมทั้งหมด", "Puntos totales de contribución", "总贡献积分") },
    { label: byLocale("Fiş cPoints", "Receipt cPoints", "cPoints чеков", "cPoints ใบเสร็จ", "cPoints de recibos", "收据 cPoints"), value: a, color: tier.accent2, desc: byLocale("Fiş kazancı", "Receipt contribution", "Вклад чеков", "คะแนนจากใบเสร็จ", "Contribución de recibos", "收据贡献") },
    { label: byLocale("Bonus cPoints", "Bonus cPoints", "Бонус cPoints", "โบนัส cPoints", "Bonus cPoints", "奖励 cPoints"), value: r, color: "var(--app-text-secondary)", desc: byLocale("Görev ödülü", "Quest contribution", "Вклад квестов", "คะแนนจากภารกิจ", "Contribución de misión", "任务贡献") },
  ];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* On mobile, total reward is large and front and center */}
      <div className="text-center py-2 sm:py-0 sm:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
          {byLocale("Toplam cPoints", "Total cPoints", "Всего cPoints", "cPoints รวม", "Total cPoints", "总 cPoints")}
        </p>
        <p className="font-mono text-2xl font-bold tabular-nums mt-0.5" style={{ color: tier.accent }}>
          {fmtToken(total)}
        </p>
      </div>
      <div className={cn("flex gap-2")}>
        {tokens.map((tok) => (
          <ThemeCard key={tok.label} accountLevel={accountLevel} className="flex-1">
            <div className="text-center py-3 sm:py-4 px-2 sm:px-3">
              <p
                className="font-mono text-[15px] sm:text-[17px] tabular-nums font-bold"
                style={{ color: tok.color }}
              >
                {fmtToken(tok.value)}
              </p>
              <p
                className="text-[7px] font-semibold uppercase tracking-[0.13em] mt-0.5"
                style={{ color: `${tok.color}99` }}
              >
                {tok.label}
              </p>
              <p className="text-[8px] mt-0.5" style={{ color: "var(--app-text-muted)" }}>
                {tok.desc}
              </p>
            </div>
          </ThemeCard>
        ))}
      </div>
    </div>
  );
}
