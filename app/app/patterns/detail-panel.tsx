"use client";

import { useEffect, useState, type CSSProperties, type ElementType } from "react";
import {
  BellRing,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Droplets,
  GitBranch,
  MessageSquareText,
  Repeat,
  Sparkles,
  Tags,
  X,
  Zap,
} from "lucide-react";
import type { CachedInsightEventRecord, InsightEventKind } from "@/lib/offline/types";
import {
  formatCurrencyValue,
  getLocalizedPatternMeta,
  getLocalizedRelativeDate,
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

type DetailPanelProps = {
  open: boolean;
  kind: InsightEventKind | null;
  event: CachedInsightEventRecord | null;
  onClose: () => void;
  onDismiss: (eventId: string) => void;
  onCommit: (eventId: string) => void;
};

export function DetailPanel({ open, kind, event, onClose, onDismiss, onCommit }: DetailPanelProps) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const baseMeta = kind ? PATTERN_META[kind] : null;
  const meta = kind ? getLocalizedPatternMeta(kind, locale) : null;
  const narrative = kind ? getPatternNarrative(kind, event, locale) : null;
  const feedbackScope = event?.insightEventId ?? kind ?? "none";
  const [feedbackState, setFeedbackState] = useState<{
    scope: string;
    value: "fit" | "missing" | "wrong" | null;
  }>({ scope: "none", value: null });
  const feedback = feedbackState.scope === feedbackScope ? feedbackState.value : null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!meta || !baseMeta || !kind || !narrative) return null;

  const Icon = ICONS[kind];
  const style = {
    "--pattern-accent": baseMeta.accent,
    "--pattern-soft": baseMeta.softAccent,
  } as CSSProperties;
  const showActions = event && event.state !== "committed";
  const isCommitted = event?.state === "committed";
  const age = event ? getLocalizedRelativeDate(event.detectedAt, locale) : null;
  const impact = event?.monetaryImpact
    ? formatCurrencyValue(event.monetaryImpact, event.currency, { sign: "abs", locale })
    : null;

  return (
    <>
      <div
        className={`pattern-backdrop ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`pattern-sheet ${open ? "is-open" : ""}`}
        style={style}
        aria-hidden={!open}
        role="dialog"
        aria-modal={open}
        aria-label={narrative.headline}
      >
        <div className="pattern-sheet-handle" />

        <div className="pattern-sheet-scroll">
          <div className="pattern-sheet-top">
            <div className="pattern-sheet-kicker">
              <span className="pattern-sheet-icon" aria-hidden="true">
                <Icon size={17} strokeWidth={2.1} />
              </span>
              <span>{meta.label}</span>
              <span className="pattern-sheet-confidence">{narrative.confidenceLabel}</span>
            </div>
            <button type="button" className="pattern-icon-button" onClick={onClose} aria-label={l("Kapat", "Close", "Закрыть", "ปิด", "Cerrar", "关闭")}>
              <X size={17} />
            </button>
          </div>

          <h2 className="pattern-sheet-title">{narrative.headline}</h2>
          <p className="pattern-sheet-read">{narrative.read}</p>

          <div className="pattern-sheet-status">
            <span>{event ? l(`${age} yakalandı`, `Detected ${age}`, `Обнаружено ${age}`, `ตรวจพบเมื่อ ${age}`, `Detectado ${age}`, `${age}检测到`) : l("Bu lens veri bekliyor", "This lens is waiting for data", "Эта линза ждет данные", "เลนส์นี้กำลังรอข้อมูล", "Esta lente está esperando datos", "该视角正在等待数据")}</span>
            {impact && <strong>{impact} {l("tahmini etki", "estimated impact", "оценочное влияние", "ผลกระทบโดยประมาณ", "impacto estimado", "预估影响")}</strong>}
          </div>

          <section className="pattern-sheet-section">
            <div className="pattern-section-heading">{l("Kanıt", "Evidence", "Доказательства", "หลักฐาน", "Evidencia", "证据")}</div>
            <div className="pattern-sheet-proof-grid">
              {narrative.proof.map((proof) => (
                <div key={`${proof.label}-${proof.value}`} className={`pattern-sheet-proof ${proof.tone ?? ""}`}>
                  <span>{proof.label}</span>
                  <strong>{proof.value}</strong>
                </div>
              ))}
            </div>
          </section>

          {(narrative.humanLayer || narrative.support) && (
            <section className="pattern-sheet-section">
              <div className="pattern-section-heading">{l("Okuma", "Reading", "Разбор", "การอ่าน", "Lectura", "解读")}</div>
              <div className="pattern-sheet-story">
                {narrative.humanLayer && <p>{narrative.humanLayer}</p>}
                {narrative.support && <p>{narrative.support}</p>}
              </div>
            </section>
          )}

          {narrative.suggestedExperiment && (
            <section className="pattern-sheet-section">
              <div className="pattern-section-heading">{l("Küçük deney", "Small experiment", "Небольшой эксперимент", "การทดลองเล็ก ๆ", "Experimento pequeño", "小实验")}</div>
              <p>{narrative.suggestedExperiment}</p>
            </section>
          )}

          {event && (
            <section className="pattern-sheet-section">
              <div className="pattern-section-heading">{l("Geri bildirim", "Feedback", "Обратная связь", "ข้อเสนอแนะ", "Comentarios", "反馈")}</div>
              <div className="pattern-feedback-row">
                <button
                  type="button"
                  className={feedback === "fit" ? "is-selected" : ""}
                  onClick={() => setFeedbackState({ scope: feedbackScope, value: "fit" })}
                >
                  <Check size={13} />
                  {l("Doğru", "Fits", "Подходит", "ตรง", "Encaja", "吻合")}
                </button>
                <button
                  type="button"
                  className={feedback === "missing" ? "is-selected" : ""}
                  onClick={() => setFeedbackState({ scope: feedbackScope, value: "missing" })}
                >
                  <MessageSquareText size={13} />
                  {l("Eksik bağlam", "Missing context", "Не хватает контекста", "บริบทยังไม่พอ", "Falta contexto", "缺少背景")}
                </button>
                <button
                  type="button"
                  className={feedback === "wrong" ? "is-selected" : ""}
                  onClick={() => setFeedbackState({ scope: feedbackScope, value: "wrong" })}
                >
                  <X size={13} />
                  {l("Ben değilim", "Not me", "Не про меня", "ไม่ใช่ฉัน", "No soy yo", "不是我")}
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="pattern-sheet-footer">
          {showActions && (
            <div className="pattern-action-row">
              <button
                type="button"
                className="pattern-secondary-button"
                onClick={() => onDismiss(event.insightEventId)}
              >
                <X size={15} />
                {l("Uymadı", "Doesn't fit", "Не подходит", "ไม่ตรง", "No encaja", "不匹配")}
              </button>
              <button
                type="button"
                className="pattern-primary-button"
                onClick={() => onCommit(event.insightEventId)}
              >
                <BellRing size={15} />
                {narrative.primaryAction}
              </button>
            </div>
          )}

          {isCommitted && (
            <div className="pattern-committed-state">
              <Check size={15} />
              {l("Takipte. Bu kalıp değişirse tekrar haber vereceğiz.", "Tracked. We'll notify you again if this pattern changes.", "Отслеживается. Мы снова сообщим, если паттерн изменится.", "กำลังติดตามอยู่ หากรูปแบบนี้เปลี่ยน เราจะแจ้งอีกครั้ง", "En seguimiento. Te avisaremos si este patrón cambia.", "已在跟踪中。若该模式变化，我们会再次通知你。")}
            </div>
          )}

          {!event && (
            <button type="button" className="pattern-primary-button is-full" onClick={onClose}>
              {narrative.secondaryAction}
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
