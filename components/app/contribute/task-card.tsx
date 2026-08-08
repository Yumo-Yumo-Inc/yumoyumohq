"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { HelpCircle, Pencil, Check, Ban } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { AnswerKind, ContributionTask } from "@/lib/contribution/client";

/**
 * One identification task, presented as the single focused object on screen.
 *
 * Design intent (yumo-design): this is a "value" surface — the raw receipt string is the
 * evidence, set in mono so it reads like the receipt itself; the merchant + "N fişte
 * geçiyor" eyebrow is the honest impact multiplier (the heart of feeling a genuine
 * contribution); the options are large, calm touch targets. Flow regime — fast, no wall
 * of boxes. "Bilmiyorum" is a first-class, shame-free answer.
 */

export interface TaskAnswer {
  kind: AnswerKind;
  canonicalId?: string | null;
  freeText?: string | null;
}

interface TaskCardProps {
  task: ContributionTask;
  onAnswer: (answer: TaskAnswer) => void;
  disabled?: boolean;
}

function formatPrice(value: number, currency: string | null, locale: string): string {
  const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  const n = value.toLocaleString(locale === "tr" ? "tr-TR" : "en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency && !symbol ? `${n} ${currency}` : `${symbol}${n}`;
}

export function TaskCard({ task, onAnswer, disabled = false }: TaskCardProps) {
  const { t, locale } = useAppLocale();
  const reduce = useReducedMotion();
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset transient UI whenever a new task takes the stage.
  useEffect(() => {
    setOtherOpen(false);
    setOtherText("");
    setSelected(null);
  }, [task.id]);

  useEffect(() => {
    if (otherOpen) inputRef.current?.focus();
  }, [otherOpen]);

  const pickable = task.candidates.filter((c) => c.canonicalId);

  const choose = (canonicalId: string) => {
    if (disabled) return;
    setSelected(canonicalId);
    onAnswer({ kind: "pick", canonicalId });
  };

  const submitOther = () => {
    const text = otherText.trim();
    if (!text || disabled) return;
    onAnswer({ kind: "other", freeText: text });
  };

  return (
    <Surface variant="value" accent="gold" glow radius="xl" className="w-full">
      <div className="px-5 pb-5 pt-6 sm:px-6">
        {/* Eyebrow: merchant + the honest impact multiplier */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {task.merchantLabel && (
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--app-text-muted)" }}
            >
              {task.merchantLabel}
            </span>
          )}
          {task.rowCount > 1 && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
              style={{
                color: "var(--app-gold-light)",
                background: "var(--app-gold-glow)",
                border: "1px solid var(--app-gold-border)",
              }}
            >
              {t("contribute.card.appearsIn", { count: task.rowCount })}
            </span>
          )}
        </div>

        {/* The evidence — the raw receipt string, mono, large */}
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h2
            className="font-mono text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]"
            style={{ color: "var(--app-text-primary)" }}
          >
            {task.rawText}
          </h2>
          {task.priceMedian != null && task.priceMedian > 0 && (
            <span
              className="shrink-0 font-mono text-[15px] font-semibold tabular-nums"
              style={{ color: "var(--app-text-secondary)" }}
            >
              {formatPrice(task.priceMedian, task.currency, locale)}
            </span>
          )}
        </div>

        {/* Question */}
        <p
          className="mt-5 text-[15px] font-medium"
          style={{ color: "var(--app-text-secondary)" }}
        >
          {t("contribute.card.question")}
        </p>

        {/* Options */}
        <div className="mt-3 flex flex-col gap-2.5">
          {pickable.map((c, i) => {
            const isSel = selected === c.canonicalId;
            return (
              <motion.button
                key={c.canonicalId}
                type="button"
                disabled={disabled}
                onClick={() => choose(c.canonicalId as string)}
                whileTap={reduce ? undefined : { scale: 0.985 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="group relative flex items-center gap-3 rounded-[var(--app-radius-lg)] px-4 py-3.5 text-left disabled:opacity-60"
                style={{
                  background: isSel
                    ? "var(--surface-grad-value)"
                    : "var(--surface-grad-elevated)",
                  boxShadow: isSel
                    ? "inset 0 0 0 1px var(--app-gold-border), 0 6px 22px var(--app-gold-glow)"
                    : "inset 0 0 0 1px var(--app-border)",
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums transition-colors"
                  style={{
                    color: isSel ? "#0F1117" : "var(--app-text-muted)",
                    background: isSel ? "var(--app-gold-light)" : "var(--app-bg-surface3)",
                  }}
                >
                  {isSel ? <Check size={14} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[15px] font-medium leading-snug"
                    style={{ color: "var(--app-text-primary)" }}
                  >
                    {c.label}
                  </span>
                  {c.reference && (
                    <span
                      className="mt-0.5 block text-[12px] tabular-nums"
                      style={{ color: "var(--app-text-muted)" }}
                    >
                      {c.reference}
                    </span>
                  )}
                </span>
              </motion.button>
            );
          })}

          {/* Other — opens an inline text field */}
          <AnimatePresence initial={false} mode="wait">
            {otherOpen ? (
              <motion.div
                key="other-input"
                initial={reduce ? undefined : { opacity: 0, height: 0 }}
                animate={reduce ? undefined : { opacity: 1, height: "auto" }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-center gap-2 rounded-[var(--app-radius-lg)] px-3 py-2"
                  style={{ boxShadow: "inset 0 0 0 1px var(--app-gold-border)" }}
                >
                  <input
                    ref={inputRef}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitOther()}
                    placeholder={t("contribute.card.otherPlaceholder")}
                    maxLength={80}
                    disabled={disabled}
                    className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                    style={{ color: "var(--app-text-primary)" }}
                  />
                  <button
                    type="button"
                    onClick={submitOther}
                    disabled={disabled || !otherText.trim()}
                    className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40"
                    style={{ color: "#0F1117", background: "var(--app-gold-light)" }}
                  >
                    {t("contribute.card.otherSubmit")}
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                key="other-btn"
                type="button"
                disabled={disabled}
                onClick={() => setOtherOpen(true)}
                className="flex items-center gap-3 rounded-[var(--app-radius-lg)] px-4 py-3 text-left disabled:opacity-60"
                style={{ boxShadow: "inset 0 0 0 1px var(--app-border)" }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "var(--app-bg-surface3)", color: "var(--app-text-muted)" }}
                >
                  <Pencil size={13} />
                </span>
                <span className="text-[15px] font-medium" style={{ color: "var(--app-text-secondary)" }}>
                  {t("contribute.card.other")}
                </span>
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* Two ways out, both first-class and shame-free — and they are different answers:
            "Hiçbiri" says the options are wrong and retires them, "Bilmiyorum" says nothing
            about the options at all. Collapsing them would poison whichever one survived. */}
        <div className="mt-4 flex items-center justify-center gap-5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAnswer({ kind: "none" })}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-100 disabled:opacity-40"
            style={{ color: "var(--app-text-muted)", opacity: 0.8 }}
          >
            <Ban size={14} />
            {t("contribute.card.none")}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAnswer({ kind: "unknown" })}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-100 disabled:opacity-40"
            style={{ color: "var(--app-text-muted)", opacity: 0.8 }}
          >
            <HelpCircle size={14} />
            {t("contribute.card.dontKnow")}
          </button>
        </div>
      </div>
    </Surface>
  );
}
