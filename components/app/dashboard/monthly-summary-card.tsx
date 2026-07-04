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

/** Current calendar month key (UTC) — matches buildOfflineInsightsRecord. */
function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Previous calendar month key (UTC), for the month-over-month delta. */
function previousMonthKey(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

/** Area sparkline over the last months of spend — fills the hero column. */
function HeroSparkline({ points }: { points: number[] }) {
  const w = 220;
  const h = 40;
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
      className="mt-4 block h-10 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="url(#hero-spark-fill)" />
      <path d={line} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3.5} fill="#a78bfa" />
    </svg>
  );
}

/** Borderless stat block — a colored left hairline + typography, no card box. */
function StatBlock({
  value,
  label,
  sub,
  tone,
}: {
  value: string;
  label: string;
  sub?: string;
  tone: "neutral" | "gold" | "hidden";
}) {
  const border =
    tone === "hidden"
      ? "border-l-[#ef6a43]/40"
      : "border-l-[var(--app-gold-border)]";
  const valueColor =
    tone === "gold"
      ? "text-[var(--app-gold-light)]"
      : tone === "hidden"
        ? "text-[#ef6a43]"
        : "text-[var(--app-text-primary)]";
  return (
    <div className={`border-l-2 pl-3 ${border}`}>
      <p className={`font-mono text-[17px] font-bold tabular-nums leading-tight ${valueColor}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.09em] text-[var(--app-text-muted)]">
        {label}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[10px] font-semibold text-[var(--app-text-muted)]">{sub}</p>
      ) : null}
    </div>
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
  const prevMonth = insights?.monthly?.[previousMonthKey()];
  const spent = month?.totalSpent ?? 0;
  const hidden = month?.hiddenCostTotal ?? 0;
  const receiptCount = month?.receiptCount ?? 0;
  const currency = insights?.currency || "TRY";
  const earned = Math.round(cpoints?.earnedThisMonth ?? 0);
  const trend = insights?.spendingTrend ?? [];

  const prevSpent = prevMonth?.totalSpent ?? 0;
  const deltaPct =
    prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 100) : null;

  // Hidden cost share of every 100 units paid (spent-based, honest framing).
  const hiddenPer100 = spent > 0 ? Math.round((hidden / spent) * 100) : 0;

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
  const proofLabel = byLocale(locale, "Doğrulanmış Kanıt", "Verified Proofs", "Проверенные чеки", "หลักฐานที่ยืนยันแล้ว", "Pruebas verificadas", "已验证凭证");
  const earnedLabel = byLocale(locale, "Bu Ay Kazanç", "Earned This Month", "Заработано за месяц", "รายได้เดือนนี้", "Ganado este mes", "本月收益");
  const hiddenLabel = byLocale(locale, "Gizli Pay", "Hidden Cost", "Скрытая доля", "ต้นทุนแฝง", "Costo oculto", "隐藏成本");
  const hiddenSub =
    hiddenPer100 > 0
      ? byLocale(
          locale,
          `her ₺100'de ₺${hiddenPer100}`,
          `${hiddenPer100} in every 100`,
          `${hiddenPer100} из каждых 100`,
          `${hiddenPer100} ในทุก 100`,
          `${hiddenPer100} de cada 100`,
          `每 100 中有 ${hiddenPer100}`,
        )
      : undefined;

  if (isLoading) {
    return (
      <section className="animate-pulse space-y-3 pt-1">
        <div className="h-3 w-36 rounded-full bg-[var(--app-text-muted)]/15" />
        <div className="h-11 w-52 rounded-lg bg-[var(--app-text-muted)]/15" />
        <div className="h-10 w-full rounded-lg bg-[var(--app-text-muted)]/10" />
      </section>
    );
  }

  // No spend recorded this month → honest empty state, no fabricated numbers.
  if (spent <= 0) {
    return (
      <section className="pt-1">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
          {spentEyebrow}
        </p>
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

  return (
    <section
      aria-label={spentEyebrow}
      className="grid grid-cols-[1.5fr_1fr] items-start gap-4 pt-1"
    >
      {/* Left: the hero number, boxless on the page ground */}
      <div className="min-w-0">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
          {spentEyebrow}
        </p>
        <p className="mt-1.5 font-mono text-[38px] font-bold leading-none tracking-tight tabular-nums text-[var(--app-text-primary)]">
          {formatMoney(spent, currency, locale)}
        </p>
        {deltaPct != null && (
          <p
            className={`mt-2 text-[12.5px] font-bold ${
              deltaPct <= 0 ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {deltaPct <= 0 ? "▼" : "▲"} %{Math.abs(deltaPct)} {vsLastMonth}
          </p>
        )}
        <HeroSparkline points={trend} />
      </div>

      {/* Right: Proof of Expense identity column — the dashboard's second
          sentence: spending produces proof, proof produces earnings. */}
      <aside className="flex flex-col gap-4 pt-1">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-gold-light)]">
          {byLocale(locale, "Harcama Kanıtı", "Proof of Expense", "Proof of Expense", "Proof of Expense", "Proof of Expense", "Proof of Expense")}
        </p>
        {receiptCount > 0 && (
          <StatBlock value={String(receiptCount)} label={proofLabel} tone="neutral" />
        )}
        {earned > 0 && (
          <StatBlock value={`+${earned.toLocaleString()} cP`} label={earnedLabel} tone="gold" />
        )}
        {hidden > 0 && (
          <StatBlock
            value={formatMoney(hidden, currency, locale)}
            label={hiddenLabel}
            sub={hiddenSub}
            tone="hidden"
          />
        )}
      </aside>
    </section>
  );
}
