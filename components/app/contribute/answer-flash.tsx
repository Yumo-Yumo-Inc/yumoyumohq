"use client";

import { useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { AnswerResult } from "@/lib/contribution/client";

/**
 * The beat after an answer — the small showcase moment (yumo-design vitrin regime).
 *
 * Two intensities: a plain "+N puan" acknowledgement, and — when the answer actually
 * resolved a task — the louder "X fiş düzeldi" reveal, the concrete-impact payoff that
 * makes the work feel real. Auto-dismisses so the flow never stalls.
 */

interface AnswerFlashProps {
  result: AnswerResult | null;
  onDone: () => void;
}

const HOLD_MS = 1150;

export function AnswerFlash({ result, onDone }: AnswerFlashProps) {
  const { t, locale } = useAppLocale();
  const reduce = useReducedMotion();
  const resolved = !!result?.resolved && (result?.rowsFixed ?? 0) > 0;
  const rowsEased = Math.round(useCountUp(result?.rowsFixed ?? 0, { durationMs: 800, start: resolved }));

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(onDone, resolved ? HOLD_MS + 550 : HOLD_MS);
    return () => clearTimeout(id);
  }, [result, resolved, onDone]);

  const nf = (n: number) => n.toLocaleString(locale === "tr" ? "tr-TR" : "en-US");

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          key="flash"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <div
            className="flex flex-col items-center gap-3 rounded-[var(--app-radius-xl)] px-8 py-7"
            style={{
              background: "var(--surface-grad-value)",
              boxShadow:
                "inset 0 0 0 1px var(--app-gold-border), 0 12px 44px var(--app-gold-glow)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.span
              initial={reduce ? undefined : { scale: 0 }}
              animate={reduce ? undefined : { scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--app-gold-light)", color: "#0F1117" }}
            >
              {resolved ? <Sparkles size={26} strokeWidth={2.5} /> : <Check size={28} strokeWidth={3} />}
            </motion.span>

            {resolved ? (
              <div className="text-center">
                <span
                  className="block font-mono text-[30px] font-black leading-none tabular-nums"
                  style={{ color: "var(--app-gold-light)" }}
                >
                  {nf(rowsEased)}
                </span>
                <span className="mt-1 block text-[14px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
                  {t("contribute.flash.receiptsFixed")}
                </span>
              </div>
            ) : (
              <span className="text-[16px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
                {t("contribute.flash.thanks")}
              </span>
            )}

            {result.pointsAwarded > 0 && (
              <span
                className="rounded-full px-3 py-1 font-mono text-[13px] font-bold tabular-nums"
                style={{ color: "var(--app-gold-light)", background: "var(--app-gold-glow)" }}
              >
                +{nf(result.pointsAwarded)} {t("contribute.flash.points")}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
