"use client";

/**
 * Receipt pipeline — new UI end to end.
 * No step indicator; each screen carries its own title. The error screen is new too.
 */

import { useMemo, useState, useEffect, useRef, type CSSProperties } from "react";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { ThemeCard } from "@/components/app/theme-card";
import type { Receipt } from "@/lib/mock/types";
import { displayHiddenCost, displayHiddenPercent } from "@/lib/receipt/display-hidden-cost";
import { useSound } from "@/lib/audio/sound-context";
import {
  ChevronRight,
  ArrowLeft,
  FileText,
  RotateCcw,
  AlertTriangle,
  ScanText,
  ShieldCheck,
  Coins,
  Loader2,
  Pencil,
  Info,
} from "lucide-react";
import { VectorReceipt } from "@/components/app/vector-receipt";
import { FieldCorrectionModal } from "@/components/app/field-correction-modal";
import { BrandPrompt } from "@/components/app/brand-prompt";
import {
  getCategorySchemaLabel,
  getCostLayerCopy,
  getEvidenceBadge,
  getMvpCopy,
  getProvenanceNotice,
} from "@/lib/receipt/cost-layer-display";
import {
  getTotalRewardAmount,
  resolveNoRewardMessage,
  shouldShowPartialRewardNotice,
} from "@/lib/receipt/reward-display";
import { buildReceiptBreakdownDisplay } from "@/lib/receipt/build-breakdown-display";
import type { ResolveNoRewardOptions } from "@/lib/receipt/reward-display";
import { computeReceiptXRay } from "@/lib/receipt/xray/compute-xray";

/**
 * Gold text accent for the scanui result/analysis surfaces. Resolves from the
 * theme token so it reads as bright gold on the dark surface and deep gold on
 * the light surface. Used in inline `style` (color/background/stroke).
 */
const SCANUI_GOLD = "var(--scanui-gold-text)";

/**
 * Positional palette for hidden-cost layers (chart color rule: distinct
 * category → distinct colour, assigned by position not semantics).
 */
const LAYER_PALETTE = ["#9B8FF0", "#3FD9A0", "#FFC65A", "#F2A03C", "#7CA0FF", "#E879A8"];

