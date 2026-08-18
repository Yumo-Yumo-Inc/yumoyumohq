"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, MousePointer2, RotateCcw, Sparkles, X } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import {
  endDemoTour,
  floorStepForPath,
  isTourLauncherPath,
  routeForStep,
  TOUR_STEP_IDS,
  useDemoTour,
  type TourRoute,
  type TourStepId,
} from "@/lib/demo/tour-context";

type FocusShape = { cx: number; cy: number; rx: number; ry: number };
type Side = "top" | "bottom";
type TourStep = {
  id: TourStepId;
  target: string | null;
  route: TourRoute;
  chapter: 1 | 2 | 3 | 4;
  mode: "action" | "showcase";
  autoAdvanceMs?: number;
  padX: number;
  padY: number;
};

const GUIDE_COLOR = "var(--app-blue)";
const GUIDE_BRIGHT = "color-mix(in srgb, var(--app-blue) 52%, white)";
const GUIDE_GLOW = "color-mix(in srgb, var(--app-blue) 34%, transparent)";
const GUIDE_SOFT = "color-mix(in srgb, var(--app-blue) 14%, transparent)";

const STEPS: TourStep[] = [
  { id: "welcome", target: null, route: "/app/dashboard", chapter: 1, mode: "action", padX: 0, padY: 0 },
  { id: "receipts", target: "receipt-open", route: "/app/dashboard", chapter: 1, mode: "action", padX: 18, padY: 14 },
  { id: "month", target: "month", route: "/app/dashboard", chapter: 2, mode: "showcase", autoAdvanceMs: 2600, padX: 18, padY: 14 },
  { id: "nav-analysis", target: "nav-analysis", route: "/app/dashboard", chapter: 2, mode: "action", padX: 12, padY: 8 },
  { id: "analysis-price", target: "analysis-price", route: "/app/analysis", chapter: 2, mode: "action", padX: 18, padY: 18 },
  { id: "analysis-inflation", target: "analysis-inflation", route: "/app/analysis", chapter: 3, mode: "showcase", autoAdvanceMs: 2800, padX: 14, padY: 10 },
  { id: "nav-season", target: "nav-season", route: "/app/analysis", chapter: 3, mode: "action", padX: 12, padY: 8 },
  { id: "season", target: "season-progress", route: "/app/season", chapter: 3, mode: "showcase", autoAdvanceMs: 2800, padX: 18, padY: 12 },
  { id: "nav-scan", target: "nav-scan", route: "/app/season", chapter: 4, mode: "action", padX: 14, padY: 10 },
];

function pathMatches(pathname: string, route: string) {
  if (route === "/app/dashboard") return pathname === "/app" || pathname.startsWith("/app/dashboard");
  return pathname.startsWith(route);
}

