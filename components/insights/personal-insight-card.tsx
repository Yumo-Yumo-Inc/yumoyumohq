"use client";

/**
 * PersonalInsightCard — polymorphic card for the 4 personal-behavior engines.
 *
 * Renders a `DetectedInsight` (from the orchestrator) as a self-contained card
 * with kind-specific visual evidence, monetary impact, confidence, and three
 * action buttons: Commit (spawns a commitment), Dismiss, Snooze.
 *
 * Design principles (from the Personal Finance OS plan):
 *   - Every card = one non-obvious insight + one actionable commitment
 *   - Zero free-text input from user — all actions are single-tap
 *   - Monetary impact only shown when deterministically computable
 *   - Confidence shown as a subtle bar, not a scary percentage
 */

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Droplets,
  Fingerprint,
  Layers,
  Repeat,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { ThemeCard } from "@/components/app/theme-card";
import { formatCurrency } from "@/lib/insights/format";
import type { DetectedInsight, CommitmentTemplate } from "@/lib/insights/personal-behavior/types";
import type { InsightEventKind } from "@/lib/offline/types";

// ─── Props ───────────────────────────────────────────────────────────────────

export type CardLocale = "tr" | "en" | "ru" | "th" | "es" | "zh";

export interface PersonalInsightCardProps {
  insight: DetectedInsight;
  locale?: CardLocale;
  accountLevel?: number;
  /** Called when user accepts the suggested commitment. Returning `false` keeps the button active. */
  onCommit?: (insight: DetectedInsight, template: CommitmentTemplate) => Promise<void>;
  /** Called when user dismisses the insight permanently. */
  onDismiss?: (id: string) => Promise<void>;
  /** Called when user snoozes the insight (hides for 7 days). */
  onSnooze?: (id: string) => Promise<void>;
}

function pick(locale: CardLocale, tr: string, en: string, ru: string, th: string, es: string, zh: string): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

// ─── Kind metadata ───────────────────────────────────────────────────────────

interface KindMeta {
  icon: typeof Fingerprint;
  label: Record<CardLocale, string>;
  accentColor: string;
}

const KIND_META: Record<InsightEventKind, KindMeta> = {
  own_price_track: {
    icon: TrendingUp,
    label: {
      tr: "Fiyat seyri",
      en: "Price track",
      ru: "Динамика цены",
      th: "การติดตามราคา",
      es: "Evolución de precio",
      zh: "价格走势",
    },
    accentColor: "var(--app-warn, #F59E0B)",
  },
  impulse_fingerprint: {
    icon: Fingerprint,
    label: {
      tr: "Dürtü parmak izi",
      en: "Impulse window",
      ru: "Окно импульсов",
      th: "ช่วงเวลาซื้อหุนหัน",
      es: "Ventana impulsiva",
      zh: "冲动消费窗口",
    },
    accentColor: "var(--app-danger, #F87171)",
  },
  category_drift: {
    icon: Layers,
    label: {
      tr: "Kategori kayması",
      en: "Category drift",
      ru: "Смещение категории",
      th: "การเลื่อนหมวดหมู่",
      es: "Desviación de categoría",
      zh: "类别漂移",
    },
    accentColor: "var(--app-blue, #60A5FA)",
  },
  past_self: {
    icon: UserCheck,
    label: {
      tr: "Geçmiş sene ile kıyaslama",
      en: "Past-self benchmark",
      ru: "Сравнение с прошлым",
      th: "เทียบกับตัวเองในอดีต",
      es: "Comparación con tu pasado",
      zh: "与过去自我对比",
    },
    accentColor: "var(--app-primary, #D6B75B)",
  },
  reward_reflex: {
    icon: Sparkles,
    label: {
      tr: "Ödül refleksi",
      en: "Reward reflex",
      ru: "Рефлекс награды",
      th: "รีเฟล็กซ์รางวัล",
      es: "Reflejo de recompensa",
      zh: "奖励反射",
    },
    accentColor: "var(--app-warn, #F59E0B)",
  },
  stress_pulse: {
    icon: Zap,
    label: {
      tr: "Stres atışı",
      en: "Stress pulse",
      ru: "Импульс стресса",
      th: "พัลส์ความเครียด",
      es: "Pulso de estrés",
      zh: "压力脉冲",
    },
    accentColor: "var(--app-danger, #F87171)",
  },
  micro_leak: {
    icon: Droplets,
    label: {
      tr: "Mikro sızıntı",
      en: "Micro leak",
      ru: "Микроутечка",
      th: "การรั่วไหลย่อย",
      es: "Microfuga",
      zh: "微小漏损",
    },
    accentColor: "var(--app-blue, #60A5FA)",
  },
  ritual_loop: {
    icon: Repeat,
    label: {
      tr: "Ritüel döngüsü",
      en: "Ritual loop",
      ru: "Ритуальный цикл",
      th: "วงจรพิธีกรรม",
      es: "Bucle ritual",
      zh: "仪式循环",
    },
    accentColor: "var(--app-primary, #D6B75B)",
  },
};

