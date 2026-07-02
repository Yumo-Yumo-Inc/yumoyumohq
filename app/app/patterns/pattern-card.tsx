"use client";

import type { CSSProperties, ElementType } from "react";
import { CalendarClock, ChevronRight, Clock3, Droplets, GitBranch, Repeat, Sparkles, Tags, Zap } from "lucide-react";
import type { CachedInsightEventRecord, InsightEventKind } from "@/lib/offline/types";
import {
  getLocalizedPatternMeta,
  getLocalizedRelativeDate,
  getLocalizedStateLabel,
  getPatternNarrative,
  PATTERN_META,
} from "./pattern-config";
import { useAppLocale } from "@/lib/i18n/app-context";

const ICONS: Record<string, ElementType> = {
  impulse_fingerprint: Clock3,
  own_price_track: Tags,
  category_drift: GitBranch,
  past_self: CalendarClock,
  reward_reflex: Sparkles,
  stress_pulse: Zap,
  micro_leak: Droplets,
  ritual_loop: Repeat,
};

export function SkeletonCard() {
  return (
    <div className="pattern-card pattern-skeleton" aria-hidden="true">
      <div className="pattern-skeleton-line is-short" />
      <div className="pattern-skeleton-line is-title" />
      <div className="pattern-skeleton-line" />
      <div className="pattern-proof-row">
        <div className="pattern-skeleton-proof" />
        <div className="pattern-skeleton-proof" />
        <div className="pattern-skeleton-proof" />
      </div>
    </div>
  );
}

type PatternCardProps = {
  kind: InsightEventKind;
  event: CachedInsightEventRecord | null;
  onTap: (kind: InsightEventKind, event: CachedInsightEventRecord | null) => void;
};

export function PatternCard({ kind, event, onTap }: PatternCardProps) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;

  const baseMeta = PATTERN_META[kind];
  const meta = getLocalizedPatternMeta(kind, locale);
  const narrative = getPatternNarrative(kind, event, locale);
  const Icon = ICONS[kind];
  const age = event ? getLocalizedRelativeDate(event.detectedAt, locale) : null;
  const stateValue = event?.state ?? "waiting";
  const stateText = getLocalizedStateLabel(event?.state, locale);
  const style = {
    "--pattern-accent": baseMeta.accent,
    "--pattern-soft": baseMeta.softAccent,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={() => onTap(kind, event)}
      className={`pattern-card ${event ? "" : "is-empty"}`}
      style={style}
      aria-label={`${meta.label}: ${narrative.headline}`}
    >
      <span className="pattern-card-accent" aria-hidden="true" />

      <div className="pattern-card-top">
        <span className="pattern-card-icon" aria-hidden="true">
          <Icon size={16} strokeWidth={2} />
        </span>
        <span className="pattern-card-eyebrow">{meta.label}</span>
        <span className={`pattern-card-state is-state-${stateValue}`}>{stateText}</span>
      </div>

      <div className="pattern-card-title" role="heading" aria-level={3}>{narrative.headline}</div>
      <p className="pattern-card-read">{narrative.read}</p>

      <div
        className="pattern-proof-row"
        aria-label={l("Kanıtlar", "Evidence", "Доказательства", "หลักฐาน", "Evidencia", "证据")}
      >
        {narrative.proof.slice(0, 3).map((proof) => (
          <span key={`${proof.label}-${proof.value}`} className={`pattern-proof ${proof.tone ?? ""}`}>
            <span>{proof.label}</span>
            <strong>{proof.value}</strong>
          </span>
        ))}
      </div>

      {narrative.suggestedExperiment && (
        <div className="pattern-card-layer">
          <span>{l("Dene", "Try", "Попробуй", "ลองทำ", "Prueba", "试试")}</span>
          <p>{narrative.suggestedExperiment}</p>
        </div>
      )}

      <div className="pattern-card-footer">
        <span className="pattern-card-meta">
          {event
            ? `${narrative.confidenceLabel} ${l("güven", "confidence", "уверенность", "ความมั่นใจ", "confianza", "置信度")} · ${age}`
            : meta.emptyHint}
        </span>
        <span className="pattern-card-action" aria-hidden="true">
          {l("Derine in", "Dive in", "Подробнее", "ลงลึก", "Explorar", "深入")}
          <ChevronRight size={14} strokeWidth={2.2} />
        </span>
      </div>
    </button>
  );
}
