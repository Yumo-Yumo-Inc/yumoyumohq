/**
 * Radar: client-side synthesis of actionable alerts from the computed
 * insights aggregate and detected subscription proposals.
 *
 * The radar is intentionally derived-on-the-fly (no round-trip):
 *   - it reacts immediately to newly cached receipts,
 *   - dismissed alerts are remembered locally via `localStorage`,
 *   - durable notifications still flow through the server-backed
 *     notifications system; the radar is the at-a-glance surface.
 */

import type {
  AnomalySignal,
  BudgetUsageEntry,
  InsightsAggregate,
} from "@/lib/insights/types";
import type { SubscriptionProposal } from "@/lib/subscriptions/detect";

export type RadarSeverity = "info" | "warning" | "alert";

export type RadarCategory =
  | "budget_overrun"
  | "anomaly"
  | "new_subscription"
  | "impulse_rise"
  | "forecast"
  | "income_ratio"
  | "goal_risk";

export interface RadarAlert {
  id: string;
  category: RadarCategory;
  severity: RadarSeverity;
  title: string;
  detail: string;
  /** Optional numeric context (amount, percentage, etc.) for UI presentation. */
  metric?: number;
  /** Target href for drill-down from dashboard/carousel. */
  href?: string;
}

export type RadarLocale = "tr" | "en" | "ru" | "th" | "es" | "zh";

export interface RadarContext {
  aggregate: InsightsAggregate;
  subscriptionProposals: SubscriptionProposal[];
  locale: RadarLocale;
}

function pickR(locale: RadarLocale, tr: string, en: string, ru: string, th: string, es: string, zh: string): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function overBudgetAlerts(entries: BudgetUsageEntry[], locale: RadarLocale): RadarAlert[] {
  const out: RadarAlert[] = [];
  for (const entry of entries) {
    const ratio = entry.limit > 0 ? entry.spent / entry.limit : 0;
    if (ratio >= 1) {
      out.push({
        id: `budget_over:${entry.category}`,
        category: "budget_overrun",
        severity: "alert",
        title: pickR(
          locale,
          `${entry.category} bütçesi aşıldı`,
          `${entry.category} budget exceeded`,
          `Бюджет «${entry.category}» превышен`,
          `งบ ${entry.category} เกินแล้ว`,
          `Presupuesto de ${entry.category} superado`,
          `${entry.category} 预算已超`,
        ),
        detail: pickR(
          locale,
          `%${Math.round(ratio * 100)} kullanım — ${fmt(entry.spent)} / ${fmt(entry.limit)}`,
          `${Math.round(ratio * 100)}% used — ${fmt(entry.spent)} / ${fmt(entry.limit)}`,
          `${Math.round(ratio * 100)}% использовано — ${fmt(entry.spent)} / ${fmt(entry.limit)}`,
          `ใช้ไป ${Math.round(ratio * 100)}% — ${fmt(entry.spent)} / ${fmt(entry.limit)}`,
          `${Math.round(ratio * 100)}% usado — ${fmt(entry.spent)} / ${fmt(entry.limit)}`,
          `已使用 ${Math.round(ratio * 100)}% — ${fmt(entry.spent)} / ${fmt(entry.limit)}`,
        ),
        metric: ratio,
        href: "/app/insights?tab=plan",
      });
    } else if (ratio >= 0.8) {
      out.push({
        id: `budget_watch:${entry.category}`,
        category: "budget_overrun",
        severity: "warning",
        title: pickR(
          locale,
          `${entry.category} bütçesi eşiğe yakın`,
          `${entry.category} budget near limit`,
          `Бюджет «${entry.category}» близок к лимиту`,
          `งบ ${entry.category} ใกล้เพดาน`,
          `Presupuesto de ${entry.category} cerca del límite`,
          `${entry.category} 预算接近上限`,
        ),
        detail: pickR(
          locale,
          `%${Math.round(ratio * 100)} kullanım`,
          `${Math.round(ratio * 100)}% used`,
          `${Math.round(ratio * 100)}% использовано`,
          `ใช้ไป ${Math.round(ratio * 100)}%`,
          `${Math.round(ratio * 100)}% usado`,
          `已使用 ${Math.round(ratio * 100)}%`,
        ),
        metric: ratio,
        href: "/app/insights?tab=plan",
      });
    }
  }
  return out;
}

function anomalyAlerts(signals: AnomalySignal[], _locale: RadarLocale): RadarAlert[] {
  return signals.slice(0, 5).map((signal) => ({
    id: `anomaly:${signal.id}`,
    category: "anomaly",
    severity: signal.severity === "alert" ? "alert" : signal.severity === "warning" ? "warning" : "info",
    title: signal.title,
    detail: signal.detail,
    metric: undefined,
    href: "/app/insights?tab=behavior",
  }));
}