// ─── Main component ───────────────────────────────────────────────────────────

export function PersonalInsightCard({
  insight,
  locale = "tr",
  accountLevel = 1,
  onCommit,
  onDismiss,
  onSnooze,
}: PersonalInsightCardProps) {
  const [committing, setCommitting] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const [committed, setCommitted] = useState(false);

  if (snoozed || committed) return null;

  const meta = KIND_META[insight.kind];
  const Icon = meta.icon;
  const suggestedCommitment =
    insight.suggestedCommitment ??
    // Also check the serialised payload path (for events read from IndexedDB)
    (insight.payload?.suggestedCommitment as CommitmentTemplate | null | undefined) ??
    null;

  const hasCommitment = !!suggestedCommitment && !!onCommit;
  const hasMoney =
    insight.monetaryImpact != null &&
    Math.abs(insight.monetaryImpact) >= 1 &&
    insight.currency;

  const handleCommit = async () => {
    if (!suggestedCommitment || !onCommit || committing) return;
    setCommitting(true);
    try {
      await onCommit(insight, suggestedCommitment);
      setCommitted(true);
    } catch (err) {
      console.error("[PersonalInsightCard] commit failed", err);
    } finally {
      setCommitting(false);
    }
  };

  const handleDismiss = async () => {
    if (dismissing) return;
    setDismissing(true);
    try {
      await onDismiss?.(insight.id);
    } catch (err) {
      console.error("[PersonalInsightCard] dismiss failed", err);
    } finally {
      setDismissing(false);
    }
  };

  const handleSnooze = async () => {
    try {
      await onSnooze?.(insight.id);
      setSnoozed(true);
    } catch (err) {
      console.error("[PersonalInsightCard] snooze failed", err);
    }
  };

  return (
    <ThemeCard accountLevel={accountLevel} className="p-5">
      <div className="space-y-4">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `color-mix(in srgb, ${meta.accentColor} 15%, transparent)`,
              }}
            >
              <Icon className="h-4 w-4" style={{ color: meta.accentColor }} />
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: meta.accentColor }}
            >
              {meta.label[locale]}
            </span>
          </div>

          {/* Confidence indicator */}
          <div className="flex flex-col items-end gap-1">
            <span
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ color: "var(--app-text-muted)" }}
            >
              {pick(locale, "Güven", "Confidence", "Уверенность", "ความเชื่อมั่น", "Confianza", "可信度")}
            </span>
            <div
              className="h-1.5 w-16 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(insight.confidence * 100)}%`,
                  background: meta.accentColor,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Title + Summary ── */}
        <div>
          <h3
            className="text-base font-semibold leading-snug"
            style={{ color: "var(--app-text-primary)" }}
          >
            {insight.title}
          </h3>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--app-text-secondary)" }}>
            {insight.summary}
          </p>
        </div>

        {/* ── Kind-specific evidence ── */}
        <InsightEvidence insight={insight} locale={locale} />

        {/* ── Monetary impact ── */}
        {hasMoney ? (
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2"
            style={{
              borderColor:
                insight.monetaryImpact! > 0
                  ? "rgba(245,158,11,0.25)"
                  : "rgba(52,211,153,0.25)",
              background:
                insight.monetaryImpact! > 0
                  ? "rgba(245,158,11,0.06)"
                  : "rgba(52,211,153,0.06)",
            }}
          >
            {insight.monetaryImpact! > 0 ? (
              <AlertTriangle
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--app-warn)" }}
              />
            ) : (
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--app-success)" }}
              />
            )}
            <p className="text-xs" style={{ color: "var(--app-text-secondary)" }}>
              {insight.monetaryImpact! > 0
                ? `${pick(
                    locale,
                    "Aylık tahmini etki",
                    "Est. monthly impact",
                    "Прогн. влияние/мес.",
                    "ผลกระทบต่อเดือน (ประมาณ)",
                    "Impacto mensual est.",
                    "预计月度影响",
                  )}: +${formatCurrency(Math.abs(insight.monetaryImpact!), insight.currency!)}`
                : `${pick(
                    locale,
                    "Aylık tahmini kazanç",
                    "Est. monthly gain",
                    "Прогн. экономия/мес.",
                    "เงินที่ประหยัดต่อเดือน (ประมาณ)",
                    "Ahorro mensual est.",
                    "预计月度节省",
                  )}: ${formatCurrency(Math.abs(insight.monetaryImpact!), insight.currency!)}`}
            </p>
          </div>
        ) : null}

        {/* ── Action row ── */}
        <div className="flex items-center gap-2 pt-1">
          {hasCommitment ? (
            <button
              onClick={handleCommit}
              disabled={committing}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{
                background: "var(--app-primary)",
                color: "var(--app-bg, #0F1117)",
              }}
            >
              {committing ? (
                <span className="animate-pulse">
                  {pick(locale, "Kaydediliyor…", "Saving…", "Сохранение…", "กำลังบันทึก…", "Guardando…", "保存中…")}
                </span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {suggestedCommitment!.title}
                </>
              )}
            </button>
          ) : null}

          {/* Snooze */}
          <button
            onClick={handleSnooze}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors"
            style={{
              borderColor: "var(--app-border)",
              background: "transparent",
              color: "var(--app-text-muted)",
            }}
            title={pick(locale, "7 gün ertele", "Snooze 7 days", "Отложить на 7 дней", "เลื่อน 7 วัน", "Posponer 7 días", "推迟 7 天")}
          >
            <Clock className="h-4 w-4" />
          </button>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50"
            style={{
              borderColor: "var(--app-border)",
              background: "transparent",
              color: "var(--app-text-muted)",
            }}
            title={pick(locale, "Yok say", "Dismiss", "Скрыть", "ปิด", "Descartar", "忽略")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </ThemeCard>
  );
}

