"use client";

/**
 * QuestCompleteOverlay
 *
 * Performance strategy:
 * - Overlay always stays in the DOM → no mount/unmount, no React reconcile overhead
 * - All animations run via CSS class toggles → compositor thread, no JS frame drops
 * - No Framer Motion → main thread stays unblocked
 * - Coin particles: plain canvas + requestAnimationFrame, decoupled from the React render loop
 * - backdrop-filter: blur(10px) — reduced from 18px (mobile GPU friendly)
 * - will-change: transform, opacity — defined in globals.css
 */

import { useEffect, useRef, useCallback } from "react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { questXpToCPoints } from "@/config/contribution-config";

export interface QuestCompleteData {
  questTitle: string;
  rewardRyumo: number;
  rewardSeasonXp: number;
  isWeekly?: boolean;
}

interface Props {
  data: QuestCompleteData | null;
  onDismiss: () => void;
}

// ── Coin particle burst (pure canvas, RAF-driven, outside React) ─
function useCoinBurst(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  trigger: boolean,
  isWeekly: boolean
) {
  const rafRef = useRef<number | null>(null);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const CX = canvas.width / 2;
    const CY = canvas.height * 0.44;

    const COLORS = isWeekly
      ? ["#A78BFA", "#C4B5FD", "#E8C97A", "#F0F0FF", "#60A5FA"]
      : ["#E8C97A", "#C9A84C", "#FFE090", "#F0D070", "#34D399"];

    type P = { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number; rot: number; rotV: number; frame: number };
    const ps: P[] = [];

    for (let i = 0; i < 52; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 3 + Math.random() * 6.5;
      ps.push({
        x: CX + (Math.random() - 0.5) * 50,
        y: CY + (Math.random() - 0.5) * 28,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2.5,
        r: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1, rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.28, frame: 0,
      });
    }

    const TOTAL = 82;

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of ps) {
        p.frame++;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.19; p.vx *= 0.97;
        p.rot += p.rotV;
        p.alpha = Math.max(0, 1 - p.frame / TOTAL);
        if (p.alpha > 0) alive = true;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const sx = Math.max(0.14, Math.abs(Math.cos(p.rot * 2)));
        ctx.scale(sx, 1);
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-p.r * 0.25, -p.r * 0.25, p.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.38)";
        ctx.fill();
        ctx.restore();
      }

      if (alive) rafRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [canvasRef, isWeekly]);

  useEffect(() => {
    if (!trigger) return;
    // 420ms delay: burst fires after the panel animation settles
    const t = setTimeout(fire, 420);
    return () => {
      clearTimeout(t);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [trigger, fire]);
}

// ── CountUp (RAF-driven, via DOM ref — no React state) ──────────
function CountUp({ targetRef, value }: { targetRef: React.RefObject<HTMLSpanElement | null>; value: number }) {
  useEffect(() => {
    const el = targetRef.current;
    if (!el || value === 0) return;
    const start = performance.now();
    const DURATION = 820;
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      el.textContent = `+${Math.round(value * eased)}`;
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, targetRef]);

  return null;
}

// ── Main overlay ──────────────────────────────────────────────────
export function QuestCompleteOverlay({ data, onDismiss }: Props) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;

  // DOM refs — class toggle, no React state
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const ryumoRef    = useRef<HTMLSpanElement>(null);
  const xpRef       = useRef<HTMLSpanElement>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the current data in a ref (so it stays accessible during the close animation too)
  const currentData = useRef<QuestCompleteData | null>(null);

  const isWeekly = currentData.current?.isWeekly ?? data?.isWeekly ?? false;
  useCoinBurst(canvasRef, !!data, isWeekly);

  // ── Open ──
  useEffect(() => {
    if (!data) return;
    currentData.current = data;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) return;

    // Weekly visual theme
    const card = panel.querySelector(".qco-card") as HTMLElement | null;
    if (card) {
      card.classList.toggle("qco-weekly", !!data.isWeekly);
    }

    // Update content (before the animation starts)
    const iconEl  = panel.querySelector(".qco-icon-inner");
    const typeEl  = panel.querySelector(".qco-type");
    const titleEl = panel.querySelector(".qco-title");

    if (iconEl)  iconEl.textContent = data.isWeekly ? "🛡" : "⚔️";
    if (typeEl)  typeEl.textContent = data.isWeekly
      ? l("★ HAFTALIK GÖREV ★", "★ WEEKLY QUEST ★", "★ ЕЖЕНЕДЕЛЬНЫЙ КВЕСТ ★", "★ ภารกิจรายสัปดาห์ ★", "★ MISIÓN SEMANAL ★", "★ 每周任务 ★")
      : l("⚔ GÖREV TAMAMLANDI", "⚔ QUEST COMPLETE", "⚔ КВЕСТ ЗАВЕРШЕН", "⚔ ภารกิจสำเร็จ", "⚔ MISIÓN COMPLETADA", "⚔ 任务完成");
    if (titleEl) titleEl.textContent = data.questTitle;

    // Reset counters
    if (ryumoRef.current) ryumoRef.current.textContent = "+0";
    if (xpRef.current)    xpRef.current.textContent    = "+0";

    // Clear closing classes, open
    backdrop.classList.remove("qco-closing");
    panel.classList.remove("qco-closing");

    // One tick delay — lets transform/opacity register their initial value
    requestAnimationFrame(() => {
      backdrop.classList.add("qco-open");
      panel.classList.add("qco-open");
    });

    // Auto-dismiss
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(handleDismiss, 4400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ── Close ──
  const handleDismiss = useCallback(() => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null; }

    const backdrop = backdropRef.current;
    const panel    = panelRef.current;
    if (!backdrop || !panel) return;

    backdrop.classList.add("qco-closing");
    panel.classList.add("qco-closing");

    // Remove classes and call onDismiss once the transition duration elapses
    setTimeout(() => {
      backdrop.classList.remove("qco-open", "qco-closing");
      panel.classList.remove("qco-open", "qco-closing");
      currentData.current = null;
      onDismiss();
    }, 280);
  }, [onDismiss]);

  // Backdrop click
  const handleBackdropClick = useCallback(() => handleDismiss(), [handleDismiss]);

  // ── CountUp trigger: after the panel opens ─────────────────
  // Read values from the data prop (not via ref)
  const ryumoValue = questXpToCPoints(data?.rewardSeasonXp ?? 0);
  const xpValue    = data?.rewardSeasonXp ?? 0;

  useEffect(() => {
    if (!data) return;
    // Counter animation waits until the reward box is visible (0.46s delay)
    const t = setTimeout(() => {
      const el = ryumoRef.current;
      const el2 = xpRef.current;
      if (!el || !el2) return;

      const DURATION = 820;
      const startTime = performance.now();
      let raf: number;
      const tick = (now: number) => {
        const pct = Math.min((now - startTime) / DURATION, 1);
        const eased = 1 - Math.pow(1 - pct, 3);
        el.textContent  = `+${Math.round(ryumoValue * eased)}`;
        el2.textContent = `+${Math.round(xpValue * eased)}`;
        if (pct < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, 520);
    return () => clearTimeout(t);
  }, [data, ryumoValue, xpValue]);

  const goldBorder = "rgba(201,168,76,0.35)";
  const purpleBorder = "rgba(167,139,250,0.35)";
  const borderColor = isWeekly ? purpleBorder : goldBorder;
  const accentColor = isWeekly ? "#A78BFA" : "#E8C97A";
  const radialColor = isWeekly ? "rgba(167,139,250,0.16)" : "rgba(201,168,76,0.16)";

  return (
    <>
      {/* Coin particle canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[78]"
        style={{ width: "100vw", height: "100vh" }}
        aria-hidden="true"
      />

      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="qco-backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Panel container */}
      <div ref={panelRef} className="qco-panel" role="dialog" aria-modal="true">
        <div
          className="qco-card"
          onClick={(e) => e.stopPropagation()}
          style={{ border: `1px solid ${borderColor}` }}
        >
          {/* Top shimmer line */}
          <div
            className="absolute left-0 right-0 top-0"
            style={{ height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, opacity: 0.85 }}
            aria-hidden="true"
          />

          {/* Radial background glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${radialColor} 0%, transparent 60%)` }}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative flex flex-col items-center px-6 pb-7 pt-8 text-center">

            {/* Icon */}
            <div
              className="qco-icon mb-3 flex items-center justify-center rounded-full"
              style={{
                width: 68, height: 68,
                background: `radial-gradient(circle, ${radialColor.replace("0.16", "0.28")} 0%, transparent 70%)`,
                border: `1px solid ${borderColor}`,
                boxShadow: `0 0 28px ${radialColor}`,
                fontSize: 34,
              }}
            >
              <span className="qco-icon-inner">⚔️</span>
            </div>

            {/* Type label */}
            <p
              className="qco-type mb-1.5"
              style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: accentColor }}
            >
              ⚔ GÖREV TAMAMLANDI
            </p>

            {/* Quest title */}
            <h2
              className="qco-title"
              style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.25, color: "var(--app-text-primary)" }}
            >
              —
            </h2>

            {/* Separator */}
            <div
              className="qco-sep my-4 w-full"
              style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }}
              aria-hidden="true"
            />

            {/* Rewards */}
            <div className="qco-rewards flex w-full gap-3">
              {/* cPoints */}
              <div
                className="flex flex-1 flex-col items-center gap-1.5 rounded-xl py-3.5"
                style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)" }}
              >
                <span style={{ fontSize: 22 }}>🪙</span>
                <span
                  ref={ryumoRef}
                  className="font-mono tabular-nums"
                  style={{ fontSize: 26, fontWeight: 900, color: "#E8C97A", lineHeight: 1 }}
                >
                  +0
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--app-text-muted)" }}>
                  cPoints
                </span>
              </div>

              {/* XP */}
              <div
                className="flex flex-1 flex-col items-center gap-1.5 rounded-xl py-3.5"
                style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)" }}
              >
                <span style={{ fontSize: 22 }}>✨</span>
                <span
                  ref={xpRef}
                  className="font-mono tabular-nums"
                  style={{ fontSize: 26, fontWeight: 900, color: "#34D399", lineHeight: 1 }}
                >
                  +0
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--app-text-muted)" }}>
                  {l("Sezon XP", "Season XP", "Season XP", "Season XP", "Season XP", "Season XP")}
                </span>
              </div>
            </div>

            {/* Dismiss hint */}
            <p className="qco-hint mt-4" style={{ fontSize: 11, color: "var(--app-text-muted)" }}>
              {l("Devam etmek için dokun", "Tap anywhere to continue", "Коснись, чтобы продолжить", "แตะที่ใดก็ได้เพื่อไปต่อ", "Toca en cualquier parte para continuar", "点击任意处继续")}
            </p>
          </div>

          {/* Bottom ambient */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0"
            style={{ height: 70, background: `radial-gradient(ellipse at 50% 100%, ${radialColor.replace("0.16", "0.06")} 0%, transparent 70%)` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </>
  );
}
