"use client";

/**
 * YumbieInsight — weekly grounded awareness sheet. Uses the same visual language
 * as the chat panel (portal + slide-up) but is DETERMINISTIC (not an LLM): the
 * observation is soft/non-judgmental, and the action is a soft cap the user sets
 * THEMSELVES. Everything is dismissible (backdrop/"Got it") and has no penalty.
 * Mounted inside the gate.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useYumbieInsight } from "./useYumbieInsight";
import { useYumbieGoals } from "./useYumbieGoals";
import { useYumbieMessage } from "./useYumbieMessage";
import { useAppLocale } from "@/lib/i18n/app-context";
import { composeAwarenessLine, suggestSoftCap, capStep } from "./awarenessLine";

export function YumbieInsight() {
  const { open, current } = useYumbieInsight();
  const { t, locale } = useAppLocale();
  const [mounted, setMounted] = useState(false);
  const [capMode, setCapMode] = useState(false);
  const [cap, setCap] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open && current) {
      const existing = useYumbieGoals.getState().capOf(current.categoryKey);
      const base =
        existing ?? (current.recentMonthlyAvg ? suggestSoftCap(current.recentMonthlyAvg) : 0);
      setCap(base);
      setCapMode(false);
    }
  }, [open, current]);

  if (!mounted || !open || !current) return null;

  const line = composeAwarenessLine(current, { t });
  const currency = current.currency ?? "";
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(locale || undefined).format(n);
    } catch {
      return String(n);
    }
  };
  const step = capStep(cap || 1);
  const canCap = current.direction === "up" && (current.recentMonthlyAvg ?? 0) > 0;

  const close = () => useYumbieInsight.getState().dismiss();
  const saveCap = () => {
    useYumbieGoals.getState().setCap(current.categoryKey, cap);
    useYumbieMessage.getState().say(
      t("yumbie.insight.capSaved", {
        label: current.label,
        amount: `${fmt(cap)} ${currency}`.trim(),
      })
    );
    useYumbieInsight.getState().dismiss();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/55" onClick={close} aria-hidden />
      <div
        role="dialog"
        aria-label="Yumbie"
        className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[460px] flex-col overflow-hidden rounded-t-[22px] border border-[var(--app-border)] bg-[var(--app-bg-base)] pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.55)] [animation:yb-sheet-up_240ms_cubic-bezier(0.19,1,0.22,1)]"
      >
        <style>{`@keyframes yb-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-full bg-[#F2C14E]" aria-hidden />
            <span className="text-[13px] font-black uppercase tracking-[0.18em] text-[#ffb347]">Yumbie</span>
          </div>
          <button
            onClick={close}
            className="rounded-full px-2 py-1 text-[15px] text-white/50 hover:text-white/90"
            aria-label={t("yumbie.insight.close")}
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="text-[14px] leading-[1.55] text-white/90">{line}</p>

          {capMode && canCap && (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
              <p className="mb-2 text-[12.5px] text-white/70">
                {t("yumbie.insight.capPrompt", { label: current.label })}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCap((v) => Math.max(0, v - step))}
                  className="h-9 w-9 rounded-full border border-white/[0.12] bg-white/[0.04] text-[18px] text-white/80"
                  aria-label="-"
                >
                  −
                </button>
                <span className="min-w-[120px] text-center text-[16px] font-bold text-white">
                  {fmt(cap)} {currency}
                </span>
                <button
                  onClick={() => setCap((v) => v + step)}
                  className="h-9 w-9 rounded-full border border-white/[0.12] bg-white/[0.04] text-[18px] text-white/80"
                  aria-label="+"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-4 py-3">
          {canCap && !capMode && (
            <button
              onClick={() => setCapMode(true)}
              className="rounded-full bg-[#ffb347] px-4 py-2 text-[13px] font-bold text-[#1a1206]"
            >
              {t("yumbie.insight.setCap")}
            </button>
          )}
          {capMode && (
            <button
              onClick={saveCap}
              className="rounded-full bg-[#37e0c2] px-4 py-2 text-[13px] font-bold text-[#06231d]"
            >
              {t("yumbie.insight.capSave")}
            </button>
          )}
          <button
            onClick={close}
            className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[13px] text-white/75"
          >
            {t("yumbie.insight.dismiss")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
