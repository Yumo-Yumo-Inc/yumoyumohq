"use client";

/**
 * Scan Intro Modal
 *
 * An introductory overlay shown before the receipt scanner. It explains, in
 * plain language:
 *   1. The product purpose — managing everyday spending habits.
 *   2. The difference between personal and other expenses.
 *   3. That only receipts from the current month earn rewards (earlier
 *      receipts are still saved into spending history).
 *
 * By default it appears every time the scanner opens. A "don't show again"
 * checkbox lets the user opt out; the caller persists that choice.
 *
 * Visual language matches the scan flow (ReceiptScanner): an immersive
 * dark-purple surface with gold accent, soft blur blobs and a staggered
 * rise-in animation. Rendered through a portal above app chrome.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import { Sparkles, Users, CalendarClock, Check, ArrowLeft } from "lucide-react";

interface ScanIntroModalProps {
  /**
   * Called when the user dismisses the intro (taps the CTA). Receives whether
   * the "don't show again" checkbox was ticked so the caller can persist the
   * opt-out.
   */
  onDismiss: (dontShowAgain: boolean) => void;
  /**
   * Called when the user backs out of the intro without continuing. When
   * provided, a back button appears top-left so the user can leave the scanner
   * from the intro screen (otherwise the intro has no exit affordance).
   */
  onBack?: () => void;
  className?: string;
}

const RULES = [
  { icon: Sparkles, titleKey: "scanIntro.purposeTitle", descKey: "scanIntro.purposeDesc" },
  { icon: Users, titleKey: "scanIntro.expenseTypeTitle", descKey: "scanIntro.expenseTypeDesc" },
  { icon: CalendarClock, titleKey: "scanIntro.dateRuleTitle", descKey: "scanIntro.dateRuleDesc" },
] as const;

export function ScanIntroModal({ onDismiss, onBack, className }: ScanIntroModalProps) {
  const { t } = useAppLocale();
  const [mounted, setMounted] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const translatedBack = t("common.back");
  const backLabel = translatedBack === "common.back" ? "Back" : translatedBack;

  return createPortal(
    <div
      className={cn(
        "scanui-surface fixed inset-0 z-[9999] flex flex-col overflow-hidden",
        className
      )}
      style={{ height: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-intro-title"
    >
      <div className="scanui-blob scanui-blob-p" aria-hidden />
      <div className="scanui-blob scanui-blob-g" aria-hidden />

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="scanui-rise absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
      )}

      <div className="relative z-[1] flex flex-1 flex-col overflow-y-auto px-6 pt-12 pb-7">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="scanui-gold-ic scanui-rise mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-2xl">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <h1
              id="scan-intro-title"
              className="scanui-rise text-[23px] font-semibold tracking-tight text-white"
              style={{ animationDelay: "0.06s" }}
            >
              {t("scanIntro.title")}
            </h1>
            <p
              className="scanui-rise mx-auto mt-2 max-w-xs text-[13.5px] leading-snug text-white/60"
              style={{ animationDelay: "0.06s" }}
            >
              {t("scanIntro.subtitle")}
            </p>
          </div>

          {/* Rule cards */}
          <div className="space-y-2.5">
            {RULES.map((rule, i) => {
              const Icon = rule.icon;
              return (
                <div
                  key={i}
                  className="scanui-rise flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5"
                  style={{ animationDelay: `${0.14 + i * 0.06}s` }}
                >
                  <div
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--scanui-icon-purple-bg)", color: "var(--scanui-icon-purple-text)" }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{t(rule.titleKey)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">
                      {t(rule.descKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opt-out + CTA pinned to the bottom of the scroll area */}
          <div className="mt-auto pt-8">
            <label
              className="scanui-rise mb-3.5 flex cursor-pointer items-center justify-center gap-2.5 select-none"
              style={{ animationDelay: "0.32s" }}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={dontShowAgain}
                onClick={() => setDontShowAgain((v) => !v)}
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-colors",
                  dontShowAgain
                    ? "scanui-gold border-transparent"
                    : "border-white/20 bg-white/[0.04]"
                )}
              >
                {dontShowAgain ? (
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                ) : null}
              </button>
              <span
                className="text-xs text-white/65"
                onClick={() => setDontShowAgain((v) => !v)}
              >
                {t("scanIntro.dontShowAgain")}
              </span>
            </label>
            <button
              type="button"
              onClick={() => onDismiss(dontShowAgain)}
              className="scanui-gold scanui-rise w-full rounded-2xl py-4 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
              style={{ animationDelay: "0.36s" }}
            >
              {t("scanIntro.cta")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
