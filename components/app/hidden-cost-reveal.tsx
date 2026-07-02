"use client";

/**
 * HiddenCostReveal — cinematic hidden-cost reveal screen
 *
 * Design principle:
 *   The user already knows what they paid.
 *   This screen shows them why they paid it.
 *   In sequence, slowly, in a personal tone.
 *
 * Usage:
 *   <HiddenCostReveal receipt={receipt} onContinue={...} onCancel={...} />
 *
 *   Can substitute for ReceiptResultWithBreakdownStep;
 *   takes the same props.
 */

import { useEffect, useState, useRef } from "react";
import { useTier } from "@/lib/theme/theme-context";
import type { Receipt } from "@/lib/mock/types";
import { getBreakdownItemCopy } from "@/lib/receipt/breakdown-item-copy";
import { getProvenanceNotice } from "@/lib/receipt/cost-layer-display";

// ── Helper: animate a number counting up ──────────────────────────────────────
function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    setValue(0);
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      // ease-out cubic
      const progress = 1 - Math.pow(1 - step / steps, 3);
      setValue(target * progress);
      if (step >= steps) {
        setValue(target);
        clearInterval(timer);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return value;
}

// ── Bucket label ──────────────────────────────────────────────────────────────
const BUCKET_LABELS: Record<string, { tr: string; emoji: string }> = {
  store:      { tr: "Market marjı",      emoji: "🏪" },
  supply:     { tr: "Tedarik zinciri",   emoji: "🚛" },
  retail:     { tr: "Marka primi",       emoji: "🏷️" },
  excise:     { tr: "ÖTV",               emoji: "💸" },
  government: { tr: "Vergi / Devlet",    emoji: "🏛️" },
  other:      { tr: "Diğer masraflar",   emoji: "📦" },
};

function getBucketLabel(bucket?: string) {
  return BUCKET_LABELS[bucket ?? "other"] ?? BUCKET_LABELS.other;
}

