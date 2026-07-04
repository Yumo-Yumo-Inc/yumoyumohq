"use client";

/**
 * Unlock reveal modal — plays once when the user reaches an account level that
 * opens a ladder unlock (karar 2026-07-02 §5). Sequence: dimmed blurred app →
 * closed orange metallic padlock → energy build + two resisted tugs → snap +
 * light burst → shackle opens → god rays + shimmer → title + reward + single
 * invite. One-shot: ends in the open state, no loop. Respects
 * prefers-reduced-motion (jumps to the revealed state).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useTheme } from "@/lib/theme/theme-context";
import type { AccountUnlock } from "@/config/account-unlocks";
import { pickLabel } from "@/config/season-content";

interface UnlockRevealModalProps {
  unlocks: AccountUnlock[];
  level: number;
  onDismiss: () => void;
}

const GOLD = "#F5A623";
const GOLD_DEEP = "#B45309";

function Padlock({ open, reduced }: { open: boolean; reduced: boolean | null }) {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" aria-hidden="true">
      <defs>
        <linearGradient id="lockBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD37A" />
          <stop offset="45%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
        <linearGradient id="lockShackle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE3A3" />
          <stop offset="100%" stopColor="#C97A12" />
        </linearGradient>
      </defs>
      {/* Shackle — rotates open around its right hinge. */}
      <motion.g
        style={{ originX: "78px", originY: "52px" }}
        animate={open ? { rotate: reduced ? 0 : -38, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 210, damping: 13 }}
      >
        <path
          d="M 42 52 V 38 C 42 24 78 24 78 38 V 52"
          fill="none"
          stroke="url(#lockShackle)"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </motion.g>
      {/* Body */}
      <rect x="30" y="50" width="60" height="46" rx="10" fill="url(#lockBody)" />
      <rect x="30" y="50" width="60" height="12" rx="6" fill="rgba(255,255,255,0.28)" />
      {/* Keyhole */}
      <circle cx="60" cy="69" r="6" fill="#5B3305" />
      <rect x="57" y="72" width="6" height="12" rx="3" fill="#5B3305" />
    </svg>
  );
}