/** Count a number up from 0 → target over `duration` ms (ease-out cubic). */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target <= 0) {
      setValue(target);
      return;
    }
    const steps = 36;
    let step = 0;
    setValue(0);
    const timer = setInterval(() => {
      step++;
      const p = 1 - Math.pow(1 - step / steps, 3);
      setValue(target * p);
      if (step >= steps) {
        setValue(target);
        clearInterval(timer);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function noRewardOptionsForReceipt(
  receipt: Receipt,
  hiddenCostCore: number
): ResolveNoRewardOptions {
  return {
    receiptDate: receipt.date,
    hiddenCostCore,
    isDuplicate: receipt.duplicateCheck?.isDuplicate === true,
    duplicateUsername: receipt.duplicateCheck?.duplicateUsername ?? null,
    currentUsername: receipt.username ?? null,
  };
}

// —— 0. Error (new UI, legacy ErrorState unused) ——
interface PipelineErrorStepProps {
  message: string;
  onRetry: () => void;
  locale?: string;
  accountLevel?: number;
}

export function ReceiptPipelineError({ message, onRetry, accountLevel = 1 }: PipelineErrorStepProps) {
  const tier = useTier(accountLevel);
  const { t } = useAppLocale();
  const title = t("pipeline.errorTitle");
  const retryLabel = t("pipeline.retry");

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--app-bg-elevated)", border: "2px solid var(--app-border)" }}
        >
          <AlertTriangle className="w-6 h-6" style={{ color: "var(--app-text-muted)" }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>{title}</h2>
          <p className="text-sm mt-2" style={{ color: "var(--app-text-muted)" }}>{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="w-full max-w-xs py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: `linear-gradient(135deg,${tier.accent},${tier.accent2})`,
            color: "#0a0a0a",
          }}
        >
          {retryLabel}
        </button>
      </div>
    </ThemeCard>
  );
}

const BUCKET_KEYS: Record<string, string> = {
  store: "breakdown.bucket.store",
  supply: "breakdown.bucket.supply",
  retail: "breakdown.bucket.retail",
  excise: "breakdown.bucket.excise",
  government: "breakdown.bucket.government",
  other: "breakdown.bucket.other",
};

/** Basic receipt fields streamed mid-analysis (after Vision, before pricing). */
export interface ScanPartial {
  merchantName: string | null;
  date: string | null;
  total: number;
  currency: string | null;
  category: string | null;
  itemCount: number;
}

interface AnalyzingStepProps {
  canLeaveScreen?: boolean;
  leaveHintText?: string;
  leaveButtonText?: string;
  onLeaveScreen?: () => void;
  locale?: string;
  /**
   * Basic receipt fields (merchant/total/date/category/items) streamed as soon
   * as Vision resolves them — lets beat 0 (the read receipt) play while pricing
   * and hidden-cost are still computing on the server.
   */
  partial?: ScanPartial | null;
  /**
   * Full receipt data. `null` until analysis finishes; once set, beats 1–3
   * (value↔paid → layers → hidden share) play and then the result opens.
   */
  revealReceipt?: Receipt | null;
  /** Called when the four-beat story finishes — caller advances to the result. */
  onRevealComplete?: () => void;
  accountLevel?: number;
}

/**
 * Story segments (Instagram-story progress bars). Every segment fills at the
 * SAME steady, constant rate over `SEG_MS` — linear, never gated, never
 * creeping. The bars are a pure time clock: each one fills evenly in ~2.8s, so
 * six bars span ~16.8s, which comfortably covers an analysis that lands within
 * that window. Receipt/value/hidden data streams in underneath and populates
 * each card as it arrives (a brief shimmer stands in until then). Only the
 * final segment may wait — held full at 100% with a live pulse — if the
 * hidden-cost result has not landed by the time it completes.
 */
const SEG_MS = 2800;
const SCAN_SEGMENTS: { key: string }[] = [
  { key: "upload" },
  { key: "reading" },
  { key: "receipt" },
  { key: "value" },
  { key: "layers" },
  { key: "hidden" },
];

/** Inline CSS custom property (entry-animation delay). */
const delay = (v: string): CSSProperties => ({ ["--d"]: v } as CSSProperties);

export function ReceiptAnalyzingStep({
  canLeaveScreen = false,
  leaveButtonText,
  onLeaveScreen,
  partial = null,
  revealReceipt = null,
  onRevealComplete,
}: AnalyzingStepProps) {
  const { t, locale } = useAppLocale();
  const { playSfx } = useSound();
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const full = revealReceipt;
  const fullReady = !!full;

  // ── Numbers for the data beats (valid once `fullReady`) ──
  const total = full?.total ?? 0;
  const currency = full?.currency ?? "";
  const hidden = full ? displayHiddenCost(full) : 0;
  const value = full ? Math.max(0, full.hiddenCost.productValue ?? total - hidden) : 0;
  const valueShare = total > 0 ? Math.min(1, value / total) : 0;
  const layerRows = useMemo(() => {
    if (!full) return [] as { label: string; pct: number }[];
    const h = displayHiddenCost(full);
    return buildReceiptBreakdownDisplay(full, locale)
      .groups.filter((g) => g.bucket !== "government")
      .slice(0, 3)
      .map((g) => ({
        label: getCostLayerCopy({ category: full.category, merchantChannel: full.merchantChannel, bucket: g.bucket, locale }).label,
        pct: h > 0 ? (g.total / h) * 100 : 0,
      }));
  }, [full, locale]);

  // ── Receipt card — full data if present, else the mid-analysis partial ──
  const cardMerchant = full?.merchantName ?? partial?.merchantName ?? null;
  const cardTotal = full?.total ?? partial?.total ?? 0;
  const cardCurrency = full?.currency ?? partial?.currency ?? "";
  const cardCategory = full?.category ?? partial?.category ?? null;
  const cardItemCount = full ? (Array.isArray(full.lineItems) ? full.lineItems.length : 0) : (partial?.itemCount ?? 0);
  const cardSchema = cardCategory ? getCategorySchemaLabel(cardCategory, locale, full?.merchantChannel) : "";
  const hasReceiptInfo = !!cardMerchant;

  const fmt = (n: number) => Math.round(n).toLocaleString(locale || "tr-TR");
  const money = (n: number) => `${fmt(n)} ${currency}`.trim();
  const cardMoney = (n: number) => `${fmt(n)} ${cardCurrency}`.trim();

  // ── Segment state + refs (the bars run on time, decoupled from data) ──
  const [seg, setSeg] = useState(0);
  const [ended, setEnded] = useState(false);
  const N = SCAN_SEGMENTS.length;
  const barRefs = [
    useRef<HTMLElement>(null), useRef<HTMLElement>(null), useRef<HTMLElement>(null),
    useRef<HTMLElement>(null), useRef<HTMLElement>(null), useRef<HTMLElement>(null),
  ];
  const segRef = useRef(0);
  const segStartRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const partialReadyRef = useRef(false);
  const fullReadyRef = useRef(false);
  useEffect(() => { partialReadyRef.current = !!partial; }, [partial]);
  useEffect(() => { fullReadyRef.current = fullReady; }, [fullReady]);

  // Numbers fill via smooth count-ups once their card is on screen and the full
  // result is ready (a shimmer stands in until then — never a frozen "0").
  const cuValue = useCountUp(seg === 3 && fullReady ? value : 0, 900);
  const cuPaid = useCountUp(seg === 3 && fullReady ? total : 0, 900);
  const cuHidden = useCountUp(seg === 5 && fullReady ? hidden : 0, 900);

  // The bars run on TIME like an Instagram story: each segment fills LINEARLY at
  // the same steady rate over SEG_MS — no gates, no creep, no freeze. Only the
  // last segment may wait (held full at 100% with a live pulse) for the hidden-
  // cost result; analysis lands within the six-bar window in the common path.
  useEffect(() => {
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let sfxPlayed = false;
    const last = N - 1;
    const setBar = (j: number, w: number) => {
      const el = barRefs[j].current;
      if (el) el.style.width = w + "%";
    };
    const paintBars = (i: number, p: number) => {
      for (let j = 0; j < N; j++) {
        const el = barRefs[j].current;
        if (!el) continue;
        el.style.width = (j < i ? 100 : j === i ? p * 100 : 0) + "%";
        el.classList.toggle("scanstory-bar-live", j === i);
      }
    };

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      for (let j = 0; j < N; j++) { setBar(j, 100); barRefs[j].current?.classList.remove("scanstory-bar-live"); }
      segRef.current = last; setSeg(last);
      setEnded(true);
      timers.push(setTimeout(() => onRevealComplete?.(), 1100));
    };

    if (reduceMotion) {
      const settle = () => {
        const target = fullReadyRef.current ? 5 : partialReadyRef.current ? 2 : 1;
        if (target !== segRef.current) { segRef.current = target; setSeg(target); }
        for (let j = 0; j < N; j++) setBar(j, j <= target ? 100 : 0);
        if (fullReadyRef.current) { finish(); return; }
        raf = requestAnimationFrame(settle);
      };
      raf = requestAnimationFrame(settle);
      return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    }

    const frame = (now: number) => {
      if (segStartRef.current === null) segStartRef.current = now;
      // Advance through every segment whose steady SEG_MS has fully elapsed —
      // purely on the clock, never waiting on data (the last segment aside).
      let guard = 0;
      while (
        segRef.current < last &&
        now - (segStartRef.current as number) >= SEG_MS &&
        guard < N
      ) {
        setBar(segRef.current, 100);
        barRefs[segRef.current].current?.classList.remove("scanstory-bar-live");
        segRef.current += 1;
        segStartRef.current = now;
        guard += 1;
        setSeg(segRef.current);
      }

      const i = segRef.current;
      const e = now - (segStartRef.current as number);
      const p = Math.min(1, e / SEG_MS); // linear = constant rate, the Instagram look

      if (i >= last) {
        // Final segment: fill steadily to 100%, then hold full (pulsing) until
        // the hidden-cost result lands — only the end ever waits, never mid-fill.
        paintBars(last, p);
        if (e >= SEG_MS && fullReadyRef.current) { finish(); return; }
      } else {
        paintBars(i, p);
      }

      if (!sfxPlayed && i >= 3) { sfxPlayed = true; void playSfx("scan_complete"); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Diagnostics: a frozen bar means the main thread was blocked (rAF starved).
  // Log every long task (>80ms) while this screen is up so a real scan pinpoints
  // exactly what stalls the animation, instead of guessing.
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    let obs: PerformanceObserver | null = null;
    try {
      obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration >= 80) {
            console.warn(`[scan-perf] main thread blocked ${Math.round(entry.duration)}ms — bars freeze while this runs`);
          }
        }
      });
      obs.observe({ type: "longtask", buffered: true });
    } catch {
      /* longtask entry type unsupported (e.g. Safari) — skip */
    }
    return () => obs?.disconnect();
  }, []);

  const metaCls = "text-[11.5px] uppercase tracking-[0.04em] text-white/65";

  // Flowing placeholder shown while a data card is on screen but its value has
  // not streamed in yet (slow-analysis path) — never a frozen "0" or "—".
  const Shimmer = ({ w, h = 30, r = 8 }: { w: number | string; h?: number; r?: number }) => (
    <span
      className="scanstory-shimmer"
      style={{ display: "inline-block", width: typeof w === "number" ? `${w}px` : w, height: h, borderRadius: r, verticalAlign: "middle" }}
      aria-hidden
    />
  );

  return (
    <div
      className="scanui-surface relative flex h-full min-h-[34rem] flex-col overflow-hidden rounded-[28px] px-5 pt-5 pb-[18px]"
      role="status"
      aria-live="polite"
    >
      <div className="scanui-blob scanui-blob-p scanui-blob-drift" aria-hidden />
      <div className="scanui-blob scanui-blob-g scanui-blob-drift" aria-hidden />

      {/* Instagram-style segmented progress — one bar per card, time-driven */}
      <div className="scanui-bars relative z-[1] mb-3.5">
        {SCAN_SEGMENTS.map((_, i) => (
          <div key={i} className="scanui-bar">
            <i ref={barRefs[i] as React.Ref<HTMLElement>} className="scanstory-barfill" />
          </div>
        ))}
      </div>

      <p className="relative z-[1] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {t("scanReveal.eyebrow")}
      </p>

      {/* Stage */}
      <div className="relative z-[1] mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
        {seg <= 1 ? (
          // ── Status cards (upload / reading) — no data needed, fully animated ──
          <div key={seg === 0 ? "upload" : "reading"} className="scanstory-ent flex min-h-0 flex-1 flex-col items-center justify-center text-center">
            {seg === 0 ? (
              <div className="relative mb-6 flex h-[116px] w-[116px] items-center justify-center" aria-hidden>
                <Loader2 className="absolute h-[116px] w-[116px] animate-spin text-white/15" strokeWidth={1} />
                <span className="scanui-gold-ic flex h-16 w-16 items-center justify-center rounded-2xl">
                  <FileText className="h-7 w-7" />
                </span>
              </div>
            ) : (
              <div className="scanui-frame relative mx-auto mb-6 h-[122px] w-[122px]" aria-hidden>
                <span className="cr tl" />
                <span className="cr tr" />
                <span className="cr bl" />
                <span className="cr br" />
                <span className="gl">
                  <span className="scanui-gold-ic flex h-11 w-11 items-center justify-center rounded-2xl">
                    <ScanText className="h-6 w-6" />
                  </span>
                </span>
              </div>
            )}
            <h2 className="receipt-analyzing-pulse scanstory-display text-[24px] font-semibold leading-tight tracking-tight text-white">
              {seg === 0 ? t("scanReveal.uploading") : t("scanReveal.reading")}
            </h2>
          </div>
        ) : seg === 2 ? (
          // ── Receipt read (merchant/total) ──
          <div key="b0" className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
              <div className="scanstory-ent scanstory-rhero scanstory-display" style={delay(".05s")}>
                <div className="pf" />
                <div className="rmerch">{cardMerchant || <Shimmer w="62%" h={20} r={6} />}</div>
                <div className="rsub">
                  {cardSchema || (cardMerchant ? "" : <Shimmer w="40%" h={11} r={5} />)}
                  {cardItemCount > 0 ? ` · ${t("scanReveal.itemCount", { count: cardItemCount })}` : ""}
                </div>
                <div className="rline" style={{ width: "78%", height: 5, margin: "7px 0" }} />
                <div className="rline" style={{ width: "62%", height: 5, margin: "7px 0" }} />
                <div className="rline" style={{ width: "70%", height: 5, margin: "7px 0" }} />
                <div className="rtotal">
                  <span>{t("scanReveal.paidLabel")}</span>
                  <b>{cardTotal > 0 ? cardMoney(cardTotal) : <Shimmer w={90} h={18} r={6} />}</b>
                </div>
              </div>
            </div>
            <div>
              <div className={`scanstory-ent ${metaCls}`} style={delay(".15s")}>{t("scanReveal.receiptRead")}</div>
              <div className="scanstory-ent scanstory-display text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] text-white" style={{ ...delay(".24s"), marginTop: 8 }}>
                {hasReceiptInfo ? t("scanReveal.readHeadline", { merchant: cardMerchant }) : t("scanReveal.reading")}
              </div>
            </div>
          </div>
        ) : seg === 3 ? (
          // ── Value vs paid ──
          <div key="b1" className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col items-stretch justify-center">
              <div className="scanstory-ent flex items-end justify-between gap-3" style={delay(".05s")}>
                <div>
                  <div className="text-[11.5px] text-white/60">{t("scanReveal.valueLabel")}</div>
                  <div className="scanstory-display text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] tabular-nums text-white">{fullReady ? money(cuValue) : <Shimmer w={110} />}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11.5px] text-white/60">{t("scanReveal.paidLabel")}</div>
                  <div className="scanstory-display text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] tabular-nums" style={{ color: SCANUI_GOLD, textShadow: "0 0 20px rgba(255,198,90,.5)" }}>{fullReady ? money(cuPaid) : <Shimmer w={110} />}</div>
                </div>
              </div>
              <div className="scanstory-ent mt-3 flex h-[42px] overflow-hidden rounded-xl" style={{ ...delay(".14s"), background: "var(--scanui-split-bg)", boxShadow: "inset 0 0 0 1px var(--scanui-split-inset)" }}>
                {fullReady ? (
                  <>
                    <div style={{ width: `${valueShare * 100}%`, background: "var(--scanui-val-fill)", transition: "width .9s cubic-bezier(.16,.84,.3,1)" }} />
                    <div className="scanui-shine" style={{ width: `${(1 - valueShare) * 100}%`, background: "linear-gradient(90deg,#F0A93A,#FFC65A)", boxShadow: "0 0 26px rgba(255,180,60,.5)", transition: "width .9s cubic-bezier(.16,.84,.3,1)" }} />
                  </>
                ) : (
                  <Shimmer w="100%" h={42} r={12} />
                )}
              </div>
              <div className="scanstory-ent mt-3 flex items-center gap-2 text-[12px] text-white/60" style={delay(".22s")}>
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SCANUI_GOLD, boxShadow: "0 0 10px rgba(255,198,90,.7)" }} />
                {t("scanReveal.splitCap")}
              </div>
            </div>
            <div className="scanstory-ent scanstory-display text-[24px] font-semibold leading-[1.18] tracking-[-0.02em] text-white" style={delay(".32s")}>
              {fullReady ? t("scanReveal.valueSentence", { value: money(value), paid: money(total) }) : <Shimmer w="80%" h={22} r={7} />}
            </div>
          </div>
        ) : seg === 4 ? (
          // ── Layers ──
          <div key="b2" className="flex min-h-0 flex-1 flex-col">
            <div className="scanstory-ent scanstory-display text-[24px] font-semibold leading-[1.18] tracking-[-0.02em] text-white" style={delay(".05s")}>
              {t("scanReveal.layersTitle")}
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-end">
              <div className="flex flex-col gap-[15px]">
                {(layerRows.length > 0
                  ? layerRows
                  : [{ label: "", pct: 0 }, { label: "", pct: 0 }, { label: "", pct: 0 }]
                ).map((row, i) => (
                  <div key={i} className="scanstory-ent" style={delay(`${0.2 + i * 0.16}s`)}>
                    <div className="mb-[7px] flex items-center gap-[11px]">
                      <span className="scanui-gold-ic scanstory-display flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[9px] text-[12px] font-semibold">{i + 1}</span>
                      {row.label
                        ? <span className="text-[15.5px] font-medium text-white/95">{row.label}</span>
                        : <Shimmer w="46%" h={15} r={6} />}
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-[4px]" style={{ background: "var(--scanui-track)" }}>
                      {row.label
                        ? <div className="scanui-ratiofill h-full rounded-[4px]" style={{ width: `${row.pct}%`, transition: "width .9s cubic-bezier(.16,.84,.3,1)" }} />
                        : <Shimmer w="100%" h={7} r={4} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // ── Hidden share ──
          <div key="b3" className="flex min-h-0 flex-1 flex-col">
            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
              <div className="scanui-glowring" aria-hidden />
              <div className={`scanstory-ent ${metaCls} text-center`} style={delay(".02s")}>{t("scanReveal.shareLabel")}</div>
              <div className="scanui-hero-num scanstory-display scanui-pop tabular-nums text-[80px]" style={{ marginTop: 12 }}>{fullReady ? fmt(cuHidden) : <Shimmer w={180} h={64} r={14} />}</div>
              <div className="scanstory-ent text-[14px] text-white/60" style={{ ...delay(".3s"), marginTop: 14 }}>{(currency || cardCurrency)} · {t("scanReveal.unit")}</div>
              <div className="scanstory-ent text-center text-[12.5px] text-white/45" style={{ ...delay(".45s"), marginTop: 8 }}>{t("scanReveal.opening")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-[1] mt-3 flex items-center justify-center">
        {!fullReady && canLeaveScreen && onLeaveScreen ? (
          <button
            type="button"
            onClick={onLeaveScreen}
            className="scanui-gold rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-opacity hover:opacity-90 active:opacity-80"
          >
            {leaveButtonText || t("scanReveal.eyebrow")}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-white/45">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: SCANUI_GOLD }} />
            <p className="text-[11.5px] leading-snug">{t("mine.privacy.description")}</p>
          </div>
        )}
      </div>

      {ended && (
        <div className="scanstory-endhint">
          <div className="text-[12.5px] text-white/55">{t("scanReveal.doneEyebrow")}</div>
          <div className="scanstory-display text-[19px] font-semibold" style={{ color: SCANUI_GOLD }}>{t("scanReveal.doneHeadline")}</div>
        </div>
      )}
    </div>
  );
}

// —— 2. Result (hidden cost found) ——
interface ResultStepProps {
  receipt: Receipt;
  onContinue: () => void;
  onCancel?: () => void;
  locale?: string;
  accountLevel?: number;
}

export function ReceiptResultStep({ receipt, onContinue, onCancel, accountLevel = 1 }: ResultStepProps) {
  const tier = useTier(accountLevel);
  const { t } = useAppLocale();
  const hiddenCost = displayHiddenCost(receipt);
  const totalPaid = receipt.total;
  const productValue = Math.max(0, receipt.hiddenCost.productValue ?? totalPaid - hiddenCost);
  const hiddenPercent = displayHiddenPercent(receipt);
  const labels = { title: t("pipeline.hiddenCostFound"), hidden: t("mine.hiddenCost"), paid: t("pipeline.paid"), realValue: t("pipeline.realValue"), viewDetails: t("pipeline.viewDetails"), cancel: t("common.cancel") };

  return (
    <ThemeCard accountLevel={accountLevel} className="p-5">
      <h2 className="text-lg font-semibold text-center mb-4" style={{ color: "var(--app-text-primary)" }}>{labels.title}</h2>
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--app-bg-elevated)" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm" style={{ color: "var(--app-text-muted)" }}>{labels.hidden}</span>
          <span className="font-semibold tabular-nums" style={{ color: tier.accent }}>{hiddenCost.toFixed(2)} {receipt.currency}</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span style={{ color: "var(--app-text-muted)" }}>{labels.paid}</span>
          <span style={{ color: "var(--app-text-primary)" }}>{totalPaid.toFixed(2)} {receipt.currency}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: "var(--app-text-muted)" }}>{labels.realValue}</span>
          <span style={{ color: "var(--app-text-primary)" }}>{productValue.toFixed(2)} {receipt.currency}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--app-border)" }}>
          <div className="h-full rounded-full" style={{ width: `${hiddenPercent}%`, background: tier.accent }} />
        </div>
      </div>
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
            style={{ borderColor: "var(--app-border)", color: "var(--app-text-secondary)" }}
          >
            {labels.cancel}
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
          style={{ background: `linear-gradient(135deg,${tier.accent},${tier.accent2})`, color: "#0a0a0a" }}
        >
          {labels.viewDetails}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </ThemeCard>
  );
}