function subscriptionAlerts(
  proposals: SubscriptionProposal[],
  locale: RadarLocale
): RadarAlert[] {
  const cadenceLabel = (cadence: SubscriptionProposal["cadence"]) => {
    if (cadence === "weekly") return pickR(locale, "hafta", "wk", "нед.", "สัปดาห์", "sem.", "周");
    if (cadence === "yearly") return pickR(locale, "yıl", "yr", "год", "ปี", "año", "年");
    return pickR(locale, "ay", "mo", "мес.", "เดือน", "mes", "月");
  };

  return proposals.slice(0, 2).map((proposal) => ({
    id: `sub_new:${proposal.merchantName}`,
    category: "new_subscription",
    severity: "info",
    title: pickR(
      locale,
      `Yeni abonelik: ${proposal.merchantName}`,
      `New subscription: ${proposal.merchantName}`,
      `Новая подписка: ${proposal.merchantName}`,
      `การสมัครสมาชิกใหม่: ${proposal.merchantName}`,
      `Nueva suscripción: ${proposal.merchantName}`,
      `新订阅：${proposal.merchantName}`,
    ),
    detail: `${fmt(proposal.amount)} ${proposal.currency} / ${cadenceLabel(proposal.cadence)}`,
    metric: proposal.confidence,
    href: "/app/insights?tab=plan",
  }));
}

function impulseAlert(aggregate: InsightsAggregate, locale: RadarLocale): RadarAlert | null {
  const score = aggregate.impulseScore?.score ?? 0;
  if (score >= 70) {
    return {
      id: "impulse_high",
      category: "impulse_rise",
      severity: "alert",
      title: pickR(
        locale,
        "İmpuls skoru yüksek",
        "Impulse score is high",
        "Высокий импульс-скор",
        "คะแนนหุนหันสูง",
        "Puntaje de impulso alto",
        "冲动消费指数偏高",
      ),
      detail: pickR(
        locale,
        `${score}/100 — son dönemde dürtüsel harcama artıyor.`,
        `${score}/100 — impulsive spend has been rising.`,
        `${score}/100 — импульсивные траты растут.`,
        `${score}/100 — การใช้จ่ายตามอารมณ์เพิ่มขึ้น`,
        `${score}/100 — el gasto impulsivo está subiendo.`,
        `${score}/100 — 冲动消费近期上升。`,
      ),
      metric: score,
      href: "/app/insights?tab=behavior",
    };
  }
  if (score >= 55) {
    return {
      id: "impulse_rise",
      category: "impulse_rise",
      severity: "warning",
      title: pickR(
        locale,
        "İmpuls skoru yükseliyor",
        "Impulse score climbing",
        "Импульс-скор растёт",
        "คะแนนหุนหันกำลังเพิ่ม",
        "Puntaje de impulso subiendo",
        "冲动消费指数上升",
      ),
      detail: `${score}/100`,
      metric: score,
      href: "/app/insights?tab=behavior",
    };
  }
  return null;
}

function forecastAlert(aggregate: InsightsAggregate, locale: RadarLocale): RadarAlert | null {
  const fc = aggregate.forecast;
  if (!fc || fc.overBudgetRisk < 0.8) return null;
  return {
    id: "forecast_overrun_risk",
    category: "forecast",
    severity: "alert",
    title: pickR(
      locale,
      "Ay sonu aşım riski",
      "Month-end overrun risk",
      "Риск превышения к концу месяца",
      "เสี่ยงเกินงบสิ้นเดือน",
      "Riesgo de exceso a fin de mes",
      "月末超支风险",
    ),
    detail: pickR(
      locale,
      `Projeksiyon ${fmt(fc.projectedMonthEnd)}.`,
      `Projected ${fmt(fc.projectedMonthEnd)}.`,
      `Прогноз ${fmt(fc.projectedMonthEnd)}.`,
      `คาดการณ์ ${fmt(fc.projectedMonthEnd)}`,
      `Proyectado ${fmt(fc.projectedMonthEnd)}.`,
      `预计 ${fmt(fc.projectedMonthEnd)}。`,
    ),
    metric: fc.overBudgetRisk,
    href: "/app/insights?tab=plan",
  };
}

export function buildRadarAlerts(context: RadarContext): RadarAlert[] {
  const { aggregate, subscriptionProposals, locale } = context;
  const alerts: RadarAlert[] = [];
  alerts.push(...overBudgetAlerts(aggregate.budgetUsage ?? [], locale));
  alerts.push(...anomalyAlerts(aggregate.anomalies ?? [], locale));
  alerts.push(...subscriptionAlerts(subscriptionProposals, locale));
  const impulse = impulseAlert(aggregate, locale);
  if (impulse) alerts.push(impulse);
  const forecast = forecastAlert(aggregate, locale);
  if (forecast) alerts.push(forecast);

  const severityWeight: Record<RadarSeverity, number> = { alert: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityWeight[a.severity] - severityWeight[b.severity]);
  return alerts;
}

// ---------- dismissal persistence ----------

const DISMISS_KEY = "yumo.radar.dismissed.v1";

export function loadDismissedAlerts(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { ids: string[]; ts: number } | null;
    if (!parsed || !Array.isArray(parsed.ids)) return new Set();
    // Expire dismissals older than 7 days so they resurface if still relevant.
    if (Date.now() - parsed.ts > 7 * 24 * 60 * 60 * 1000) return new Set();
    return new Set(parsed.ids);
  } catch {
    return new Set();
  }
}

export function saveDismissedAlerts(ids: Iterable<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DISMISS_KEY,
      JSON.stringify({ ids: Array.from(ids), ts: Date.now() })
    );
  } catch {
    // localStorage quota or disabled – ignore.
  }
}