// ─── Kind-specific evidence panels ───────────────────────────────────────────

function InsightEvidence({
  insight,
  locale,
}: {
  insight: DetectedInsight;
  locale: CardLocale;
}) {
  switch (insight.kind) {
    case "own_price_track":
      return <OwnPriceEvidence payload={insight.payload} currency={insight.currency} locale={locale} />;
    case "impulse_fingerprint":
      return <ImpulseEvidence payload={insight.payload} currency={insight.currency} locale={locale} />;
    case "category_drift":
      return <CategoryDriftEvidence payload={insight.payload} currency={insight.currency} locale={locale} />;
    case "past_self":
      return <PastSelfEvidence payload={insight.payload} currency={insight.currency} locale={locale} />;
    default:
      return null;
  }
}

// ── own_price_track ──

function OwnPriceEvidence({
  payload,
  currency,
  locale,
}: {
  payload: Record<string, unknown>;
  currency: string | null;
  locale: CardLocale;
}) {
  const baseline = payload.baselineUnitPrice as number;
  const latest = payload.latestUnitPrice as number;
  const delta = payload.deltaRatio as number;
  const direction = payload.direction as "up" | "down";
  const sampleSize = payload.sampleSize as number;
  const spanDays = payload.spanDays as number;
  const cur = currency ?? "TRY";

  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-3"
      style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Baseline */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--app-text-muted)" }}>
            {pick(locale, "Önceki medyan", "Prior median", "Прежняя медиана", "ค่ากลางก่อนหน้า", "Mediana previa", "之前中位数")}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
            {formatCurrency(baseline, cur)}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1">
          {direction === "up" ? (
            <ArrowUp className="h-5 w-5" style={{ color: "var(--app-danger, #F87171)" }} />
          ) : (
            <ArrowDown className="h-5 w-5" style={{ color: "var(--app-success)" }} />
          )}
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: direction === "up" ? "var(--app-danger, #F87171)" : "var(--app-success)" }}
          >
            {direction === "up" ? "+" : "-"}{Math.abs(Math.round(delta * 100))}%
          </span>
        </div>

        {/* Latest */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--app-text-muted)" }}>
            {pick(locale, "Son alış", "Latest", "Последняя", "ล่าสุด", "Última", "最新")}
          </p>
          <p
            className="mt-1 text-lg font-semibold tabular-nums"
            style={{
              color: direction === "up" ? "var(--app-danger, #F87171)" : "var(--app-success)",
            }}
          >
            {formatCurrency(latest, cur)}
          </p>
        </div>
      </div>

      <p className="text-[11px]" style={{ color: "var(--app-text-muted)" }}>
        {pick(
          locale,
          `${sampleSize} alış · ${spanDays} günlük veri`,
          `${sampleSize} purchases · ${spanDays}-day span`,
          `${sampleSize} покупок · период ${spanDays} дн.`,
          `${sampleSize} ครั้ง · ช่วง ${spanDays} วัน`,
          `${sampleSize} compras · periodo ${spanDays} días`,
          `${sampleSize} 笔购买 · ${spanDays} 天范围`,
        )}
      </p>
    </div>
  );
}

