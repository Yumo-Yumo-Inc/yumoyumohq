"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  CheckSquare,
  ChevronRight,
  Gift,
  ReceiptText,
  Target,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { ErrorState } from "@/components/app/error-state";
import { MonthlySummaryCard } from "@/components/app/dashboard/monthly-summary-card";
import { YumbieWorkspaceGate } from "@/components/yumbie/YumbieWorkspaceGate";
import { useAppProfile } from "@/lib/app/profile-context";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import { fetchCategorySpending, fetchWeeklySpend } from "@/lib/insights/category-spending";
import {
  pickText,
  type UserFacingText,
  type YumoLocale,
} from "@/lib/product-architecture/dashboard-contract";

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

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function ShellCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[28px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow-card)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}


function formatCurrency(amount: number, currency: string, locale: YumoLocale): string {
  try {
    return new Intl.NumberFormat(intlLocaleTag(locale), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

function SpendingCategoryCard({ locale }: { locale: YumoLocale }) {
  const { data: buckets = [], isLoading } = useQuery({
    queryKey: ["dashboard-category-spending"],
    queryFn: () => fetchCategorySpending(),
    staleTime: 5 * 60_000,
  });
  const { data: weekly } = useQuery({
    queryKey: ["dashboard-weekly-spend"],
    queryFn: () => fetchWeeklySpend(),
    staleTime: 5 * 60_000,
  });

  const totalSpend = buckets.reduce((s, b) => s + b.total, 0);
  const currency = buckets[0]?.currency ?? weekly?.currency ?? "TRY";

  if (isLoading) {
    return (
      <ShellCard className="p-4 sm:p-5">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-32 rounded-full bg-[var(--app-text-muted)]/15" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-[var(--app-text-muted)]/12" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-24 rounded-full bg-[var(--app-text-muted)]/15" />
                <div className="h-1.5 rounded-full bg-[var(--app-text-muted)]/12" />
              </div>
              <div className="h-3 w-16 rounded-full bg-[var(--app-text-muted)]/15" />
            </div>
          ))}
        </div>
      </ShellCard>
    );
  }

  const lastWeekLabel = byLocale(locale, "Bu hafta", "Last week", "На этой неделе", "สัปดาห์นี้", "Esta semana", "本周");
  const spendingBreakdownLabel = byLocale(locale, "Harcama Dağılımı", "Spending Breakdown", "Распределение расходов", "การกระจายค่าใช้จ่าย", "Desglose de gastos", "支出分布");
  const detailsLabel = byLocale(locale, "Detay", "Details", "Подробнее", "รายละเอียด", "Detalles", "详情");
  const weeklySpendLabel = byLocale(locale, "Haftalık harcama", "Weekly spend", "Расходы за неделю", "ใช้จ่ายรายสัปดาห์", "Gasto semanal", "每周支出");
  const vsLastWeekLabel = byLocale(locale, "geçen haftaya göre", "vs last week", "к прошлой неделе", "เทียบสัปดาห์ก่อน", "vs semana pasada", "对比上周");

  if (buckets.length === 0) {
    return (
      <ShellCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
              {lastWeekLabel}
            </p>
            <p className="mt-1 text-base font-black text-[var(--app-text-primary)]">
              {spendingBreakdownLabel}
            </p>
          </div>
          <Link
            href="/app/insights"
            className="flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-bg-surface3)] px-3 py-1.5 text-[11px] font-bold text-[var(--app-text-secondary)] transition hover:brightness-110"
          >
            {detailsLabel}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 rounded-[18px] border border-dashed border-[var(--app-border-strong)] p-4 text-center">
          <p className="text-sm font-bold text-[var(--app-text-secondary)]">
            {byLocale(
              locale,
              "Henüz fiş taranmadı. İlk fişini ekle ve harcamalarını burada gör.",
              "No receipts yet. Scan your first receipt to see your spending here.",
              "Чеков пока нет. Отсканируй первый чек и увидишь свои расходы здесь.",
              "ยังไม่มีใบเสร็จ สแกนใบเสร็จแรกเพื่อดูค่าใช้จ่ายของคุณที่นี่",
              "Aún no hay recibos. Escanea tu primer recibo y verás tus gastos aquí.",
              "还没有收据。扫描你的第一张收据，在这里查看你的支出。",
            )}
          </p>
          <Link
            href="/app/mine"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ff7a1a] px-4 py-2 text-xs font-black text-white"
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={2.2} />
            {byLocale(locale, "Fiş Ekle", "Add Receipt", "Добавить чек", "เพิ่มใบเสร็จ", "Agregar recibo", "添加收据")}
          </Link>
        </div>
      </ShellCard>
    );
  }

  const maxWeek = Math.max(1, ...(weekly?.weeks.map((w) => w.total) ?? [0]));
  const hasWeekly = !!weekly && weekly.weeks.some((w) => w.total > 0);

  return (
    <ShellCard className="p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
            {lastWeekLabel}
          </p>
          <p className="mt-0.5 text-base font-black text-[var(--app-text-primary)]">
            {spendingBreakdownLabel}
          </p>
        </div>
        <Link
          href="/app/insights"
          className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-bg-surface3)] px-3 py-1.5 text-[11px] font-bold text-[var(--app-text-secondary)] transition hover:brightness-110"
        >
          {detailsLabel}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Weekly bars */}
      {hasWeekly && weekly && (
        <div className="mt-4">
          <div className="flex items-end justify-between gap-2">
            <span className="text-xs font-bold text-[var(--app-text-secondary)]">{weeklySpendLabel}</span>
            <div className="text-right">
              {weekly.deltaPct != null && (
                <span
                  className={cn(
                    "text-[11px] font-bold",
                    weekly.deltaPct <= 0 ? "text-emerald-500" : "text-amber-500",
                  )}
                >
                  {weekly.deltaPct <= 0 ? "▼" : "▲"} {Math.abs(weekly.deltaPct)}% {vsLastWeekLabel}
                </span>
              )}
              <p className="text-sm font-black text-[var(--app-text-primary)]">
                {formatCurrency(weekly.currentWeekTotal, currency, locale)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex h-16 items-stretch gap-2">
            {weekly.weeks.map((w, i) => {
              const pct = Math.max(6, Math.round((w.total / maxWeek) * 100));
              const isCurrent = i === weekly.currentWeekIndex;
              return (
                <div key={w.key} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      style={{ height: `${pct}%` }}
                      className={cn(
                        "w-full rounded-md transition-[height] duration-700",
                        isCurrent ? "bg-[#8b5cf6]" : "bg-[var(--app-text-muted)]/15",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold",
                      isCurrent ? "text-[#a78bfa]" : "text-[var(--app-text-muted)]",
                    )}
                  >
                    {w.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category rows */}
      <div className="mt-4 space-y-3">
        {buckets.map((bucket) => {
          const pct = totalSpend > 0 ? Math.round((bucket.total / totalSpend) * 100) : 0;
          const barWidth = Math.max(4, pct);
          return (
            <div key={bucket.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                    style={{ color: bucket.chartColor.dot, backgroundColor: bucket.chartColor.dotBg }}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                  </span>
                  <span className="truncate text-sm font-bold text-[var(--app-text-primary)]">
                    {bucket.label[locale]}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-black text-[var(--app-text-primary)]">
                    {formatCurrency(bucket.total, bucket.currency, locale)}
                  </span>
                  <span className="ml-1.5 text-[10px] font-bold text-[var(--app-text-muted)]">%{pct}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--app-text-muted)]/15">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${barWidth}%`,
                    backgroundImage: `linear-gradient(to right, ${bucket.chartColor.barStart}, ${bucket.chartColor.barEnd})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div
        className="mt-4 flex items-center justify-between rounded-[16px] border px-3 py-2.5"
        style={{ background: "var(--app-bg-surface3)", borderColor: "var(--app-border)" }}
      >
        <span className="text-xs font-bold" style={{ color: "var(--app-text-secondary)" }}>
          {byLocale(locale, "Toplam harcama", "Total spent", "Всего потрачено", "ใช้จ่ายทั้งหมด", "Gasto total", "总支出")}
        </span>
        <span className="text-sm font-black" style={{ color: "var(--app-text-primary)" }}>
          {formatCurrency(totalSpend, currency, locale)}
        </span>
      </div>
    </ShellCard>
  );
}

/* Quick category tiles — 4 destinations distinct from the bottom-nav pages. */
type QuickCategory = {
  id: string;
  href: string;
  icon: LucideIcon;
  title: UserFacingText;
  desc: UserFacingText;
  iconBg: string;
  iconColor: string;
};

const QUICK_CATEGORIES: QuickCategory[] = [
  {
    id: "bills",
    href: "/app/bills",
    icon: ReceiptText,
    title: { tr: "Faturalarım", en: "Bills", ru: "Счета", th: "บิล", es: "Facturas", zh: "账单" },
    desc: {
      tr: "Aylık abonelik ve faturaları yönet",
      en: "Manage monthly subscriptions",
      ru: "Подписки и счета",
      th: "จัดการบิลรายเดือน",
      es: "Gestiona facturas mensuales",
      zh: "管理每月订阅",
    },
    iconBg: "bg-[#f59e0b]/14",
    iconColor: "text-[#fbbf24]",
  },
  {
    id: "goals",
    href: "/app/goals",
    icon: Target,
    title: { tr: "Hedeflerim", en: "Goals", ru: "Цели", th: "เป้าหมาย", es: "Metas", zh: "目标" },
    desc: {
      tr: "Bütçe limiti kur, ilerlemeyi gör",
      en: "Set budget limits, track progress",
      ru: "Лимиты бюджета и прогресс",
      th: "ตั้งงบและติดตามความคืบหน้า",
      es: "Define límites y avance",
      zh: "设定预算并跟踪进度",
    },
    iconBg: "bg-[#22c55e]/14",
    iconColor: "text-[#86efac]",
  },
  {
    id: "tasks",
    href: "/app/tasks",
    icon: CheckSquare,
    title: { tr: "Görevlerim", en: "Tasks", ru: "Задания", th: "ภารกิจ", es: "Tareas", zh: "任务" },
    desc: {
      tr: "Günlük ve haftalık görevleri tamamla, ödül kazan",
      en: "Complete daily & weekly quests, earn rewards",
      ru: "Ежедневные и недельные квесты с наградами",
      th: "ภารกิจรายวันและรายสัปดาห์ รับรางวัล",
      es: "Completa misiones diarias y semanales",
      zh: "完成每日与每周任务，赢取奖励",
    },
    iconBg: "bg-[#a855f7]/14",
    iconColor: "text-[#d8b4fe]",
  },
  {
    id: "rewards",
    href: "/app/rewards",
    icon: Gift,
    title: { tr: "Ödüllerim", en: "Rewards", ru: "Награды", th: "รางวัล", es: "Recompensas", zh: "奖励" },
    desc: {
      tr: "Kazandığın hazine ve seri ödülleri",
      en: "Treasure chests and streak rewards",
      ru: "Сокровища и награды за серию",
      th: "หีบสมบัติและรางวัลสตรีค",
      es: "Cofres y recompensas por racha",
      zh: "宝箱与连胜奖励",
    },
    iconBg: "bg-[#ec4899]/14",
    iconColor: "text-[#f9a8d4]",
  },
];

function QuickCategoriesGrid({ locale }: { locale: YumoLocale }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {QUICK_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.id}
            href={cat.href}
            className="group flex flex-col items-center gap-2 py-1 text-center"
          >
            <span
              className={cn(
                "grid h-14 w-14 place-items-center rounded-full border border-[var(--app-border)] shadow-[var(--app-shadow-card)] transition group-hover:-translate-y-0.5 group-active:scale-95",
                cat.iconBg,
              )}
            >
              <Icon className={cn("h-5 w-5", cat.iconColor)} strokeWidth={2.2} />
            </span>
            <span className="text-[11.5px] font-semibold leading-tight text-[var(--app-text-secondary)]">
              {pickText(cat.title, locale)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { locale } = useAppLocale();
  const yumoLocale = locale as YumoLocale;
  const { error: profileError, refresh } = useAppProfile();

  /* Track push deep-link clicks (fallback when SW notificationclick misses) */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const scenarioId = params.get("scenario");
    if (scenarioId) {
      fetch("/api/push/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      }).catch(() => {});
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (profileError) {
    return (
      <AppShell>
        <ErrorState
          message={yumoLocale === "tr" ? "Dashboard yüklenemedi." : "Dashboard could not be loaded."}
          onRetry={() => refresh().then(() => {})}
        />
      </AppShell>
    );
  }

  return (
    <AppShell className="max-w-[430px] lg:max-w-[1440px]">
      <div className="-mx-3 min-h-[100svh] overflow-hidden bg-[var(--app-bg-dashboard)] px-3 pb-28 pt-2 text-[var(--app-text-primary)] sm:-mx-4 sm:px-4 lg:m-0 lg:min-h-[calc(100svh-3rem)] lg:rounded-[36px] lg:border lg:border-[var(--app-border)] lg:p-6 lg:pb-8">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(180deg,rgba(255,200,150,0.06),transparent_60%)]" />
        <div className="relative mx-auto max-w-[1320px] space-y-5 lg:space-y-6">
          <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
            <div className="order-1 space-y-5 lg:col-span-8 lg:space-y-6">
              <MonthlySummaryCard locale={yumoLocale} />
              {/* Yumbie room — moved out of the global topbar band into the
                  Ledger position. The insight sheet portals to <body>, so the
                  rounded clip here is safe. */}
              <div className="overflow-hidden rounded-[24px] border border-[var(--app-border)]">
                <YumbieWorkspaceGate />
              </div>
              <QuickCategoriesGrid locale={yumoLocale} />
              <SpendingCategoryCard locale={yumoLocale} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
