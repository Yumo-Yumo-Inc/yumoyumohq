"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_QUERY_KEY } from "@/lib/app/query-keys";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { useAppLocale } from "@/lib/i18n/app-context";
import { readCachedDashboardSummary } from "@/lib/offline/cache";
import { useTier } from "@/lib/theme/theme-context";

interface HeroTotalProps {
  receiptCount?: number;
  accountLevel?: number;
  displayName?: string;
  refreshKey?: number;
}

interface DashboardData {
  receiptCount: number;
  totalReceiptCount: number;
  totalSpent: number;
  hiddenCostTotal: number;
  currency: string;
}

function useCounter(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef<number | null>(null);

  useEffect(() => {
    t0Ref.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (timestamp: number) => {
      if (!t0Ref.current) t0Ref.current = timestamp;
      const progress = Math.min((timestamp - t0Ref.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

function currencySymbol(currency: string): string {
  if (currency === "TRY") return "TL";
  if (currency === "USD") return "$";
  if (currency === "THB") return "THB ";
  return currency ? `${currency} ` : "TL";
}

function AnimatedAmount({ amount, symbol }: { amount: number; symbol: string }) {
  const value = useCounter(amount, 1000);
  return (
    <span>
      {symbol}
      {value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

async function fetchDashboard(): Promise<DashboardData> {
  await loadBootstrapSnapshot().catch(() => {});
  const summary = await readCachedDashboardSummary();
  if (!summary) {
    throw new Error("Dashboard cache unavailable");
  }

  return {
    receiptCount: summary.receiptCount,
    totalReceiptCount: summary.totalReceiptCount,
    totalSpent: summary.totalSpent,
    hiddenCostTotal: summary.hiddenCostTotal,
    currency: summary.currency,
  };
}

export function HeroTotal({
  receiptCount = 0,
  accountLevel = 1,
  displayName,
  refreshKey = 0,
}: HeroTotalProps) {
  const tier = useTier(accountLevel);
  const { t, locale } = useAppLocale();
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };

  const { data, isLoading: loading } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY("monthly"),
    queryFn: fetchDashboard,
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous,
  });

  const totalCount = data?.totalReceiptCount ?? receiptCount;
  const monthlyReceiptCount = data?.receiptCount ?? 0;
  const monthlySpending = data?.totalSpent ?? 0;
  const monthlyHidden = data?.hiddenCostTotal ?? 0;
  const hiddenPct = monthlySpending > 0 ? Math.round((monthlyHidden / monthlySpending) * 100) : 0;
  const symbol = currencySymbol(data?.currency ?? "TRY");

  const now = new Date();
  const monthLabel = now
    .toLocaleString(
      locale === "ru" ? "ru-RU" : locale === "th" ? "th-TH" : locale === "es" ? "es-ES" : locale === "zh" ? "zh-CN" : locale === "tr" ? "tr-TR" : "en-US",
      { month: "long" },
    )
    .toUpperCase();
  const yearLabel = now.getFullYear();

  if (loading) {
    return (
      <div className="px-4 pb-5 pt-7 text-center">
        <div className="mx-auto mb-4 h-3 w-28 animate-pulse rounded-full" style={{ background: "var(--app-bg-surface)" }} />
        <div className="mx-auto h-12 w-52 animate-pulse rounded-xl" style={{ background: "var(--app-bg-surface)" }} />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="px-4 pb-5 pt-7 text-center">
        <p className="text-[22px] font-bold leading-snug tracking-[-0.01em]" style={{ color: "var(--app-text-primary)" }}>
          {byLocale(
            "Merhaba! Ben Yumbie. Bugun sana eslik etmeye basliyorum. Istersen ilk fisini tarayarak bana alisveris aliskanliklarini ogretebilirsin.",
            "Hi! I am Yumbie. I am starting to keep you company today. If you want, you can teach me your shopping habits by scanning your first receipt.",
            "Привет! Я Yumbie. Сегодня я начинаю сопровождать тебя. Можешь отсканировать первый чек и научить меня своим покупательским привычкам.",
            "สวัสดี! ฉันคือ Yumbie วันนี้ฉันจะคอยอยู่กับคุณ เริ่มจากสแกนใบเสร็จใบแรกเพื่อสอนนิสัยการซื้อของของคุณได้เลย",
            "¡Hola! Soy Yumbie. Hoy empezaré a acompañarte. Si quieres, puedes enseñarme tus hábitos de compra escaneando tu primer recibo.",
            "你好！我是 Yumbie。今天开始由我陪伴你。你可以先扫描第一张收据，教我你的消费习惯。",
          )}
        </p>
        <Link
          href="/app/mine"
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${tier.accent}, ${tier.accent}99)`,
            color: "#0a0a0a",
            boxShadow: `0 4px 20px ${tier.outerGlow}`,
          }}
        >
          {byLocale("Ilk Fisi Tara ->", "Scan First Receipt ->", "Сканировать первый чек ->", "สแกนใบเสร็จแรก ->", "Escanear primer recibo ->", "扫描第一张收据 ->")}
        </Link>
      </div>
    );
  }

  const insightColor =
    hiddenPct >= 60
      ? { dot: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.20)", text: "#FCA5A5" }
      : hiddenPct >= 25
        ? { dot: "#FBBF24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.20)", text: "#FDE68A" }
        : { dot: "#34D399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.20)", text: "#6EE7B7" };

  const subLine =
    totalCount > 5
      ? byLocale(
          "Turkiye ortalamasinin %12 uzerinde",
          "12% above the national average",
          "На 12% выше среднего по стране",
          "สูงกว่าค่าเฉลี่ยประเทศ 12%",
          "12% por encima del promedio nacional",
          "高于全国平均 12%",
        )
      : byLocale(
          `${monthlyReceiptCount} fis bu ay analiz edildi`,
          `${monthlyReceiptCount} receipts analyzed this month`,
          `В этом месяце проанализировано ${monthlyReceiptCount} чеков`,
          `เดือนนี้วิเคราะห์ใบเสร็จแล้ว ${monthlyReceiptCount} รายการ`,
          `Este mes se analizaron ${monthlyReceiptCount} recibos`,
          `本月已分析 ${monthlyReceiptCount} 张收据`,
        );

  return (
    <div key={refreshKey} className="pb-4 pt-6 text-center">
      <div className="mb-3 flex items-center justify-center gap-2">
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--app-text-secondary)" }}>
          {displayName ?? t("common.user")}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--app-gold)",
            padding: "2px 8px",
            borderRadius: 999,
            background: "var(--app-gold-glow)",
            border: "1px solid var(--app-gold-border)",
          }}
        >
          Seed
        </span>
      </div>

      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: "var(--app-text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {monthLabel} {yearLabel} / {byLocale("Toplam Harcama", "Total Spending", "Общие расходы", "การใช้จ่ายรวม", "Gasto total", "总支出")}
      </p>

      <p
        className="font-mono font-extrabold leading-none tracking-[-0.02em]"
        style={{
          fontSize: 40,
          color: "var(--app-gold-light)",
          textShadow: "0 0 60px rgba(201,168,76,0.25)",
        }}
      >
        <AnimatedAmount amount={monthlySpending} symbol={symbol} />
      </p>

      {monthlySpending > 0 ? (
        <div className="mt-3 flex justify-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: insightColor.bg, border: `1px solid ${insightColor.border}` }}
          >
            <span
              className="inline-block flex-shrink-0 rounded-full"
              style={{ width: 5, height: 5, background: insightColor.dot }}
            />
            <span className="text-[12px] font-semibold" style={{ color: insightColor.text }}>
              {byLocale(`%${hiddenPct} gizli maliyet`, `${hiddenPct}% hidden cost`, `${hiddenPct}% скрытых затрат`, `ต้นทุนแฝง ${hiddenPct}%`, `${hiddenPct}% costo oculto`, `隐藏成本 ${hiddenPct}%`)}
            </span>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-sm" style={{ color: "var(--app-text-muted)" }}>
        {subLine}
      </p>
    </div>
  );
}