// ── Personal context sentence ───────────────────────────────────────────────────
function contextMessage(
  hiddenCost: number,
  totalPaid: number,
  currency: string,
  merchantName: string,
): string {
  const pct = totalPaid > 0 ? (hiddenCost / totalPaid) * 100 : 0;
  if (pct < 5)  return `${merchantName}'da bu sefer iyi bir alışveriş yaptın. Gizli maliyet düşük kaldı.`;
  if (pct < 15) return `Her ${currency}${Math.round(totalPaid / hiddenCost)} harcamandan biri perde arkasına gitti.`;
  if (pct < 30) return `Ödediğin paranın %${pct.toFixed(0)}'i ürünle değil, arka plan maliyetleriyle gitti.`;
  return `Toplam faturanın %${pct.toFixed(0)}'i ürün dışı kalemlere ödendi. Bu rakamı artık biliyorsun.`;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface HiddenCostRevealProps {
  receipt: Receipt;
  onContinue: () => void;
  onCancel?: () => void;
  accountLevel?: number;
}

// ── Main component ──────────────────────────────────────────────────────────────
export function HiddenCostReveal({
  receipt,
  onContinue,
  onCancel,
  accountLevel = 1,
}: HiddenCostRevealProps) {
  const tier    = useTier(accountLevel);
  const acc     = tier.accent;        // gold / tier color
  const hiddenCost   = receipt.hiddenCost.totalHidden;
  const totalPaid    = receipt.total;
  const productValue = Math.max(0, receipt.hiddenCost.productValue ?? totalPaid - hiddenCost);
  const items        = (receipt.hiddenCost.breakdownItems ?? []).filter((i) => i.bucket !== "government");
  const currency     = receipt.currency;

  // ── Animation sequencing ─────────────────────────────────────────────────
  // Each stage is a boolean; useEffects flip them to true with a delay.
  const [showHeader,    setShowHeader]    = useState(false);
  const [showPaid,      setShowPaid]      = useState(false);
  const [showDivider,   setShowDivider]   = useState(false);
  const [showHidden,    setShowHidden]    = useState(false);
  const [showItems,     setShowItems]     = useState(false);
  const [itemCount,     setItemCount]     = useState(0);
  const [showContext,   setShowContext]   = useState(false);
  const [showCtas,      setShowCtas]      = useState(false);
  const [glowActive,    setGlowActive]    = useState(false);

  const startCountUp = showHidden;
  const animatedHidden = useCountUp(hiddenCost, 900, startCountUp);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setShowHeader(true),   120));
    timers.push(setTimeout(() => setShowPaid(true),     420));
    timers.push(setTimeout(() => setShowDivider(true),  950));
    timers.push(setTimeout(() => setShowHidden(true),  1300));
    timers.push(setTimeout(() => setGlowActive(true),  1400));
    timers.push(setTimeout(() => setShowItems(true),   2400));
    // Reveal items one at a time
    items.forEach((_, i) => {
      timers.push(setTimeout(() => setItemCount(i + 1), 2400 + i * 200));
    });
    const afterItems = 2400 + items.length * 200;
    timers.push(setTimeout(() => setShowContext(true), afterItems + 300));
    timers.push(setTimeout(() => setShowCtas(true),   afterItems + 700));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = contextMessage(hiddenCost, totalPaid, currency, receipt.merchantName);

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "24px 20px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        position: "relative",
      }}
    >
      {/* ── Background glow — activates at reveal ───────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          transition: "opacity 1.2s ease",
          opacity: glowActive ? 1 : 0,
          background: `radial-gradient(ellipse 70% 45% at 50% 0%, ${acc}14 0%, transparent 70%)`,
        }}
      />

      {/* ── 1. Merchant heading ─────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
          transition: "opacity .5s ease, transform .5s ease",
          opacity: showHeader ? 1 : 0,
          transform: showHeader ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--app-text-muted)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>
          {receipt.merchantName}
        </p>
        <p style={{ fontSize: 12, color: "var(--app-text-muted)", opacity: .6 }}>
          {new Date(receipt.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── 2. Amount paid ──────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 28,
          transition: "opacity .6s ease, transform .6s ease",
          opacity: showPaid ? 1 : 0,
          transform: showPaid ? "translateY(0)" : "translateY(10px)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--app-text-muted)", marginBottom: 8 }}>
          Kasada ödediğin
        </p>
        <p style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-.02em", color: "var(--app-text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {totalPaid.toFixed(2)}
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--app-text-muted)", marginLeft: 6 }}>{currency}</span>
        </p>
        <p style={{ fontSize: 13, color: "var(--app-text-muted)", marginTop: 8 }}>
          Ürün değeri: <span style={{ color: "var(--app-text-secondary)", fontWeight: 600 }}>{productValue.toFixed(2)} {currency}</span>
        </p>
      </div>

      {/* ── Divider line ─────────────────────────────────────────────────── */}
      <div
        style={{
          height: 1,
          marginBottom: 28,
          background: `linear-gradient(90deg, transparent, ${acc}40, transparent)`,
          transition: "opacity .8s ease, transform .8s ease",
          opacity: showDivider ? 1 : 0,
          transform: showDivider ? "scaleX(1)" : "scaleX(0.3)",
          transformOrigin: "center",
        }}
      />

      {/* ── 3. Hidden cost — the main beat ──────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
          transition: "opacity .6s ease, transform .6s ease",
          opacity: showHidden ? 1 : 0,
          transform: showHidden ? "translateY(0)" : "translateY(12px)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--app-text-muted)", marginBottom: 10 }}>
          Ürün dışı maliyetler
        </p>

        {/* Large figure */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 6,
            padding: "14px 28px",
            borderRadius: 20,
            border: `1.5px solid ${acc}35`,
            background: `linear-gradient(135deg, ${acc}10, ${acc}05)`,
            boxShadow: glowActive ? `0 0 40px ${acc}25, inset 0 0 20px ${acc}08` : "none",
            transition: "box-shadow 1.2s ease",
          }}
        >
          <span
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: acc,
              letterSpacing: "-.03em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {animatedHidden.toFixed(2)}
          </span>
          <span style={{ fontSize: 20, fontWeight: 600, color: acc, opacity: .8 }}>{currency}</span>
        </div>
      </div>

      {/* ── 4. Line item breakdown ──────────────────────────────────────────── */}
      {items.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 28,
            transition: "opacity .5s ease",
            opacity: showItems ? 1 : 0,
          }}
        >
          {(() => {
            const notice = getProvenanceNotice(receipt.hiddenCost.provenance, "tr");
            const ok = notice.tone === "success";
            return (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 12,
                  background: ok ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                  border: `1px solid ${ok ? "rgba(16,185,129,0.30)" : "rgba(245,158,11,0.30)"}`,
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1.2 }}>{ok ? "✅" : "ℹ️"}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--app-text-secondary)" }}>{notice.label}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.35, color: "var(--app-text-muted)", marginTop: 2 }}>{notice.detail}</div>
                </div>
              </div>
            );
          })()}
          {items.map((item, i) => {
            const { tr: bucketLabel, emoji } = getBucketLabel(item.bucket);
            const itemLabel = getBreakdownItemCopy(item.label, item.description, "tr").label;
            const pct = hiddenCost > 0 ? (item.amount / hiddenCost) * 100 : 0;
            const visible = i < itemCount;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 14,
                  background: "var(--app-bg-surface)",
                  border: "1px solid var(--app-border)",
                  transition: "opacity .4s ease, transform .4s ease",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(16px)",
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>

                {/* Label and bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "var(--app-text-secondary)", fontWeight: 500 }}>
                      {itemLabel || bucketLabel}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--app-text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {item.amount.toFixed(2)} {currency}
                    </span>
                  </div>
                  {/* Bar */}
                  <div style={{ height: 3, borderRadius: 99, background: "var(--app-border)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: `linear-gradient(90deg, ${acc}80, ${acc})`,
                        width: visible ? `${pct}%` : "0%",
                        transition: "width .7s ease .2s",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Personal context sentence ────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          padding: "14px 16px",
          borderRadius: 14,
          background: "var(--app-bg-surface)",
          border: `1px solid ${acc}25`,
          marginBottom: 28,
          transition: "opacity .7s ease, transform .7s ease",
          opacity: showContext ? 1 : 0,
          transform: showContext ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <p style={{ fontSize: 14, color: "var(--app-text-secondary)", lineHeight: 1.6, margin: 0 }}>
          {ctx}
        </p>
      </div>

      {/* ── 6. CTA ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          transition: "opacity .6s ease, transform .6s ease",
          opacity: showCtas ? 1 : 0,
          transform: showCtas ? "translateY(0)" : "translateY(10px)",
        }}
      >
        <button
          type="button"
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(135deg, ${acc}, ${tier.accent2 ?? acc})`,
            color: "#0a0a0a",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: ".01em",
            boxShadow: `0 4px 20px ${acc}30`,
          }}
        >
          Ödülü Topla ve Devam Et
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 16,
              border: "1px solid var(--app-border)",
              background: "transparent",
              cursor: "pointer",
              color: "var(--app-text-muted)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Şimdi değil
          </button>
        )}
      </div>
    </div>
  );
}
