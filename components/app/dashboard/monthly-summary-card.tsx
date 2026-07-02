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

/** Current calendar month key (UTC) — matches buildOfflineInsightsRecord. */
function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Tiny inline sparkline from a numeric series (last 6 months of spend). */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 72;
  const h = 26;
  const valid = points.filter((p) => Number.isFinite(p));
  if (valid.length < 2) return null;
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const span = max - min || 1;
  const stepX = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = h - ((p - min) / span) * h;
    return [x, y] as const;
  });
  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.6} fill={color} />
    </svg>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-3.5 shadow-[var(--app-shadow-card)] backdrop-blur-xl sm:p-4">
      {children}
    </section>
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

  const { data: cpoints } = useQuery({
    queryKey: ["dashboard-cpoints-monthly"],
    queryFn: async () => {
      const res = await fetch("/api/contribution-points/monthly");
      if (!res.ok) return { earnedThisMonth: 0 };
      return (await res.json()) as { earnedThisMonth: number };
    },
    staleTime: 5 * 60_000,
  });

  const monthKey = currentMonthKey();
  const month = insights?.monthly?.[monthKey];
  const spent = month?.totalSpent ?? 0;
  const hidden = month?.hiddenCostTotal ?? 0;
  const currency = insights?.currency || "TRY";
  const trueValue = Math.max(0, spent - hidden);
  const abovePct = trueValue > 0 ? Math.round((hidden / trueValue) * 100) : 0;
  const earned = Math.round(cpoints?.earnedThisMonth ?? 0);
  const trend = insights?.spendingTrend ?? [];

  const summaryLabel = byLocale(locale, "AYLIK ÖZET", "MONTHLY SUMMARY", "ИТОГ МЕСЯЦА", "สรุปรายเดือน", "RESUMEN MENSUAL", "本月概览");
  const spentLabel = byLocale(locale, "Bu ay harcanan", "Spent this month", "Потрачено за месяц", "ใช้จ่ายเดือนนี้", "Gastado este mes", "本月支出");
  const hiddenLabel = byLocale(locale, "GİZLİ MALİYET", "HIDDEN COST", "СКРЫТАЯ СТОИМОСТЬ", "ต้นทุนแฝง", "COSTO OCULTO", "隐藏成本");
  const cpointsLabel = byLocale(locale, "KAZANILAN CPOINTS", "CPOINTS EARNED", "ЗАРАБОТАНО CPOINTS", "CPOINTS ที่ได้รับ", "CPOINTS GANADOS", "获得 CPOINTS");
  const thisMonthLabel = byLocale(locale, "bu ay", "this month", "за месяц", "เดือนนี้", "este mes", "本月");

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-28 rounded-full bg-[var(--app-text-muted)]/15" />
          <div className="h-8 w-40 rounded-lg bg-[var(--app-text-muted)]/15" />
          <div className="h-12 w-full rounded-lg bg-[var(--app-text-muted)]/10" />
        </div>
      </Card>
    );
  }

  // No spend recorded this month → honest empty state, no fabricated numbers.
  if (spent <= 0) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c79a3f]">
            {summaryLabel}
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
      </Card>
    );
  }

  return (
    <Card>
      {/* Header: label + premium chip */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c79a3f]">
          {summaryLabel}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#c79a3f]/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#c79a3f]">
          + PREMIUM
        </span>
      </div>

      {/* Welcome line */}
      <p className="mt-2 text-[13px] font-semibold text-[var(--app-text-secondary)]">
        {displayName
          ? byLocale(
              locale,
              `Tekrar hoş geldin, ${displayName} — paran nereye gitti, işte burada.`,
              `Welcome back, ${displayName} — here's where your money went.`,
              `С возвращением, ${displayName} — вот куда ушли твои деньги.`,
              `ยินดีต้อนรับกลับ ${displayName} — นี่คือที่ที่เงินของคุณไป`,
              `Bienvenido de nuevo, ${displayName} — aquí está a dónde fue tu dinero.`,
              `${displayName}，欢迎回来 — 这是你的钱去向。`,
            )
          : byLocale(
              locale,
              "Paran nereye gitti, işte burada.",
              "Here's where your money went.",
              "Вот куда ушли твои деньги.",
              "นี่คือที่ที่เงินของคุณไป",
              "Aquí está a dónde fue tu dinero.",
              "这是你的钱去向。",
            )}
      </p>

      {/* Big amount + sparkline */}
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[26px] font-black leading-none tracking-tight text-[var(--app-text-primary)]">
            {formatMoney(spent, currency, locale)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--app-text-muted)]">{spentLabel}</p>
        </div>
        <div className="shrink-0 pb-0.5">
          <Sparkline points={trend} color="#d6a44c" />
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 h-px w-full bg-[var(--app-border)]" />

      {/* Hidden cost + cPoints */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
            {hiddenLabel}
          </p>
          <p className="mt-1 text-base font-black text-[#ef6a43]">
            {formatMoney(hidden, currency, locale)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
            {byLocale(
              locale,
              `gerçek değerin %${abovePct} üzerinde`,
              `${abovePct}% above true value`,
              `на ${abovePct}% выше реальной стоимости`,
              `สูงกว่ามูลค่าจริง ${abovePct}%`,
              `${abovePct}% sobre el valor real`,
              `高于真实价值 ${abovePct}%`,
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
            {cpointsLabel}
          </p>
          <p className="mt-1 text-base font-black text-[var(--app-text-primary)]">+{earned.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">{thisMonthLabel}</p>
        </div>
      </div>
    </Card>
  );
}