// —— 2+3 combined: hidden cost found + cost breakdown (single screen) ——
interface ResultWithBreakdownStepProps {
  receipt: Receipt;
  onContinue: () => void;
  onCancel?: () => void;
  locale?: string;
  accountLevel?: number;
  /** When set, renders inline per-field correction (pencil) for this receipt. */
  editableReceiptId?: string;
  /** Called after an immediately-applied correction (merchant/date/time). */
  onFieldApplied?: (field: string, value: string) => void;
  /** Overrides the primary button label (e.g. "Save" when this is the terminal screen). */
  primaryLabel?: string;
  /** Disables + spins the primary button. */
  isSaving?: boolean;
}

export function ReceiptResultWithBreakdownStep({ receipt, onContinue, onCancel, locale: localeProp, accountLevel = 1, editableReceiptId, onFieldApplied, primaryLabel, isSaving = false }: ResultWithBreakdownStepProps) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [pendingFields, setPendingFields] = useState<Set<string>>(new Set());
  const { t, locale } = useAppLocale();
  const activeLocale = localeProp || locale;
  const copy = getMvpCopy(activeLocale);
  const breakdownDisplay = buildReceiptBreakdownDisplay(receipt, activeLocale);
  const hiddenCost = breakdownDisplay.hiddenCost;
  const totalPaid = receipt.total;
  const taxAmount = receipt.vat || receipt.hiddenCost.state || 0;
  const rewardAmount = getTotalRewardAmount(receipt.reward);
  const noRewardMessage = resolveNoRewardMessage(
    receipt.reward,
    t,
    noRewardOptionsForReceipt(receipt, hiddenCost)
  );
  const showPartialReward = shouldShowPartialRewardNotice(receipt.reward);
  const hiddenPercent = totalPaid > 0 ? Math.min(100, (hiddenCost / totalPaid) * 100) : 0;
  const schemaLabel = getCategorySchemaLabel(receipt.category, activeLocale, receipt.merchantChannel);
  const productValue = Math.max(0, receipt.hiddenCost.productValue ?? totalPaid - hiddenCost);
  const animatedHidden = useCountUp(hiddenCost, 900);

  // Behavioural read (deterministic, no LLM). Shown as an "estimated read".
  const xray = computeReceiptXRay(receipt);
  const persona = xray.merchantPersona;
  const personaLabel = t(`xrayCard.persona.${persona}`);
  const personaRead = t(`xrayCard.read.${persona}`, { merchant: receipt.merchantName });
  // Only show the persona card when its copy actually resolves in this locale.
  const showXray = personaLabel !== `xrayCard.persona.${persona}` && personaRead !== `xrayCard.read.${persona}`;

  // Sector comparison — fetched client-side from the verified benchmark table (T3).
  // Card renders only when a sourced, verified row exists for this category.
  const [sectorAvg, setSectorAvg] = useState<number | null>(null);
  const [sectorSource, setSectorSource] = useState<string | null>(null);
  const sectorCountry = (receipt as { country?: string }).country || "TR";
  useEffect(() => {
    if (!receipt.category) return;
    let alive = true;
    fetch(`/api/sector-benchmark?category=${encodeURIComponent(receipt.category)}&country=${encodeURIComponent(sectorCountry)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.benchmark || typeof d.benchmark.ratioPct !== "number") return;
        setSectorAvg(Math.round(d.benchmark.ratioPct));
        setSectorSource(d.benchmark.source ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [receipt.category, sectorCountry]);

  const labels = { paid: t("pipeline.paid"), breakdownTitle: t("pipeline.breakdownTitle"), viewNext: t("pipeline.viewNext"), cancel: t("common.cancel") };

  // Evidence badges — theme-aware via scanui tokens (dark surface / light surface).
  const badgeStyle = (tone: "success" | "warning" | "muted") => ({
    background: tone === "success" ? "var(--scanui-badge-success-bg)" : tone === "warning" ? "var(--scanui-badge-warning-bg)" : "var(--scanui-badge-muted-bg)",
    border: tone === "success" ? "1px solid var(--scanui-badge-success-border)" : tone === "warning" ? "1px solid var(--scanui-badge-warning-border)" : "1px solid var(--scanui-badge-muted-border)",
    color: tone === "success" ? "var(--scanui-badge-success-text)" : tone === "warning" ? "var(--scanui-badge-warning-text)" : "var(--scanui-badge-muted-text)",
  });

  const pendingBadge = (field: string) =>
    pendingFields.has(field) ? (
      <span className="ml-1.5 inline-block align-middle whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px]" style={badgeStyle("warning")}>
        {t("correctionModal.awaitingApproval")}
      </span>
    ) : null;

  // Stacked-bar segments (non-government layers).
  const stackGroups = breakdownDisplay.groups.filter((g) => g.bucket !== "government");
  const stackIndex = (bucket: string) => stackGroups.findIndex((g) => g.bucket === bucket);

  return (
    <div className="scanui-surface relative flex h-full min-h-[34rem] flex-col overflow-hidden rounded-[28px]">
      <div className="scanui-blob scanui-blob-p" aria-hidden />
      <div className="scanui-blob scanui-blob-g" aria-hidden />

      <div className="relative z-[1] flex-1 overflow-y-auto px-4 pt-5 pb-4">
        {/* Header: category pill + "a field wrong?" */}
        <div className="scanui-rise flex items-center justify-between gap-2" style={{ animationDelay: "0.02s" }}>
          <span className="rounded-lg border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] text-white/60" style={{ borderColor: "var(--scanui-card-border)" }}>
            {schemaLabel}
          </span>
          {editableReceiptId && (
            <button type="button" onClick={() => setCorrectionOpen(true)} className="flex items-center gap-1.5 text-[12px]" style={{ color: SCANUI_GOLD }}>
              <Pencil className="h-3.5 w-3.5" />
              {t("correctionModal.button")}
            </button>
          )}
        </div>

        {/* Hero — hidden cost */}
        <div className="scanui-rise mt-4" style={{ animationDelay: "0.06s" }}>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-white/45">{copy.hiddenEstimate}</p>
          <p className="scanui-hero-num mt-1.5 text-[50px]">
            {animatedHidden.toFixed(2)} <span className="text-[18px] font-semibold" style={{ color: SCANUI_GOLD }}>{receipt.currency}</span>
          </p>
          <p className="mt-2 text-[12.5px] text-white/60">
            {receipt.merchantName}{pendingBadge("merchant_name")} · {receipt.date}{pendingBadge("date")}
            {(receipt as { time?: string }).time ? <> · {(receipt as { time?: string }).time}</> : null}{pendingBadge("time")}
          </p>
          <div className="mt-3.5 h-2 overflow-hidden rounded-full" style={{ background: "var(--scanui-track)" }}>
            <div className="scanui-ratiofill h-full rounded-full transition-[width] duration-700" style={{ width: `${hiddenPercent}%` }} />
          </div>
          <p className="mt-1.5 text-[11.5px] text-white/60">
            {t("resultHero.ratioCap", { paid: `${totalPaid.toFixed(0)} ${receipt.currency}`, pct: Math.round(hiddenPercent) })}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[copy.totalConfidence, taxAmount > 0 ? copy.taxConfidence : copy.noTaxConfidence, copy.distributionConfidence].map((chip) => (
              <span key={chip} className="rounded-md px-2 py-1 text-[10px] text-white/60" style={{ background: "var(--scanui-soft-bg)", border: "1px solid var(--scanui-card-border)" }}>{chip}</span>
            ))}
          </div>
        </div>

        {/* Stats: paid / VAT / product value */}
        <div className="scanui-rise mt-4 grid grid-cols-3 gap-2" style={{ animationDelay: "0.1s" }}>
          {[
            { l: labels.paid, v: totalPaid.toFixed(2), pending: "total" as string | null },
            { l: copy.taxRead, v: taxAmount.toFixed(2), pending: "vat" as string | null },
            { l: t("breakdown.productValue"), v: productValue.toFixed(2), pending: null as string | null },
          ].map((s, i) => (
            <div key={i} className="scanui-card p-3">
              <span className="text-[10.5px] text-white/55">{s.l}</span>
              <p className="mt-1.5 text-[16px] font-semibold tabular-nums text-white">{s.v}</p>
              {s.pending ? pendingBadge(s.pending) : null}
            </div>
          ))}
        </div>

        {/* Items read from the receipt — so it's clear what was captured */}
        {Array.isArray(receipt.lineItems) && receipt.lineItems.length > 0 && (
          <div className="scanui-rise scanui-card mt-3 p-4" style={{ animationDelay: "0.12s" }}>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold text-white">{t("receiptDetail.itemsTitle")}</span>
              <span className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={badgeStyle("success")}>{copy.receiptRead}</span>
            </div>
            <div className="space-y-2">
              {receipt.lineItems.map((it, i) => {
                const name = it.displayName || it.rawName || "—";
                const qty = it.quantity && it.quantity > 1 ? `${it.quantity}× ` : "";
                const amt = typeof it.lineTotal === "number" ? `${it.lineTotal.toFixed(2)} ${receipt.currency}` : "—";
                const needsBrand = it.brandStatus === "needs_user" && typeof it.id === "number";
                return (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-[13px] text-white/85">{qty}{name}</span>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-white">{amt}</span>
                    </div>
                    {needsBrand && (
                      <BrandPrompt lineItemId={it.id as number} productName={name} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Layers — where the hidden cost goes */}
        <div className="scanui-rise scanui-card mt-4 p-4" style={{ animationDelay: "0.14s" }}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[15px] font-semibold text-white">{labels.breakdownTitle}</span>
            <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "linear-gradient(140deg,#FFD37A,#FFB23E)", color: "#1c1638" }}>{schemaLabel}</span>
          </div>
          <p className="mb-3 text-[11.5px] leading-relaxed text-white/55">{breakdownDisplay.storyIntro}</p>

          {stackGroups.length > 0 && (
            <div className="mb-3.5 flex h-3 overflow-hidden rounded-full">
              {stackGroups.map((g, i) => (
                <div key={g.bucket} style={{ width: `${hiddenCost > 0 ? (g.total / hiddenCost) * 100 : 0}%`, background: LAYER_PALETTE[i % LAYER_PALETTE.length] }} />
              ))}
            </div>
          )}

          {breakdownDisplay.groups.length > 0 && (() => {
            const notice = getProvenanceNotice(receipt.hiddenCost.provenance, activeLocale);
            const success = notice.tone === "success";
            return (
              <div className="mb-3 flex items-start gap-2 rounded-xl p-3" style={{ background: success ? "rgba(63,217,160,0.1)" : "rgba(245,180,80,0.1)", border: `1px solid ${success ? "rgba(63,217,160,0.28)" : "rgba(245,180,80,0.28)"}` }}>
                <span className="mt-0.5 text-sm leading-none">{success ? "✅" : "ℹ️"}</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white/80">{notice.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/55">{notice.detail}</p>
                </div>
              </div>
            );
          })()}

          {breakdownDisplay.groups.length === 0 && taxAmount <= 0 && (
            <p className="text-[12px] leading-snug text-white/55">
              {String(activeLocale || "").toLowerCase().startsWith("tr") ? "Bu belgede gizli masraf hesaplanamadı veya bulunmamaktadır." : "No hidden cost could be calculated for this document."}
            </p>
          )}

          <div className="space-y-3">
            {breakdownDisplay.groups.map(({ bucket, items, total: bucketTotal }) => {
              const layer = getCostLayerCopy({ category: receipt.category, merchantChannel: receipt.merchantChannel, bucket, locale: activeLocale });
              const evidence = getEvidenceBadge({ bucket, amount: bucketTotal, locale: activeLocale });
              const pct = hiddenCost > 0 ? (bucketTotal / hiddenCost) * 100 : 0;
              const si = stackIndex(bucket);
              const dotColor = bucket === "government" ? "#8B5CF6" : LAYER_PALETTE[(si < 0 ? 0 : si) % LAYER_PALETTE.length];
              return (
                <div key={bucket} className="border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: "var(--scanui-line)" }}>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: dotColor }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[13.5px] font-medium text-white/90">{layer.label}</span>
                        <span className="text-[14px] font-semibold tabular-nums text-white">{bucketTotal > 0 ? `${bucketTotal.toFixed(2)} ${receipt.currency}` : "—"}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-white/55">{layer.description}{bucketTotal > 0 && hiddenCost > 0 ? ` · ${pct.toFixed(0)}%` : ""}</p>
                      <p className="mt-1 text-[10px]" style={{ color: SCANUI_GOLD }}>{t("sectorCompare.sourcePrefix")}: {evidence.label}</p>
                      {items.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {items.map((item, idx) => {
                            const itemEvidence = item.pendingAmount ? { label: copy.estimated, tone: "warning" as const } : getEvidenceBadge({ bucket, amount: item.amount, locale: activeLocale });
                            return (
                              <div key={`${bucket}-${item.label}-${idx}`} className="flex items-start justify-between gap-3 rounded-lg px-2.5 py-2" style={{ background: "var(--scanui-soft-bg)", border: "1px solid var(--scanui-soft-border)" }}>
                                <div className="min-w-0 pr-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11.5px] font-medium text-white/80">{item.label}</span>
                                    <span className="rounded-md px-1.5 py-0.5 text-[9px] font-medium" style={badgeStyle(itemEvidence.tone)}>{itemEvidence.label}</span>
                                  </div>
                                  <p className="mt-0.5 text-[10px] leading-snug text-white/50">{item.description}</p>
                                  {item.pendingAmount && <p className="mt-0.5 text-[10px] italic text-white/50">{copy.pendingLineAmount}</p>}
                                </div>
                                <span className="shrink-0 whitespace-nowrap text-[11.5px] font-semibold tabular-nums" style={{ color: item.amount > 0 ? "var(--scanui-ink)" : "var(--scanui-ink-muted)" }}>{item.amount > 0 ? `${item.amount.toFixed(2)} ${receipt.currency}` : "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {taxAmount > 0 && (
              <div className="border-t pt-3" style={{ borderColor: "var(--scanui-line)" }}>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: "#8B5CF6" }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13.5px] font-medium text-white/90">{getCostLayerCopy({ category: receipt.category, merchantChannel: receipt.merchantChannel, bucket: "government", locale: activeLocale }).label}</span>
                      <span className="text-[14px] font-semibold tabular-nums text-white">{taxAmount.toFixed(2)} {receipt.currency}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-white/55">{getCostLayerCopy({ category: receipt.category, merchantChannel: receipt.merchantChannel, bucket: "government", locale: activeLocale }).description}</p>
                    <p className="mt-1 text-[10px]" style={{ color: SCANUI_GOLD }}>{t("sectorCompare.sourcePrefix")}: {copy.receiptRead}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sector comparison — only with a sourced, verified benchmark */}
        {sectorAvg != null && (
          <div className="scanui-rise scanui-card mt-3 p-4" style={{ animationDelay: "0.18s" }}>
            <p className="mb-3 text-[15px] font-semibold text-white">{t("sectorCompare.title")}</p>
            <div className="mb-2 flex items-center gap-2.5">
              <span className="w-[64px] flex-none text-[11px] text-white/55">{t("sectorCompare.thisReceipt")}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--scanui-track)" }}><span className="scanui-ratiofill block h-full rounded-full" style={{ width: `${Math.round(hiddenPercent)}%` }} /></span>
              <span className="w-[34px] text-right text-[12.5px] font-semibold tabular-nums" style={{ color: SCANUI_GOLD }}>%{Math.round(hiddenPercent)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-[64px] flex-none text-[11px] text-white/55">{t("sectorCompare.sectorAvg")}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--scanui-track)" }}><span className="block h-full rounded-full" style={{ width: `${sectorAvg}%`, background: "var(--scanui-sector-avg-fill)" }} /></span>
              <span className="w-[34px] text-right text-[12.5px] font-semibold tabular-nums text-white/80">%{sectorAvg}</span>
            </div>
            {sectorSource && <p className="mt-2.5 text-[10px]" style={{ color: SCANUI_GOLD }}>{t("sectorCompare.sourcePrefix")}: {sectorSource}</p>}
          </div>
        )}

        {/* Receipt X-ray (persona) */}
        {showXray && (
          <div className="scanui-rise scanui-card mt-3 p-4" style={{ animationDelay: "0.22s" }}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold text-white">{t("xrayCard.title")}</span>
              <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "linear-gradient(140deg,#CABFFF,#9B8FF0)", color: "#1c1638" }}>{personaLabel}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-white/80">{personaRead}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-white/40">{t("xrayCard.estimateBadge")}</p>
          </div>
        )}

        {/* Reward */}
        <div className="scanui-rise scanui-card mt-3 p-4" style={{ animationDelay: "0.26s" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-white/55">{copy.rewardEstimate}</p>
              <p className="mt-0.5 text-[22px] font-bold tabular-nums" style={{ color: rewardAmount > 0 ? SCANUI_GOLD : "var(--scanui-ink-2)" }}>{rewardAmount.toFixed(2)} cPoints</p>
              {rewardAmount <= 0 && !noRewardMessage && (
                <span className="mt-1 inline-block whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px]" style={badgeStyle("warning")}>{t("correctionModal.underReview")}</span>
              )}
            </div>
            <Coins className="h-5 w-5" style={{ color: SCANUI_GOLD }} />
          </div>
          {showPartialReward && (
            <div className="mt-2 rounded-xl px-3 py-2" style={{ border: "1px solid rgba(124,160,255,0.3)", background: "rgba(124,160,255,0.1)" }}>
              <p className="text-[12px] font-medium text-white">{t("rewardCard.partial.title", { pct: Math.round((receipt.reward?.rewardFraction ?? 1) * 100) })}</p>
              {receipt.reward?.fullRewardEstimate != null && receipt.reward.fullRewardEstimate > rewardAmount && (
                <p className="mt-1 text-[11px] text-white/55">{t("rewardCard.partial.fullEstimate", { amount: receipt.reward.fullRewardEstimate.toFixed(2) })}</p>
              )}
              <p className="mt-1 text-[12px] text-white/70">{t("rewardCard.partial.followUp")}</p>
            </div>
          )}
          {noRewardMessage && (
            <p className="mt-2 rounded-xl px-3 py-2 text-[12px] text-white/70" style={{ border: "1px solid rgba(245,180,80,0.3)", background: "rgba(245,180,80,0.1)" }}>{noRewardMessage}</p>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-white/40">{copy.categorySchemaNote}</p>
      </div>

      {/* Action footer */}
      <div className="relative z-[1] flex gap-3 px-4 pb-4 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSaving} className="flex-1 rounded-xl border py-3 text-sm font-medium text-white/80 disabled:opacity-60" style={{ borderColor: "var(--scanui-card-border)" }}>
            {labels.cancel}
          </button>
        )}
        <button type="button" onClick={onContinue} disabled={isSaving} className="scanui-gold flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold disabled:opacity-60">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{primaryLabel ?? labels.viewNext}<ChevronRight className="h-4 w-4" /></>)}
        </button>
      </div>

      {editableReceiptId && (
        <FieldCorrectionModal
          open={correctionOpen}
          onOpenChange={setCorrectionOpen}
          receiptId={editableReceiptId}
          currentValues={{
            merchant_name: receipt.merchantName ?? "",
            date: receipt.date ?? "",
            time: (receipt as { time?: string }).time ?? "",
            total: receipt.total != null ? String(receipt.total) : "",
            vat: receipt.vat != null ? String(receipt.vat) : "",
          }}
          onCorrected={(results) => {
            results.forEach((r) => {
              if (r.appliedImmediately) onFieldApplied?.(r.field, r.value);
            });
            setPendingFields((prev) => new Set([...prev, ...results.map((r) => r.field)]));
          }}
        />
      )}
    </div>
  );
}

// —— 3. Cost breakdown (separate screen — now used in the combined screen) ——
interface BreakdownStepProps {
  receipt: Receipt;
  onBack: () => void;
  onContinue: () => void;
  locale?: string;
  accountLevel?: number;
  isAdmin?: boolean;
}

export function ReceiptBreakdownStep({ receipt, onBack, onContinue, accountLevel = 1 }: BreakdownStepProps) {
  const tier = useTier(accountLevel);
  const { t } = useAppLocale();
  const items = (receipt.hiddenCost.breakdownItems || []).filter((i) => i.bucket !== "government");
  const getBucketLabel = (bucket: string) => t(BUCKET_KEYS[bucket as keyof typeof BUCKET_KEYS] || BUCKET_KEYS.other);

  const byBucket = items.reduce((acc, item) => {
    const b = item.bucket || "other";
    if (!acc[b]) acc[b] = 0;
    acc[b] += item.amount;
    return acc;
  }, {} as Record<string, number>);
  const total = displayHiddenCost(receipt) || 1;

  return (
    <ThemeCard accountLevel={accountLevel} className="p-5">
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--app-text-primary)" }}>{t("pipeline.breakdownTitle")}</h2>
      <div className="space-y-3 mb-5">
        {Object.entries(byBucket).map(([bucket, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={bucket}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "var(--app-text-secondary)" }}>{getBucketLabel(bucket)}</span>
                <span className="tabular-nums" style={{ color: "var(--app-text-primary)" }}>{amount.toFixed(2)} {receipt.currency}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--app-border)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tier.accent }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--app-border)", color: "var(--app-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          {t("common.back")}
        </button>
        <button type="button" onClick={onContinue} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: `linear-gradient(135deg,${tier.accent},${tier.accent2})`, color: "#0a0a0a" }}>
          {t("pipeline.viewNext")}
          <ChevronRight className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </ThemeCard>
  );
}

// —— 4. Vector receipt + save receipt (single screen) ——
interface VectorReceiptStepProps {
  receipt: Receipt;
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
  locale?: string;
  accountLevel?: number;
}

export function ReceiptVectorReceiptStep({ receipt, onBack, onSave, isSaving = false, locale: localeProp = "tr", accountLevel = 1 }: VectorReceiptStepProps) {
  const tier = useTier(accountLevel);
  const { t, locale } = useAppLocale();
  const activeLocale = localeProp || locale;
  const isTr = String(activeLocale || "").toLowerCase().startsWith("tr");
  const copy = getMvpCopy(activeLocale);
  const schemaLabel = getCategorySchemaLabel(receipt.category, activeLocale, receipt.merchantChannel);
  const taxAmount = receipt.vat || receipt.hiddenCost.state || 0;
  const hiddenCost = displayHiddenCost(receipt);
  const totalReward = getTotalRewardAmount(receipt.reward);
  const noRewardMessage = resolveNoRewardMessage(
    receipt.reward,
    t,
    noRewardOptionsForReceipt(receipt, hiddenCost)
  );
  const showPartialReward = shouldShowPartialRewardNotice(receipt.reward);
  const totalPaid = receipt.totalPaid || receipt.total;
  const hiddenPercent = Math.min(100, displayHiddenPercent(receipt));

  return (
    <ThemeCard accountLevel={accountLevel} className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: tier.accent }}>
            {schemaLabel}
          </p>
          <h2 className="text-lg font-semibold mt-1" style={{ color: "var(--app-text-primary)" }}>
            {isTr ? "Fişi kaydetmeden kontrol et" : "Review before saving"}
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--app-text-muted)" }}>
            {receipt.merchantName} · {receipt.date}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
        >
          {copy.receiptRead}
        </span>
      </div>

      <div className="rounded-xl overflow-hidden max-h-[52vh] flex justify-center" style={{ border: "1px solid var(--app-border)" }}>
        <VectorReceipt
          receipt={receipt}
          locale={activeLocale}
          accountLevel={accountLevel}
          compact={false}
          className="w-full aspect-[2/3] max-h-[52vh] min-h-[260px]"
        />
      </div>

      <div className="rounded-xl p-3 space-y-3" style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>{copy.hiddenEstimate}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                {copy.estimated}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--app-text-muted)" }}>{copy.updateableReward}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums" style={{ color: tier.accent2 }}>
              {hiddenCost.toFixed(2)}
            </p>
            <p className="text-[10px] uppercase" style={{ color: "var(--app-text-muted)" }}>{receipt.currency}</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--app-border)" }}>
          <div className="h-full rounded-full" style={{ width: `${hiddenPercent}%`, background: tier.accent }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("receiptDetail.total"), value: totalPaid.toFixed(2), badge: copy.receiptRead, tone: "success" },
            { label: copy.taxRead, value: taxAmount.toFixed(2), badge: taxAmount > 0 ? copy.receiptRead : copy.verifying, tone: taxAmount > 0 ? "success" : "muted" },
            { label: t("mine.reward"), value: totalReward.toFixed(2), badge: copy.estimated, tone: "warning" },
          ].map((item) => (
            <div key={item.label} className="min-w-0 rounded-lg px-2.5 py-2" style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)" }}>
              <p className="truncate text-[10px]" style={{ color: "var(--app-text-muted)" }}>{item.label}</p>
              <p className="truncate text-sm font-bold tabular-nums" style={{ color: item.label === t("mine.reward") ? tier.accent : "var(--app-text-primary)" }}>
                {item.value}
              </p>
              <p
                className="truncate text-[9px] font-semibold"
                style={{
                  color: item.tone === "success" ? "#10b981" : item.tone === "warning" ? "#f59e0b" : "var(--app-text-muted)",
                }}
              >
                {item.badge}
              </p>
            </div>
          ))}
        </div>
        {showPartialReward && (
          <div className="rounded-lg px-3 py-2 text-left" style={{ border: "1px solid rgba(14,165,233,0.3)", background: "rgba(14,165,233,0.1)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--app-text-primary)" }}>
              {t("rewardCard.partial.title", { pct: Math.round((receipt.reward?.rewardFraction ?? 1) * 100) })}
            </p>
            {receipt.reward?.fullRewardEstimate != null &&
              receipt.reward.fullRewardEstimate > totalReward && (
                <p className="text-[11px] mt-1" style={{ color: "var(--app-text-muted)" }}>
                  {t("rewardCard.partial.fullEstimate", {
                    amount: receipt.reward.fullRewardEstimate.toFixed(2),
                  })}
                </p>
              )}
            <p className="text-xs mt-1" style={{ color: "var(--app-text-secondary)" }}>
              {t("rewardCard.partial.followUp")}
            </p>
          </div>
        )}
        {noRewardMessage && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)", color: "var(--app-text-secondary)" }}>
            {noRewardMessage}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--app-border)", color: "var(--app-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          {t("common.back")}
        </button>
        <button type="button" onClick={onSave} disabled={isSaving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: `linear-gradient(135deg,${tier.accent},${tier.accent2})`, color: "#0a0a0a" }}>
          {isSaving ? t("pipeline.saving") : t("pipeline.saveReceipt")}
        </button>
      </div>
    </ThemeCard>
  );
}

// —— Reward screen (legacy — save now happens on the vector receipt screen) ——
interface RewardStepProps {
  receipt: Receipt;
  onBack: () => void;
  onClaim: () => void;
  isSaving?: boolean;
  locale?: string;
  accountLevel?: number;
  isAdmin?: boolean;
}

export function ReceiptRewardStep({ receipt, onBack, onClaim, isSaving = false, accountLevel = 1 }: RewardStepProps) {
  const tier = useTier(accountLevel);
  const { t } = useAppLocale();
  const amount = receipt.reward?.amount ?? receipt.hiddenCost.totalHidden;

  return (
    <ThemeCard accountLevel={accountLevel} className="p-5">
      <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--app-text-primary)" }}>{t("pipeline.potentialReward")}</h2>
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-2xl font-bold tabular-nums" style={{ color: tier.accent }}>{amount.toFixed(2)}</span>
        <span className="text-sm" style={{ color: "var(--app-text-muted)" }}>cPoints</span>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--app-border)", color: "var(--app-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          {t("common.back")}
        </button>
        <button type="button" onClick={onClaim} disabled={isSaving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: `linear-gradient(135deg,${tier.accent},${tier.accent2})`, color: "#0a0a0a" }}>
          {isSaving ? t("pipeline.saving") : t("common.save")}
        </button>
      </div>
    </ThemeCard>
  );
}

// —— 5. Done ——
interface DoneStepProps {
  receipt: Receipt;
  onMineAnother: () => void;
  onViewReceipts: () => void;
  locale?: string;
  accountLevel?: number;
}

export function ReceiptDoneStep({ receipt, onMineAnother, onViewReceipts }: DoneStepProps) {
  const { t, locale } = useAppLocale();
  const copy = getMvpCopy(locale);
  const schemaLabel = getCategorySchemaLabel(receipt.category, locale, receipt.merchantChannel);
  const isTr = String(locale || "").toLowerCase().startsWith("tr");
  const hiddenCost = displayHiddenCost(receipt);
  const totalReward = getTotalRewardAmount(receipt.reward);
  const noRewardMessage = resolveNoRewardMessage(
    receipt.reward,
    t,
    noRewardOptionsForReceipt(receipt, hiddenCost)
  );
  const taxAmount = receipt.vat || receipt.hiddenCost.state || 0;
  const totalPaid = receipt.totalPaid || receipt.total;

  // Tone → flag colour on the scanui surface (theme-aware via tokens).
  const flagColor = (tone: "success" | "warning" | "muted") =>
    tone === "success" ? "var(--scanui-badge-success-text)" : tone === "warning" ? SCANUI_GOLD : "var(--scanui-ink-muted)";

  const cells: { label: string; value: string; badge: string; tone: "success" | "warning" | "muted"; gold?: boolean }[] = [
    { label: t("receiptDetail.total"), value: `${totalPaid.toFixed(2)} ${receipt.currency}`, badge: copy.receiptRead, tone: "success" },
    { label: copy.hiddenEstimate, value: `${hiddenCost.toFixed(2)} ${receipt.currency}`, badge: copy.estimated, tone: "warning" },
    { label: copy.rewardEstimate, value: `${totalReward.toFixed(2)} cPoints`, badge: copy.verifying, tone: "warning", gold: true },
    { label: copy.taxRead, value: `${taxAmount.toFixed(2)} ${receipt.currency}`, badge: taxAmount > 0 ? copy.receiptRead : copy.noTaxConfidence, tone: taxAmount > 0 ? "success" : "muted" },
  ];

  return (
    <div className="scanui-surface relative flex h-full min-h-[34rem] flex-col overflow-hidden rounded-[28px]">
      <div className="scanui-blob scanui-blob-p" aria-hidden />
      <div className="scanui-blob scanui-blob-g" aria-hidden />

      <div className="relative z-[1] flex-1 overflow-y-auto px-4 pt-6 pb-4">
        {/* Success tick */}
        <div className="scanui-rise flex flex-col items-center text-center" style={{ animationDelay: "0.04s" }}>
          <div className="relative mb-3 h-16 w-16">
            <span className="scanui-tick-glow" aria-hidden />
            <svg width="64" height="64" viewBox="0 0 78 78" fill="none" className="relative">
              <circle cx="39" cy="39" r="35" style={{ stroke: SCANUI_GOLD }} strokeWidth="3" opacity="0.5" />
              <path className="scanui-tick-ck" d="M27 40l8 8 16-17" style={{ stroke: SCANUI_GOLD }} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">{t("pipeline.doneTitle")}</h2>
          <p className="mt-1 text-[13px] text-white/60">{t("pipeline.doneSub")}</p>
        </div>

        {/* Summary card */}
        <div className="scanui-rise scanui-card mt-5 p-4" style={{ animationDelay: "0.12s" }}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.13em] text-white/40">{schemaLabel}</p>
              <p className="mt-1 text-[16px] font-semibold text-white">{isTr ? "Analiz kaydedildi" : "Analysis saved"}</p>
            </div>
            <span className="shrink-0 rounded-md px-2 py-1 text-[9.5px] font-semibold" style={{ background: "linear-gradient(140deg,#FFD37A,#FFB23E)", color: "#1c1638" }}>
              {copy.distributionConfidence}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cells.map((item) => (
              <div key={item.label} className="min-w-0 rounded-xl px-3 py-2.5" style={{ background: "var(--scanui-soft-bg)", border: "1px solid var(--scanui-soft-border)" }}>
                <p className="truncate text-[10px] text-white/55">{item.label}</p>
                <p className="mt-1 truncate text-[15px] font-semibold tabular-nums" style={{ color: item.gold ? SCANUI_GOLD : "var(--scanui-ink)" }}>
                  {item.value}
                </p>
                <p className="mt-1.5 truncate text-[9.5px] font-semibold" style={{ color: flagColor(item.tone) }}>
                  {item.badge}
                </p>
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
            style={{
              background: noRewardMessage ? "rgba(245,180,80,0.1)" : "rgba(255,170,60,0.09)",
              border: `1px solid ${noRewardMessage ? "rgba(245,180,80,0.28)" : "rgba(255,170,60,0.18)"}`,
            }}
          >
            <Info className="mt-px h-3.5 w-3.5 shrink-0" style={{ color: SCANUI_GOLD }} />
            <span className="text-[11px] leading-snug text-white/60">{noRewardMessage ?? copy.rewardWindowNote}</span>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-white/40">{copy.categorySchemaNote}</p>
      </div>

      {/* Action footer */}
      <div className="relative z-[1] flex gap-3 px-4 pb-4 pt-2">
        <button type="button" onClick={onViewReceipts} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-medium text-white/85" style={{ borderColor: "var(--scanui-card-border)", background: "var(--scanui-soft-bg)" }}>
          <FileText className="h-4 w-4" />
          {t("pipeline.viewReceipts")}
        </button>
        <button type="button" onClick={onMineAnother} className="scanui-gold flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold">
          <RotateCcw className="h-4 w-4" />
          {t("pipeline.scanAgain")}
        </button>
      </div>
    </div>
  );
}
