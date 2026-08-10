"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/lib/format/money";
import { readCachedInsights } from "@/lib/offline/cache";
import { useAppProfile } from "@/lib/app/profile-context";
import type { YumoLocale } from "@/lib/product-architecture/dashboard-contract";

function byLocale(
  locale: YumoLocale,
  tr: string,
  en: string,
  ru: string,
  th: string,
  es: string,
  zh: string,
): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

function intlLocaleTag(locale: YumoLocale): string {
  switch (locale) {
    case "tr": return "tr-TR";
    case "ru": return "ru-RU";
    case "th": return "th-TH";
    case "es": return "es-ES";
    case "zh": return "zh-CN";
    default:   return "en-US";
  }
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function previousMonthKey(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

/** Sparkline that fills the hero's right column. */
function HeroSparkline({ points }: { points: number[] }) {
  const w = 280;
  const h = 56;
  const valid = points.filter((p) => Number.isFinite(p));
  if (valid.length < 2) return null;
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const span = max - min || 1;
  const stepX = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = h - 6 - ((p - min) / span) * (h - 12);
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const [lastX, lastY] = coords[coords.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="block h-14 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.28" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="url(#hero-spark-fill)" />
      <path d={line} fill="none" stroke="#8b5cf6" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3.5} fill="#a78bfa" />
    </svg>
  );
}

export function MonthlySummaryCard({ locale }: { locale: YumoLocale }) {
  const { profile } = useAppProfile();
  const displayName = profile?.displayName || profile?.username || "";

  const { data: insights, isLoading } = useQuery({
    queryKey: ["dashboard-monthly-insights"],
    queryFn: () => readCachedInsights(),
    staleTime: 5 * 60_000,
  });

  const monthKey = currentMonthKey();
  const month = insights?.monthly?.[monthKey];
  const prevMonth = insights?.monthly?.[previousMonthKey()];
  const spent = month?.totalSpent ?? 0;
  const receiptCount = month?.receiptCount ?? 0;
  const currency = insights?.currency || "TRY";
  const trend = insights?.spendingTrend ?? [];

  const prevSpent = prevMonth?.totalSpent ?? 0;
  const deltaPct =
    prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 100) : null;

  const monthName = new Intl.DateTimeFormat(intlLocaleTag(locale), {
    month: "long",
  }).format(new Date());

  const spentEyebrow = byLocale(
    locale,
    `${monthName} · Aylık Harcama`,
    `${monthName} · Monthly Spend`,
    `${monthName} · Расходы за месяц`,
    `${monthName} · ค่าใช้จ่ายรายเดือน`,
    `${monthName} · Gasto mensual`,
    `${monthName} · 本月支出`,
  );
  const vsLastMonth = byLocale(locale, "geçen aya göre", "vs last month", "к прошлому месяцу", "เทียบเดือนก่อน", "vs mes pasado", "对比上月");
  const receiptsLabel = byLocale(locale, "fiş", "receipts", "чеков", "ใบเสร็จ", "recibos", "收据");

  if (isLoading) {
    return (
      <section className="animate-pulse space-y-3 pt-1">
        <div className="h-3 w-36 rounded-full bg-[var(--app-text-muted)]/15" />
        <div className="h-11 w-52 rounded-lg bg-[var(--app-text-muted)]/15" />
        <div className="h-10 w-full rounded-lg bg-[var(--app-text-muted)]/10" />
      </section>
    );
  }

  if (spent <= 0) {
    return (
      <section className="pt-1">
        <div className="flex items-center gap-3">
          <p className="min-w-0 truncate text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
            {spentEyebrow}
          </p>
          <p className="ml-auto shrink-0 font-mono text-[13px] font-black tabular-nums text-[var(--app-text-primary)]">
            0
            <span className="ml-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
              {receiptsLabel}
            </span>
          </p>
        </div>
        <p className="mt-2 text-sm font-semibold text-[var(--app-text-secondary)]">
          {displayName
            ? byLocale(
                locale,
                `Merhaba ${displayName} — bu ayın özetini ilk fişinle başlat.`,
                `Welcome back, ${displayName} — start this month's summary with your first receipt.`,
                `С возвращением, ${displayName} — начни сводку месяца с первого чека.`,
                `ยินดีต้อนรับกลับ ${displayName} — เริ่มสรุปเดือนนี้ด้วยใบเสร็จแรกของคุณ`,
                `Bienvenido de nuevo, ${displayName} — empieza el resumen del mes con tu primer recibo.`,
                `${displayName}，欢迎回来 — 用第一张收据开启本月概览。`,
              )
            : byLocale(
                locale,
                "Bu ayın özetini ilk fişinle başlat.",
                "Start this month's summary with your first receipt.",
                "Начни сводку месяца с первого чека.",
                "เริ่มสรุปเดือนนี้ด้วยใบเสร็จแรกของคุณ",
                "Empieza el resumen del mes con tu primer recibo.",
                "用第一张收据开启本月概览。",
              )}
        </p>
        <Link
          href="/app/mine"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ff7a1a] px-4 py-2 text-xs font-black text-white"
        >
          <Camera className="h-3.5 w-3.5" strokeWidth={2.2} />
          {byLocale(locale, "Fiş Ekle", "Add Receipt", "Добавить чек", "เพิ่มใบเสร็จ", "Agregar recibo", "添加收据")}
        </Link>
      </section>
    );
  }

  const hasSpark = trend.filter((p) => Number.isFinite(p)).length >= 2;

  return (
    <section aria-label={spentEyebrow} className="pt-1">
      {/* Eyebrow row — meta on the right fills the empty title line */}
      <div className="flex items-center gap-3">
        <p className="min-w-0 truncate text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
          {spentEyebrow}
        </p>
        <div className="ml-auto flex shrink-0 items-baseline gap-2">
          {receiptCount > 0 ? (
            <p className="font-mono text-[13px] font-black tabular-nums text-[var(--app-text-primary)]">
              {receiptCount}
              <span className="ml-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                {receiptsLabel}
              </span>
            </p>
          ) : null}
          {deltaPct != null ? (
            <p
              className={`font-mono text-[13px] font-black tabular-nums ${
                deltaPct <= 0 ? "text-emerald-500" : "text-amber-500"
              }`}
            >
              {deltaPct <= 0 ? "▼" : "▲"}
              {Math.abs(deltaPct)}%
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-3">
        <p className="min-w-0 -translate-y-0.5 font-mono text-[40px] font-black leading-[0.9] tracking-tight tabular-nums text-[var(--app-text-primary)] sm:text-[44px]">
          {formatMoney(spent, currency, locale)}
        </p>
        {hasSpark ? (
          <div className="min-w-0 pt-1">
            <HeroSparkline points={trend} />
            {deltaPct != null ? (
              <p className="mt-1 text-right text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                {vsLastMonth}
              </p>
            ) : null}
          </div>
        ) : deltaPct != null ? (
          <p className="pt-1 text-right text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
            {vsLastMonth}
          </p>
        ) : null}
      </div>
    </section>
  );
}
