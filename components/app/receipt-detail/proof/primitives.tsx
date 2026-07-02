"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CONDENSED, FLAME, MONO } from "./theme";

function cx(...p: Array<string | false | undefined>): string {
  return p.filter(Boolean).join(" ");
}

export const flameText: CSSProperties = {
  backgroundImage: FLAME,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/** Slanted right edge — gives bars/segments character instead of a flat rectangle. */
export const SLANT = "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)";
/** Notched corner (cut top-right) for shaped containers. */
export const NOTCH = "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)";

/** Ink-stamp status mark — rotated double ring, not a pill. */
export function Stamp({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex -rotate-6 items-center justify-center px-2.5 py-1"
      style={{
        color,
        border: `2px solid ${color}`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 35%, transparent)`,
        borderRadius: 6,
        fontFamily: MONO,
        letterSpacing: "0.18em",
        opacity: 0.92,
      }}
    >
      <span className="text-[11px] font-bold uppercase">{label}</span>
    </span>
  );
}

/* ───────────────────────────────────────────────────────────── Panel */

export function Panel({ children, glow, className, style }: { children: ReactNode; glow?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cx("relative overflow-hidden rounded-[20px]", className)}
      style={{
        background: "var(--pf-panel)",
        border: "1px solid var(--pf-line)",
        boxShadow: glow
          ? "inset 0 1px 0 0 rgba(255,220,200,0.10), 0 22px 64px rgba(0,0,0,0.5), 0 0 50px var(--pf-glow)"
          : "inset 0 1px 0 0 rgba(255,220,200,0.06), 0 16px 40px rgba(0,0,0,0.4)",
        ...style,
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 6%, var(--pf-line-strong) 50%, transparent 94%)" }} />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── SectionHead */

export function SectionHead({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-[3px] w-5 rounded-full" style={{ background: FLAME }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ ...flameText, fontFamily: MONO }}>{eyebrow}</span>
        </div>
        <h2 className="mt-1.5 text-[1.7rem] font-bold uppercase leading-none tracking-tight" style={{ color: "var(--pf-text)", fontFamily: CONDENSED }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── StatCell */

export function StatCell({ label, value, sub, color }: { label: string; value: ReactNode; sub?: string; color?: string }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{label}</div>
      <div className="mt-1 truncate text-[1.6rem] font-bold leading-none" style={{ color: color || "var(--pf-text)", fontFamily: CONDENSED }}>{value}</div>
      {sub && <div className="mt-1 text-[10px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{sub}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── KV */

export function KV({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5" style={{ borderColor: "var(--pf-line)" }}>
      <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{label}</span>
      <span className="truncate text-right text-sm font-semibold" style={{ color: accent || "var(--pf-soft)" }}>{value}</span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── Bar */

export function Bar({ pct, color, progress, reduce, delay = 0, height = 8 }: { pct: number; color: string; progress: boolean; reduce: boolean | null; delay?: number; height?: number }) {
  return (
    <div className="overflow-hidden rounded-full" style={{ height, background: "rgba(0,0,0,0.38)", border: "1px solid var(--pf-line)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}bb)`, boxShadow: `0 0 10px ${color}55` }}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: progress ? `${Math.min(100, pct)}%` : 0 }}
        transition={{ duration: 0.8, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────── Reveal + CountUp */

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  if (reduce) return <div ref={ref} className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({ value, decimals = 2, durationMs = 1000, className, style }: { value: number; decimals?: number; durationMs?: number; className?: string; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      setDisplay(value * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, durationMs, reduce]);
  return <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>{display.toFixed(decimals)}</span>;
}