function pickVisible(tourId: string): HTMLElement | null {
  const exact = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${tourId}"]`));
  const receiptFallback = tourId === "receipt-open"
    ? Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="receipts"] button`))
    : [];
  return [...exact, ...receiptFallback].find((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return style.display !== "none"
      && style.visibility !== "hidden"
      && rect.width > 2
      && rect.height > 2;
  }) ?? null;
}

function toFocusShape(rect: DOMRect, padX: number, padY: number): FocusShape {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rx = Math.max(30, Math.min(rect.width / 2 + padX, vw * 0.42));
  const ry = Math.max(28, Math.min(rect.height / 2 + padY, vh * 0.24));
  return {
    cx: Math.max(rx + 8, Math.min(vw - rx - 8, rect.left + rect.width / 2)),
    cy: Math.max(ry + 8, Math.min(vh - ry - 8, rect.top + rect.height / 2)),
    rx,
    ry,
  };
}

function pointInFocus(x: number, y: number, focus: FocusShape | null) {
  if (!focus) return false;
  const dx = (x - focus.cx) / focus.rx;
  const dy = (y - focus.cy) / focus.ry;
  return dx * dx + dy * dy <= 1;
}

function placeCaption(focus: FocusShape | null, centered: boolean) {
  const vw = typeof window === "undefined" ? 390 : window.innerWidth;
  const vh = typeof window === "undefined" ? 844 : window.innerHeight;
  const width = Math.min(340, vw - 40);
  const clampX = (x: number) => Math.max(20, Math.min(vw - width - 20, x));
  if (centered || !focus) {
    return { top: Math.max(120, vh * 0.28), left: clampX((vw - width) / 2), side: "bottom" as Side, width };
  }
  const roomBelow = vh - (focus.cy + focus.ry);
  const roomAbove = focus.cy - focus.ry;
  const side: Side = roomBelow >= 190 || roomBelow >= roomAbove ? "bottom" : "top";
  const top = side === "bottom"
    ? Math.min(vh - 176, focus.cy + focus.ry + 28)
    : Math.max(84, focus.cy - focus.ry - 154);
  return { top, left: clampX(focus.cx - width / 2), side, width };
}

export function OnboardingTour() {
  const { t } = useAppLocale();
  const { active, stepId, setStepId } = useDemoTour();
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const maskId = useId().replace(/:/g, "");
  const dialogRef = useRef<HTMLDivElement>(null);
  const transitionTimer = useRef(0);
  const veilTimer = useRef(0);
  const autoTimer = useRef(0);
  const failureTimer = useRef(0);
  const [focus, setFocus] = useState<FocusShape | null>(null);
  const [targetReady, setTargetReady] = useState(false);
  const [nudge, setNudge] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [veil, setVeil] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [targetFailed, setTargetFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const stepIndex = Math.max(0, STEPS.findIndex((item) => item.id === stepId));
  const step = STEPS[stepIndex] ?? STEPS[0];

  useEffect(() => {
    setMounted(true);
    return () => {
      window.clearTimeout(transitionTimer.current);
      window.clearTimeout(veilTimer.current);
      window.clearTimeout(autoTimer.current);
      window.clearTimeout(failureTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    for (const route of ["/app/dashboard", "/app/analysis", "/app/season", "/app/mine"]) router.prefetch(route);
  }, [active, router]);

  useEffect(() => {
    if (!active || isTourLauncherPath(pathname)) return;
    const storedIndex = Math.max(0, TOUR_STEP_IDS.indexOf(stepId));
    const floor = floorStepForPath(pathname);
    if (floor) {
      const floorIndex = TOUR_STEP_IDS.indexOf(floor);
      if (floorIndex > storedIndex) {
        setStepId(floor);
        return;
      }
    }
    const lockedRoute = routeForStep(stepId);
    if (!pathMatches(pathname, lockedRoute)) router.replace(lockedRoute);
  }, [active, pathname, router, setStepId, stepId]);

  useLayoutEffect(() => {
    setFocus(null);
    setTargetReady(false);
    setTargetFailed(false);
    window.clearTimeout(failureTimer.current);
    if (!active || !step.target || !pathMatches(pathname, step.route)) {
      return;
    }
    failureTimer.current = window.setTimeout(() => setTargetFailed(true), 4500);
    let cancelled = false;
    let retry = 0;
    let frame = 0;
    let settleTimer = 0;
    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let target: HTMLElement | null = null;
    const measure = () => {
      if (cancelled) return;
      const nextTarget = pickVisible(step.target!);
      if (!nextTarget) {
        target = null;
        setFocus(null);
        setTargetReady(false);
        return;
      }
      if (nextTarget !== target) {
        observer?.disconnect();
        target = nextTarget;
        observer = new ResizeObserver(scheduleMeasure);
        observer.observe(target);
      }
      setFocus(toFocusShape(target.getBoundingClientRect(), step.padX, step.padY));
    };
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        setTargetReady(true);
        setTargetFailed(false);
        window.clearTimeout(failureTimer.current);
      }, 180);
    };
    const connect = () => {
      const nextTarget = pickVisible(step.target!);
      if (!nextTarget) return false;
      if (nextTarget !== target) {
        observer?.disconnect();
        target = nextTarget;
        observer = new ResizeObserver(scheduleMeasure);
        observer.observe(target);
      }
      nextTarget.scrollIntoView({
        block: step.target!.startsWith("nav-") ? "nearest" : "center",
        inline: "nearest",
        behavior: reduced ? "auto" : "smooth",
      });
      measure();
      settleTimer = window.setTimeout(() => {
        setTargetReady(true);
        setTargetFailed(false);
        window.clearTimeout(failureTimer.current);
      }, 180);
      return true;
    };
    if (!connect()) {
      retry = window.setInterval(() => {
        if (connect()) window.clearInterval(retry);
      }, 50);
    }
    mutationObserver = new MutationObserver(() => {
      if (!target?.isConnected) connect();
      else scheduleMeasure();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleMeasure, true);
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);
    return () => {
      cancelled = true;
      window.clearInterval(retry);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(failureTimer.current);
      observer?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, [active, pathname, reduced, retryNonce, step.padX, step.padY, step.route, step.target]);

  useEffect(() => {
    setConfirmed(false);
    setNudge(0);
    const timer = window.setTimeout(() => dialogRef.current?.focus(), reduced ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [reduced, step.id]);

  useEffect(() => {
    if (!veil || !pathMatches(pathname, step.route)) return;
    window.clearTimeout(veilTimer.current);
    veilTimer.current = window.setTimeout(() => setVeil(false), reduced ? 0 : 420);
    return () => window.clearTimeout(veilTimer.current);
  }, [pathname, reduced, step.route, veil]);

  const finishToScan = useCallback(async () => {
    if (exiting) return;
    setExiting(true);
    endDemoTour();
    try {
      await fetch("/api/demo/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exit" }),
      });
    } finally {
      window.location.assign("/app/mine");
    }
  }, [exiting]);

  const moveTo = useCallback((index: number) => {
    const destination = STEPS[Math.max(0, Math.min(STEPS.length - 1, index))];
    const routeChanged = destination.route !== step.route;
    if (routeChanged) setVeil(true);
    setStepId(destination.id);
    if (routeChanged) router.push(destination.route);
  }, [router, setStepId, step.route]);

  const advance = useCallback(() => {
    if (confirmed || exiting || veil) return;
    if (step.id === "nav-scan") {
      setConfirmed(true);
      transitionTimer.current = window.setTimeout(() => void finishToScan(), reduced ? 0 : 720);
      return;
    }
    setConfirmed(true);
    transitionTimer.current = window.setTimeout(() => moveTo(stepIndex + 1), reduced ? 0 : 680);
  }, [confirmed, exiting, finishToScan, moveTo, reduced, step.id, stepIndex, veil]);

  useEffect(() => {
    window.clearTimeout(autoTimer.current);
    if (
      step.mode !== "showcase"
      || !targetReady
      || targetFailed
      || confirmed
      || veil
      || !pathMatches(pathname, step.route)
    ) return;
    autoTimer.current = window.setTimeout(advance, reduced ? 900 : step.autoAdvanceMs ?? 2600);
    return () => window.clearTimeout(autoTimer.current);
  }, [advance, confirmed, pathname, reduced, step.autoAdvanceMs, step.mode, step.route, targetFailed, targetReady, veil]);

  const goBack = useCallback(() => {
    if (stepIndex > 0 && !confirmed && !exiting && !veil) moveTo(stepIndex - 1);
  }, [confirmed, exiting, moveTo, stepIndex, veil]);

  const onOverlayPointer = useCallback((event: PointerEvent) => {
    if (confirmed || exiting || veil || !targetReady || step.id === "welcome") return;
    if (pointInFocus(event.clientX, event.clientY, focus)) advance();
    else if (step.mode === "showcase") return;
    else setNudge((value) => value + 1);
  }, [advance, confirmed, exiting, focus, step.id, step.mode, targetReady, veil]);

  if (!mounted || !active || isTourLauncherPath(pathname)) return null;
  const title = t(`demoPreview.steps.${step.id}.title`);
  const body = t(`demoPreview.steps.${step.id}.body`);
  const action = t(`demoPreview.steps.${step.id}.action`);
  const chapterLabel = t("demoPreview.chapterOf", { current: step.chapter, total: 4 });
  const caption = placeCaption(focus, step.id === "welcome");
  const onCorrectRoute = pathMatches(pathname, step.route);
  const stepIsVisuallyReady = step.id === "welcome" || Boolean(focus && targetReady && onCorrectRoute);
  const visibleFocus = targetReady && onCorrectRoute ? focus : null;
  const arrow = visibleFocus && step.id !== "welcome" ? {
    startX: caption.left + caption.width / 2,
    startY: caption.side === "top" ? caption.top + 156 : caption.top - 12,
    endX: visibleFocus.cx,
    endY: caption.side === "top" ? visibleFocus.cy - visibleFocus.ry - 9 : visibleFocus.cy + visibleFocus.ry + 9,
  } : null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tour-title"
      aria-describedby="onboarding-tour-body"
      tabIndex={-1}
      className="fixed inset-0 z-[300] touch-none overflow-hidden outline-none"
      onPointerDown={onOverlayPointer}
      onKeyDown={(event) => {
        if (event.key === "Escape") void finishToScan();
        if (event.key === "ArrowLeft") goBack();
        if ((event.key === "Enter" || event.key === " ") && step.id === "welcome") advance();
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {visibleFocus ? <ellipse cx={visibleFocus.cx} cy={visibleFocus.cy} rx={visibleFocus.rx} ry={visibleFocus.ry} fill="black" /> : null}
          </mask>
          <radialGradient id={`${maskId}-veil`} cx="50%" cy="45%" r="72%">
            <stop offset="0%" stopColor="rgba(5,7,12,0.66)" />
            <stop offset="100%" stopColor="rgba(2,3,7,0.94)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${maskId}-veil)`} mask={`url(#${maskId})`} />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 top-5 flex items-center justify-center gap-2" aria-hidden>
        {[1, 2, 3, 4].map((chapter) => (
          <motion.span
            key={chapter}
            className="h-1 rounded-full"
            animate={{
              width: chapter === step.chapter ? 28 : 8,
              opacity: chapter <= step.chapter ? 1 : 0.28,
              backgroundColor: chapter <= step.chapter ? GUIDE_COLOR : "var(--app-text-muted)",
            }}
            transition={{ duration: reduced ? 0 : 0.38 }}
          />
        ))}
      </div>

      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => void finishToScan()}
        className="absolute right-5 top-4 z-20 grid h-10 w-10 place-items-center rounded-full text-white/65 transition hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--app-blue)]"
        aria-label={t("demoPreview.exit")}>
        <X className="h-5 w-5" />
      </button>
      {stepIndex > 0 ? (
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={goBack}
          className="absolute left-5 top-4 z-20 grid h-10 w-10 place-items-center rounded-full text-white/65 transition hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--app-blue)]"
          aria-label={t("demoPreview.back")}>
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : null}

      {visibleFocus ? (
        <>
          {!veil && !confirmed && targetReady && arrow ? (
            <svg aria-hidden className="pointer-events-none absolute inset-0 z-[7] h-full w-full overflow-visible">
              <defs>
                <marker id={`${maskId}-target-arrow`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                  <path d="M 0 0 L 9 4.5 L 0 9 z" fill={GUIDE_BRIGHT} />
                </marker>
              </defs>
              <motion.path
                d={`M ${arrow.startX} ${arrow.startY} C ${arrow.startX} ${(arrow.startY + arrow.endY) / 2}, ${arrow.endX} ${(arrow.startY + arrow.endY) / 2}, ${arrow.endX} ${arrow.endY}`}
                fill="none"
                stroke={GUIDE_COLOR}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="3 8"
                markerEnd={`url(#${maskId}-target-arrow)`}
                initial={reduced ? false : { opacity: 0, pathLength: 0 }}
                animate={reduced ? { opacity: 1, pathLength: 1 } : { opacity: [0.45, 1, 0.45], pathLength: 1 }}
                transition={reduced
                  ? { duration: 0 }
                  : { pathLength: { duration: 0.6, ease: "easeOut" }, opacity: { duration: 1.05, repeat: Infinity } }}
              />
            </svg>
          ) : null}
          <svg aria-hidden className="pointer-events-none absolute inset-0 z-[9] h-full w-full overflow-visible">
            <defs>
              <linearGradient id={`${maskId}-guide-ring`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={GUIDE_BRIGHT} />
                <stop offset="52%" stopColor={GUIDE_COLOR} />
                <stop offset="100%" stopColor={GUIDE_BRIGHT} stopOpacity="0.58" />
              </linearGradient>
              <filter id={`${maskId}-guide-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <ellipse
              cx={visibleFocus.cx}
              cy={visibleFocus.cy}
              rx={visibleFocus.rx}
              ry={visibleFocus.ry}
              fill="none"
              stroke={GUIDE_SOFT}
              strokeWidth="10"
              filter={`url(#${maskId}-guide-glow)`}
            />
            <ellipse
              cx={visibleFocus.cx}
              cy={visibleFocus.cy}
              rx={Math.max(2, visibleFocus.rx - 3)}
              ry={Math.max(2, visibleFocus.ry - 3)}
              fill="none"
              stroke={GUIDE_BRIGHT}
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <motion.ellipse
              key={`${step.id}-focus-trace`}
              cx={visibleFocus.cx}
              cy={visibleFocus.cy}
              rx={visibleFocus.rx}
              ry={visibleFocus.ry}
              pathLength="1"
              fill="none"
              stroke={`url(#${maskId}-guide-ring)`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="0.22 0.78"
              initial={reduced ? false : { opacity: 0, strokeDashoffset: 0 }}
              animate={confirmed
                ? { opacity: 1, strokeDashoffset: -0.25 }
                : reduced
                  ? { opacity: 1, strokeDashoffset: 0 }
                  : { opacity: [0.72, 1, 0.72], strokeDashoffset: -1 }}
              transition={reduced
                ? { duration: 0 }
                : { opacity: { duration: 1.4, repeat: Infinity }, strokeDashoffset: { duration: 2.1, repeat: Infinity, ease: "linear" } }}
            />
          </svg>
          {!veil && !confirmed && targetReady && step.mode === "action" ? (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute z-20 grid h-9 w-9 place-items-center rounded-full border border-white/45 text-[#07111f] backdrop-blur-md"
              style={{
                left: Math.min(window.innerWidth - 44, visibleFocus.cx + visibleFocus.rx - 28),
                top: Math.min(window.innerHeight - 44, visibleFocus.cy + visibleFocus.ry - 28),
                background: GUIDE_BRIGHT,
                boxShadow: `0 0 0 7px ${GUIDE_SOFT}, 0 0 30px ${GUIDE_GLOW}`,
              }}
              animate={reduced ? { opacity: 1 } : { opacity: [1, 0.72, 1], scale: [1, 1.1, 1] }}
              transition={reduced ? { duration: 0 } : { duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
            >
              <MousePointer2 className="h-[18px] w-[18px]" strokeWidth={2.6} />
            </motion.span>
          ) : null}
          {!veil && !confirmed && targetReady ? <button
            type="button"
            aria-label={action}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={advance}
            className="absolute z-10 rounded-[50%] bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-blue)]"
            style={{ left: visibleFocus.cx - visibleFocus.rx, top: visibleFocus.cy - visibleFocus.ry, width: visibleFocus.rx * 2, height: visibleFocus.ry * 2 }}
          /> : null}
        </>
      ) : null}

      <AnimatePresence>
        {targetFailed && step.target && onCorrectRoute ? (
          <motion.div
            key={`${step.id}-missing-target`}
            role="status"
            className="absolute inset-x-6 top-1/2 z-30 -translate-y-1/2 text-center"
            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <p className="text-[22px] font-black tracking-[-0.03em] text-white">{t("demoPreview.targetErrorTitle")}</p>
            <p className="mx-auto mt-2 max-w-[300px] text-[13px] font-semibold leading-relaxed text-white/62">{t("demoPreview.targetErrorBody")}</p>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setRetryNonce((value) => value + 1)}
              className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full text-[#07111f] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-blue)]"
              style={{ background: GUIDE_BRIGHT, boxShadow: `0 0 34px ${GUIDE_GLOW}` }}
              aria-label={t("demoPreview.retry")}
            >
              <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <p className="mt-2 text-[11px] font-black text-white/78">{t("demoPreview.retry")}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stepIsVisuallyReady ? <motion.div
          key={step.id}
          className="pointer-events-none absolute text-center"
          style={{ top: caption.top, left: caption.left, width: caption.width }}
          initial={reduced ? false : { opacity: 0, x: caption.side === "bottom" ? 18 : -18, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: nudge ? [0, -5, 5, -3, 3, 0] : 0, filter: "blur(0px)" }}
          exit={reduced ? undefined : { opacity: 0, x: caption.side === "bottom" ? -14 : 14, filter: "blur(6px)" }}
          transition={{ duration: reduced ? 0 : 0.72, ease: [0.22, 0.8, 0.2, 1] }}
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--app-blue)]">{chapterLabel}</p>
          <h2 id="onboarding-tour-title" className="mt-2 text-[26px] font-black leading-[1.02] tracking-[-0.035em] text-white sm:text-[30px]" style={{ textShadow: "0 8px 28px rgba(0,0,0,0.72)" }}>{title}</h2>
          <p id="onboarding-tour-body" className="mx-auto mt-2 max-w-[320px] text-[13px] font-semibold leading-[1.45] text-white/68 sm:text-[14px]" style={{ textShadow: "0 5px 18px rgba(0,0,0,0.9)" }}>{body}</p>
          {step.id === "welcome" ? (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={advance}
              className="pointer-events-auto mx-auto mt-7 grid h-14 w-14 place-items-center rounded-full bg-[var(--app-blue)] text-[#07111f] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-blue)]"
              style={{ boxShadow: `0 0 42px ${GUIDE_GLOW}` }}
              aria-label={action}
            >
              {confirmed ? <Check className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" strokeWidth={2.5} />}
            </button>
          ) : step.mode === "showcase" ? (
            <motion.div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-black text-white" animate={{ opacity: [0.62, 1, 0.62] }} transition={{ duration: reduced ? 0 : 1.4, repeat: Infinity }}>
              <Sparkles className="h-4 w-4 text-[var(--app-blue)]" />
              <span>{action}</span>
            </motion.div>
          ) : (
            <motion.div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-black text-white" animate={confirmed ? { color: GUIDE_BRIGHT, scale: 1.03 } : { scale: 1 }}>
              {confirmed ? <Check className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4 text-[var(--app-blue)]" />}
              <span>{confirmed ? t("demoPreview.confirmed") : action}</span>
            </motion.div>
          )}
        </motion.div> : null}
      </AnimatePresence>

      <AnimatePresence>
        {veil ? (
          <motion.div key="tour-veil" aria-hidden className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.44 }}
            style={{ background: "radial-gradient(circle at 50% 46%, color-mix(in srgb, var(--app-blue) 11%, transparent), rgba(3,4,8,0.97) 58%)" }} />
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