export function UnlockRevealModal({ unlocks, level, onDismiss }: UnlockRevealModalProps) {
  const { t } = useAppLocale();
  const { locale } = useAppLocale();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  // build → snap → revealed (reduced motion goes straight to revealed)
  const [stage, setStage] = useState<"build" | "snap" | "revealed">(reduced ? "revealed" : "build");

  useEffect(() => {
    if (reduced) return;
    const toSnap = window.setTimeout(() => setStage("snap"), 1350);
    const toReveal = window.setTimeout(() => setStage("revealed"), 1750);
    return () => {
      window.clearTimeout(toSnap);
      window.clearTimeout(toReveal);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced || stage !== "snap") return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([0, 30, 20, 70]);
    }
  }, [stage, reduced]);

  const open = stage !== "build";
  const primary = unlocks[0];
  if (!primary) return null;

  const labelTable = Object.fromEntries(unlocks.map((u) => [u.key, u.title]));
  const descTable = Object.fromEntries(unlocks.map((u) => [u.key, u.description]));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-5 py-8">
      {/* Dimmed, blurred app behind. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{
          background:
            theme === "light"
              ? "rgba(10,10,14,0.62)"
              : "radial-gradient(circle at 50% 40%, rgba(245,166,35,0.06), rgba(5,7,12,0.9) 45%, rgba(3,5,10,0.97))",
          backdropFilter: "blur(16px)",
        }}
        onClick={stage === "revealed" ? onDismiss : undefined}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("unlockReveal.aria")}
        className="relative flex w-full max-w-[400px] flex-col items-center text-center"
      >
        {/* God rays — appear only after the snap, slow one-directional drift. */}
        {stage === "revealed" && !reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, rotate: -8 }}
            animate={{ opacity: 0.55, rotate: 8 }}
            transition={{ opacity: { duration: 0.6 }, rotate: { duration: 14, ease: "linear" } }}
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${GOLD}22 8deg, transparent 22deg, transparent 55deg, ${GOLD}1d 66deg, transparent 80deg, transparent 130deg, ${GOLD}22 142deg, transparent 158deg, transparent 210deg, ${GOLD}1a 224deg, transparent 240deg, transparent 300deg, ${GOLD}20 312deg, transparent 330deg)`,
              maskImage: "radial-gradient(circle, black 0%, transparent 68%)",
              WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 68%)",
            }}
          />
        )}

        {/* Light burst at the snap. */}
        {stage === "snap" && !reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
            initial={{ opacity: 0.9, scale: 0.3 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ background: `radial-gradient(circle, #FFF3D6 0%, ${GOLD}66 40%, transparent 70%)` }}
          />
        )}

        {/* Sparkle particles after the snap — one-shot outward drift. */}
        {stage === "revealed" && !reduced && (
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 -translate-y-1/2">
            {Array.from({ length: 14 }).map((_, i) => {
              const angle = (i / 14) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute h-1 w-1 rounded-full"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * (70 + (i % 3) * 26),
                    y: Math.sin(angle) * (70 + (i % 3) * 26),
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{ duration: 1.2 + (i % 4) * 0.18, ease: "easeOut" }}
                  style={{ background: i % 3 === 0 ? "#FFE9BF" : GOLD }}
                />
              );
            })}
          </div>
        )}

        {/* The padlock — energy build with two resisted tugs, then it opens. */}
        <motion.div
          className="relative"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
          animate={
            reduced || stage !== "build"
              ? { opacity: 1, scale: 1, rotate: 0 }
              : {
                  opacity: 1,
                  scale: [0.7, 1, 1, 1.02, 1, 1.03, 1],
                  rotate: [0, 0, -3.5, 2.5, -4, 3, 0],
                }
          }
          transition={
            reduced || stage !== "build"
              ? { duration: 0.3 }
              : { duration: 1.3, times: [0, 0.25, 0.4, 0.52, 0.72, 0.84, 1], ease: "easeInOut" }
          }
        >
          {/* Energy halo behind the lock while it builds. */}
          <motion.span
            aria-hidden
            className="absolute inset-0 m-auto rounded-full"
            style={{ height: 110, width: 110, background: GOLD, filter: "blur(26px)" }}
            animate={
              reduced
                ? { opacity: 0.22 }
                : stage === "build"
                  ? { opacity: [0.08, 0.3, 0.14, 0.34] }
                  : { opacity: 0.26 }
            }
            transition={stage === "build" && !reduced ? { duration: 1.3, ease: "easeInOut" } : { duration: 0.4 }}
          />
          <Padlock open={open} reduced={reduced} />
        </motion.div>

        {/* Title + reward + single invite — the revealed state. */}
        <motion.div
          className="mt-2 w-full"
          initial={{ opacity: 0, y: 14 }}
          animate={stage === "revealed" ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[12px] font-bold tracking-[0.18em]" style={{ color: GOLD }}>
            {t("unlockReveal.kicker", { level })}
          </p>
          <h2 className="mt-2 text-[28px] font-black leading-tight" style={{ color: "#F4F6FB" }}>
            {pickLabel(labelTable, primary.key, locale)}
          </h2>
          <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-6" style={{ color: "rgba(220,226,240,0.75)" }}>
            {pickLabel(descTable, primary.key, locale)}
          </p>

          {unlocks.length > 1 && (
            <div className="mx-auto mt-4 grid w-full max-w-[320px] gap-2">
              {unlocks.slice(1).map((u) => (
                <div
                  key={u.key}
                  className="flex items-center justify-between gap-3 border px-3 py-2.5 text-left"
                  style={{
                    borderColor: "rgba(245,166,35,0.25)",
                    borderRadius: 8,
                    background: "rgba(245,166,35,0.06)",
                  }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(230,234,244,0.9)" }}>
                    {pickLabel(labelTable, u.key, locale)}
                  </span>
                  <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: GOLD }}>
                    Lv.{u.level}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mx-auto mt-6 flex w-full max-w-[320px] flex-col gap-2">
            <Link
              href="/app/rewards/journey"
              onClick={onDismiss}
              className="w-full border px-4 py-3 text-[13px] font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                borderColor: "rgba(245,166,35,0.5)",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                color: "#14100A",
              }}
            >
              {t("unlockReveal.tryNow")}
            </Link>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full border px-4 py-3 text-[13px] font-semibold transition-opacity hover:opacity-80"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: "rgba(226,230,240,0.85)",
              }}
            >
              {t("unlockReveal.later")}
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
