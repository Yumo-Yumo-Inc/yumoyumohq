"use client";

import { Brain, CalendarClock, Clock3, Droplets, GitBranch, Repeat, Sparkles, Tags, Zap } from "lucide-react";
import { type CSSProperties, type ElementType, useMemo } from "react";
import type { CachedInsightEventRecord, InsightEventKind } from "@/lib/offline/types";
import type { ReceiptSummary } from "@/lib/insights/types";
import { getLocalizedPatternMeta, PATTERN_META, portraitSummary, portraitTitle } from "../pattern-config";
import { useAppLocale } from "@/lib/i18n/app-context";
import { EmotionalCashflowRiver } from "./emotional-cashflow-river";

const MAP_ICONS: Record<string, ElementType> = {
  impulse_fingerprint: Clock3,
  own_price_track: Tags,
  category_drift: GitBranch,
  past_self: CalendarClock,
  reward_reflex: Sparkles,
  stress_pulse: Zap,
  micro_leak: Droplets,
  ritual_loop: Repeat,
};

export interface BehaviorPortraitProps {
  patternItems: Array<{ kind: InsightEventKind; event: CachedInsightEventRecord | null }>;
  liveEvents: CachedInsightEventRecord[];
  receipts: ReceiptSummary[];
  onNodeTap: (kind: InsightEventKind, event: CachedInsightEventRecord | null) => void;
}

/** Compute the user's position on the 2-D behavior map.
 *  X = recency (recent receipts → right / Today)
 *  Y = emotional tone (emotional lenses → top / Emotion)
 *
 *  Position is confined to the safe corridor between the node rows
 *  (top: 44%-56%) so it doesn't cover the node buttons. Horizontally it
 *  also snaps to the gaps between the node columns (29-39, 51-61, 73-83).
 */
function useUserMapPosition(
  receipts: ReceiptSummary[],
  liveEvents: CachedInsightEventRecord[]
): { leftPct: number; topPct: number; show: boolean } {
  return useMemo(() => {
    const show = receipts.length > 0 || liveEvents.length > 0;
    if (!show) return { leftPct: 50, topPct: 50, show: false };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = receipts.filter((r) => new Date(r.date) >= sevenDaysAgo).length;
    const recencyRatio = receipts.length > 0 ? recentCount / receipts.length : 0.5;
    // Node columns at 18/40/62/84% — snap to the three gaps between them (29, 51, 73).
    const gaps = [29, 51, 73];
    let leftPct = 29 + recencyRatio * 44; // 29-73
    // Pull gently toward the nearest gap
    leftPct = gaps.reduce((acc, g) => (Math.abs(g - leftPct) < Math.abs(g - acc) ? g : acc), leftPct);

    const emotionalKinds = new Set<InsightEventKind>([
      "impulse_fingerprint",
      "reward_reflex",
      "stress_pulse",
    ]);
    const emotionalCount = liveEvents.filter((e) => emotionalKinds.has(e.kind)).length;
    const emotionalRatio = liveEvents.length > 0 ? emotionalCount / liveEvents.length : 0.5;
    // Safe corridor between the two rows: 44-56%
    const topPct = 44 + (1 - emotionalRatio) * 12;

    return { leftPct, topPct, show: true };
  }, [receipts, liveEvents]);
}

export function BehaviorPortrait({ patternItems, liveEvents, receipts, onNodeTap }: BehaviorPortraitProps) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const userPos = useUserMapPosition(receipts, liveEvents);

  return (
    <section className="patterns-portrait">
      <div className="patterns-portrait-heading">
        <span>
          <Brain size={16} />
          {l("Davranış portresi", "Behavior portrait", "Портрет поведения", "ภาพรวมพฤติกรรม", "Retrato de comportamiento", "行为画像")}
        </span>
        <strong>· {liveEvents.length || "—"} {l("sinyal", "signals", "сигналов", "สัญญาณ", "señales", "个信号")}</strong>
      </div>
      <h2>{portraitTitle(liveEvents, locale)}</h2>
      <p>{portraitSummary(liveEvents, locale)}</p>

      <div
        className="patterns-map"
        role="group"
        aria-label={l("Davranış haritası", "Behavior map", "Карта поведения", "แผนที่พฤติกรรม", "Mapa de comportamiento", "行为地图")}
      >
        <span className="patterns-map-axis is-x" aria-hidden="true" />
        <span className="patterns-map-axis is-y" aria-hidden="true" />
        <span className="patterns-map-label is-top" aria-hidden="true">{l("Duygu", "Emotion", "Эмоция", "อารมณ์", "Emoción", "情绪")}</span>
        <span className="patterns-map-label is-bottom" aria-hidden="true">{l("Rutin", "Routine", "Рутина", "กิจวัตร", "Rutina", "日常")}</span>
        <span className="patterns-map-label is-left" aria-hidden="true">{l("Geçmiş", "Past", "Прошлое", "อดีต", "Pasado", "过去")}</span>
        <span className="patterns-map-label is-right" aria-hidden="true">{l("Bugün", "Today", "Сегодня", "วันนี้", "Hoy", "今天")}</span>

        {patternItems.map(({ kind, event }) => {
          const baseMeta = PATTERN_META[kind];
          const meta = getLocalizedPatternMeta(kind, locale);
          const Icon = MAP_ICONS[kind];
          const style = {
            "--pattern-accent": baseMeta.accent,
            "--pattern-soft": baseMeta.softAccent,
            "--node-bg": event ? baseMeta.softAccent : "rgba(255,255,255,0.045)",
            "--node-opacity": event ? String(0.78 + event.confidence * 0.22) : "0.46",
          } as CSSProperties;
          return (
            <button
              key={kind}
              type="button"
              className={`patterns-map-node ${kind}${event ? "" : " is-empty"}`}
              style={style}
              onClick={() => onNodeTap(kind, event)}
              aria-label={`${meta.label}${event ? ` — ${l("aktif", "active", "активно", "ใช้งาน", "activo", "活跃")}` : ` — ${l("veri yok", "no data", "нет данных", "ไม่มีข้อมูล", "sin datos", "无数据")}`}`}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{meta.shortLabel}</span>
            </button>
          );
        })}

        {userPos.show && (
          <div
            className="patterns-map-user-dot"
            style={{
              left: `${userPos.leftPct}%`,
              top: `${userPos.topPct}%`,
            }}
            aria-label={l("Senin konumun", "Your position", "Твоя позиция", "ตำแหน่งของคุณ", "Tu posición", "你的位置")}
            title={l("Sen", "You", "Вы", "คุณ", "Tú", "你")}
          >
            <span />
          </div>
        )}
      </div>

      <EmotionalCashflowRiver receipts={receipts} />
    </section>
  );
}
