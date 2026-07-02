"use client";

/**
 * Inline detail panel that opens below the bubble chart when a category is clicked.
 * Header + recent receipt list + close button.
 */

import { ChevronRight, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getReceiptsForCategory } from "./mock-receipts";

export interface CategoryDetailProps {
  categoryKey: string;
  label: string;
  color: string;
  Icon: LucideIcon;
  amount: number;
  pct: number;
  dCurrency: (n: number) => string;
  locale: string;
  onClose: () => void;
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

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function CategoryDetail({
  categoryKey,
  label,
  color,
  Icon,
  amount,
  pct,
  dCurrency,
  locale,
  onClose,
}: CategoryDetailProps) {
  const receipts = getReceiptsForCategory(categoryKey);
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: "var(--app-bg-elevated)",
        borderColor: "var(--app-border)",
        boxShadow: "var(--app-shadow-card)",
        animation: "categoryDetailIn 0.25s ease-out",
      }}
    >
      <style>{`
        @keyframes categoryDetailIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3.5"
        style={{ borderColor: "var(--app-border)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(150deg, ${color}, ${shade(color, -0.2)})`,
            color: "white",
            boxShadow: `inset 0 1px 0 ${shade(color, 0.35)}88`,
          }}
        >
          <Icon size={18} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-app-text-primary">{label}</div>
          <div className="mt-0.5 font-mono text-[11.5px] text-app-text-muted">
            {dCurrency(amount)} · %{pct}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
          style={{ color: "var(--app-text-secondary)" }}
          aria-label={locale === "tr" ? "Kapat" : "Close"}
        >
          <X size={16} />
        </button>
      </div>
      {/* Receipt list */}
      {receipts.length === 0 ? (
        <div className="px-4 py-6 text-center text-[13px] text-app-text-muted">
          {locale === "tr" ? "Bu kategoride henüz fiş yok." : "No receipts in this category yet."}
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
                <div className="truncate text-[14px] font-medium text-app-text-primary">{r.merchant}</div>
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
      {/* View-all-receipts link */}
      <div
        className="border-t px-4 py-3 text-center"
        style={{ borderColor: "var(--app-border)" }}
      >
        <button
          type="button"
          className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors hover:opacity-80"
          style={{ color: "var(--app-gold)" }}
        >
          {locale === "tr" ? "Tüm fişleri gör" : "View all receipts"} →
        </button>
      </div>
    </div>
  );
}
