"use client";

/**
 * Merchant card — hero card tinted with the brand color (Cleo / Apple Card style).
 * Real brand logo via Logo.dev, falls back to the Lucide Store icon.
 * Expands inline on click, revealing the recent receipts list.
 */

import { useState } from "react";
import { Store, ChevronRight, X } from "lucide-react";
import type { MockReceipt } from "./mock-receipts";
import { resolveMerchantDomain } from "@/lib/insights/merchant-domain";

export interface MerchantCardData {
  name: string;
  category: string;
  visits: number;
  total: number;
  avgBasket: number;
  accent: string; // hex
  domain?: string;
  /** Self-hosted logo URL from merchant_logos (preferred over live CDN). */
  logoUrl?: string;
  timeline?: number[];
}

interface MerchantCardProps {
  merchant: MerchantCardData;
  receipts: MockReceipt[];
  expanded: boolean;
  onToggle: () => void;
  dCurrency: (n: number) => string;
  locale: string;
}

function shade(hex: string, amount: number): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  const adjust = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

function textOn(hex: string): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "#FFFFFF";
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#1A1505" : "#FFFFFF";
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

// Logo.dev URL builder. Token comes from the NEXT_PUBLIC_LOGODEV_TOKEN env var;
// without it the call fails with an empty token and the component falls back to the icon via onError.
function logoUrl(domain: string): string {
  const token = process.env.NEXT_PUBLIC_LOGODEV_TOKEN || "";
  return `https://img.logo.dev/${domain}?token=${token}&size=128&format=png&fallback=monogram`;
}

export function MerchantCard({
  merchant,
  receipts,
  expanded,
  onToggle,
  dCurrency,
  locale,
}: MerchantCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  // Logo source priority:
  //  1. logoUrl — self-hosted asset from merchant_logos (no third-party call).
  //  2. domain  — explicit prop, rendered via logo.dev CDN.
  //  3. resolved domain from the merchant name (known TR chains) via CDN.
  //  4. none → icon fallback. Unknown merchants never get a fabricated logo.
  const resolvedDomain = merchant.domain ?? resolveMerchantDomain(merchant.name);
  const logoSrc = merchant.logoUrl ?? (resolvedDomain ? logoUrl(resolvedDomain) : undefined);
  const accent = merchant.accent;
  const txt = textOn(accent);
  const shadow = txt === "#FFFFFF" ? "0 1px 2px rgba(0,0,0,0.3)" : undefined;
  const accentMuted = txt === "#FFFFFF" ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.65)";
  const cells = merchant.timeline ?? [];

  return (
    <li
      className="overflow-hidden rounded-2xl"
      style={{
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
      }}
    >
      {/* HERO (clickable) — tinted with the brand color */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="relative block w-full overflow-hidden text-left"
        style={{
          background: `linear-gradient(150deg, ${accent} 0%, ${shade(accent, -0.18)} 100%)`,
          boxShadow: `inset 0 1px 0 ${shade(accent, 0.35)}88, inset 0 -1px 0 rgba(0,0,0,0.25)`,
          cursor: "pointer",
        }}
      >
        {/* Top-left sheen overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(120% 60% at 0% 0%, rgba(255,255,255,0.18), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div className="relative grid items-center gap-3 p-4 sm:gap-4 sm:p-5" style={{ gridTemplateColumns: "48px minmax(0,1fr) auto" }}>
          {/* Logo circle */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{
              background: "rgba(255,255,255,0.95)",
              boxShadow: `0 2px 8px rgba(0,0,0,0.18), inset 0 0 0 1px ${shade(accent, 0.35)}55`,
            }}
          >
            {logoSrc && !logoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={merchant.name + " logo"}
                width={36}
                height={36}
                onError={() => setLogoFailed(true)}
                style={{ display: "block", objectFit: "contain" }}
              />
            ) : (
              <Store size={20} strokeWidth={2.2} style={{ color: shade(accent, -0.3) }} />
            )}
          </div>

          {/* Middle: name + category + visits */}
          <div className="min-w-0">
            <div
              className="truncate text-[17px] font-semibold leading-tight"
              style={{ color: txt, textShadow: shadow, letterSpacing: "-0.005em" }}
            >
              {merchant.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px]" style={{ color: accentMuted }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>{merchant.category}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span><span className="font-mono">{merchant.visits}</span> {locale === "tr" ? "ziyaret" : "visits"}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{locale === "tr" ? "ort." : "avg"} <span className="font-mono">{dCurrency(merchant.avgBasket)}</span></span>
            </div>
          </div>

          {/* Right: amount + chevron */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div
                className="font-mono font-bold leading-none tracking-[-0.02em]"
                style={{
                  fontSize: 22,
                  color: txt,
                  textShadow: shadow,
                  fontFeatureSettings: '"tnum"',
                  whiteSpace: "nowrap",
                }}
              >
                {dCurrency(merchant.total)}
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.08em]"
                style={{ color: accentMuted }}
              >
                {locale === "tr" ? "Toplam" : "Total"}
              </div>
            </div>
            <div
              style={{
                color: txt,
                opacity: 0.7,
                transition: "transform 0.25s ease",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Bottom: 30-day visit timeline */}
        {cells.length > 0 && (
          <div className="relative px-4 pb-4 sm:px-5 sm:pb-5">
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
            >
              {cells.map((v, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: 3,
                    background: v
                      ? `rgba(${txt === "#FFFFFF" ? "255,255,255" : "0,0,0"}, 0.85)`
                      : `rgba(${txt === "#FFFFFF" ? "255,255,255" : "0,0,0"}, 0.18)`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </button>

      {/* INLINE DETAIL — expands on click */}
      {expanded && (
        <div
          className="border-t"
          style={{
            background: "var(--app-bg-elevated)",
            borderColor: "var(--app-border)",
            animation: "merchantDetailIn 0.22s ease-out",
          }}
        >
          <style>{`
            @keyframes merchantDetailIn {
              from { opacity: 0; max-height: 0; }
              to { opacity: 1; max-height: 1000px; }
            }
          `}</style>
          {receipts.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-app-text-muted">
              {locale === "tr" ? "Henüz fiş yok." : "No receipts yet."}
            </div>
          ) : (
            <ul className="m-0 list-none divide-y p-0" style={{ borderColor: "var(--app-border)" }}>
              {receipts.map((r) => (
                <li
                  key={r.id}
                  className="grid cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                  style={{ gridTemplateColumns: "44px minmax(0,1fr) auto 14px", borderColor: "var(--app-border)" }}
                >
                  <div
                    className="font-mono text-[11px] font-semibold uppercase tracking-wide text-app-text-muted"
                    style={{ textAlign: "center" }}
                  >
                    {formatDate(r.date, locale)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-app-text-primary">
                      {r.merchant}
                    </div>
                    <div className="text-[11.5px] text-app-text-muted">
                      {r.itemCount} {locale === "tr" ? "kalem" : "items"}
                    </div>
                  </div>
                  <div className="font-mono text-[14px] font-semibold text-app-text-primary">
                    {dCurrency(r.total)}
                  </div>
                  <ChevronRight size={14} className="text-app-text-muted" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