// ── impulse_fingerprint ──

const HOUR_BUCKET_LABELS: Record<string, Record<CardLocale, string>> = {
  morning: {
    tr: "Sabah (05–11)",
    en: "Morning (5–11)",
    ru: "Утро (05–11)",
    th: "เช้า (05–11)",
    es: "Mañana (5–11)",
    zh: "上午 (5–11)",
  },
  afternoon: {
    tr: "Öğleden sonra (11–17)",
    en: "Afternoon (11–17)",
    ru: "День (11–17)",
    th: "บ่าย (11–17)",
    es: "Tarde (11–17)",
    zh: "下午 (11–17)",
  },
  evening: {
    tr: "Akşam (17–22)",
    en: "Evening (17–22)",
    ru: "Вечер (17–22)",
    th: "เย็น (17–22)",
    es: "Noche (17–22)",
    zh: "傍晚 (17–22)",
  },
  night: {
    tr: "Gece (22–05)",
    en: "Night (22–5)",
    ru: "Ночь (22–05)",
    th: "กลางคืน (22–05)",
    es: "Madrugada (22–5)",
    zh: "深夜 (22–5)",
  },
};

const DAY_LABELS: Record<CardLocale, string[]> = {
  tr: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
  th: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
  es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
};

function ImpulseEvidence({
  payload,
  currency,
  locale,
}: {
  payload: Record<string, unknown>;
  currency: string | null;
  locale: CardLocale;
}) {
  const dow = payload.dayOfWeek as number;
  const bucket = payload.hourBucket as string;
  const wantsShare = payload.wantsShare as number;
  const shareOfWallet = payload.shareOfWallet as number;
  const sampleSize = payload.sampleSize as number;
  const topCategory = payload.topCategory as string | null;
  const wantsSpend = payload.wantsSpend as number;
  const cur = currency ?? "TRY";

  const dayLabel = DAY_LABELS[locale][dow] ?? DAY_LABELS.en[dow];
  const bucketLabel = HOUR_BUCKET_LABELS[bucket]?.[locale] ?? bucket;

  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-3"
      style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4" style={{ color: "var(--app-danger, #F87171)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
          {dayLabel} · {bucketLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat
          label={pick(locale, "Alışveriş", "Receipts", "Покупки", "ใบเสร็จ", "Recibos", "购买次数")}
          value={`${sampleSize}`}
        />
        <MiniStat
          label={pick(locale, "Wants payı", "Wants share", "Доля «хочу»", "ส่วน Wants", "Cuota wants", "Wants 占比")}
          value={`${Math.round(wantsShare * 100)}%`}
          accent="var(--app-danger, #F87171)"
        />
        <MiniStat
          label={pick(locale, "Cüzdandan", "Of wallet", "От кошелька", "จากกระเป๋า", "De la cartera", "钱包占比")}
          value={`${Math.round(shareOfWallet * 100)}%`}
          accent="var(--app-warn)"
        />
      </div>

      {/* Wants-share progress bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: "var(--app-text-muted)" }}>
          <span>{pick(locale, "Wants kategorisi oranı", "Wants category ratio", "Доля категории «хочу»", "สัดส่วนหมวด Wants", "Proporción categoría wants", "Wants 类别占比")}</span>
          <span className="tabular-nums">{formatCurrency(wantsSpend, cur)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.round(wantsShare * 100))}%`,
              background: "var(--app-danger, #F87171)",
            }}
          />
        </div>
      </div>

      {topCategory ? (
        <p className="text-[11px]" style={{ color: "var(--app-text-muted)" }}>
          {pick(
            locale,
            `En yüksek kategori: ${topCategory}`,
            `Top category: ${topCategory}`,
            `Топ-категория: ${topCategory}`,
            `หมวดสูงสุด: ${topCategory}`,
            `Categoría principal: ${topCategory}`,
            `主要类别：${topCategory}`,
          )}
        </p>
      ) : null}
    </div>
  );
}

// ── category_drift ──

function CategoryDriftEvidence({
  payload,
  currency,
  locale,
}: {
  payload: Record<string, unknown>;
  currency: string | null;
  locale: CardLocale;
}) {
  const category = payload.category as string;
  const direction = payload.direction as "up" | "down";
  const recentShare = payload.recentShare as number;
  const baselineShare = payload.baselineShare as number;
  const recentAmount = payload.recentAmount as number;
  const baselineAmount = payload.baselineAmount as number;
  const cur = currency ?? "TRY";

  const isUp = direction === "up";
  const maxShare = Math.max(recentShare, baselineShare);

  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-3"
      style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center gap-2">
        {isUp ? (
          <TrendingUp className="h-4 w-4" style={{ color: "var(--app-danger, #F87171)" }} />
        ) : (
          <TrendingDown className="h-4 w-4" style={{ color: "var(--app-success)" }} />
        )}
        <span className="text-sm font-semibold capitalize" style={{ color: "var(--app-text-primary)" }}>
          {category}
        </span>
      </div>

      {/* Two bars: baseline vs recent */}
      <div className="space-y-2">
        {[
          {
            label: pick(locale, "Önceki 30 gün", "Prior 30 days", "Прошлые 30 дней", "30 วันก่อนหน้า", "30 días anteriores", "之前 30 天"),
            share: baselineShare,
            amount: baselineAmount,
            isPrimary: false,
          },
          {
            label: pick(locale, "Son 30 gün", "Last 30 days", "Последние 30 дней", "30 วันล่าสุด", "Últimos 30 días", "最近 30 天"),
            share: recentShare,
            amount: recentAmount,
            isPrimary: true,
          },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between text-[11px] mb-1">
              <span style={{ color: "var(--app-text-muted)" }}>{row.label}</span>
              <span className="tabular-nums" style={{ color: "var(--app-text-secondary)" }}>
                {formatCurrency(row.amount, cur)} · %{Math.round(row.share * 100)}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${maxShare > 0 ? Math.round((row.share / maxShare) * 100) : 0}%`,
                  background: row.isPrimary
                    ? isUp
                      ? "var(--app-danger, #F87171)"
                      : "var(--app-success)"
                    : "var(--app-text-muted)",
                  opacity: row.isPrimary ? 1 : 0.4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── past_self ──

function PastSelfEvidence({
  payload,
  currency,
  locale,
}: {
  payload: Record<string, unknown>;
  currency: string | null;
  locale: CardLocale;
}) {
  const currentTotal = payload.currentTotal as number;
  const baselineMedian = payload.baselineMedian as number;
  const dayOfMonth = payload.dayOfMonth as number;
  const direction = payload.direction as "over" | "under";
  const deltaRatio = payload.deltaRatio as number;
  const baselineMonths = payload.baselineMonths as Array<{
    year: number;
    month: number;
    total: number;
    count: number;
  }>;
  const cur = currency ?? "TRY";

  const isOver = direction === "over";
  const maxVal = Math.max(currentTotal, baselineMedian);

  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-3"
      style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--app-text-muted)" }}>
        {pick(
          locale,
          `Ayın ${dayOfMonth}. günü itibarıyla karşılaştırma`,
          `Comparison through day ${dayOfMonth} of the month`,
          `Сравнение по ${dayOfMonth}-й день месяца`,
          `เปรียบเทียบจนถึงวันที่ ${dayOfMonth} ของเดือน`,
          `Comparativa hasta el día ${dayOfMonth} del mes`,
          `截至本月第 ${dayOfMonth} 天的比较`,
        )}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: pick(locale, "Önceki 3 ay medyanı", "3-mo median", "Медиана за 3 мес.", "ค่ากลาง 3 เดือน", "Mediana 3 meses", "近 3 月中位数"),
            amount: baselineMedian,
            accent: "var(--app-text-secondary)",
          },
          {
            label: pick(locale, "Bu ay bugüne kadar", "This month MTD", "Этот месяц до сих пор", "เดือนนี้จนถึงปัจจุบัน", "Este mes hasta hoy", "本月至今"),
            amount: currentTotal,
            accent: isOver ? "var(--app-danger, #F87171)" : "var(--app-success)",
          },
        ].map((col) => (
          <div key={col.label}>
            <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--app-text-muted)" }}>
              {col.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: col.accent }}>
              {formatCurrency(col.amount, cur)}
            </p>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${maxVal > 0 ? Math.min(100, Math.round((col.amount / maxVal) * 100)) : 0}%`,
                  background: col.accent,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {isOver ? (
          <TrendingUp className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--app-danger, #F87171)" }} />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--app-success)" }} />
        )}
        <p className="text-xs font-semibold tabular-nums" style={{ color: isOver ? "var(--app-danger, #F87171)" : "var(--app-success)" }}>
          {isOver ? "+" : "-"}{Math.abs(Math.round(deltaRatio * 100))}%
          {" "}
          <span className="font-normal" style={{ color: "var(--app-text-muted)" }}>
            {pick(
              locale,
              `vs. ${baselineMonths.length} ay medyanı`,
              `vs. ${baselineMonths.length}-month median`,
              `vs. медиана за ${baselineMonths.length} мес.`,
              `เทียบกับค่ากลาง ${baselineMonths.length} เดือน`,
              `vs. mediana de ${baselineMonths.length} meses`,
              `vs. ${baselineMonths.length} 月中位数`,
            )}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-lg border px-2 py-1.5"
      style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--app-text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-0.5 text-sm font-semibold tabular-nums"
        style={{ color: accent ?? "var(--app-text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}
