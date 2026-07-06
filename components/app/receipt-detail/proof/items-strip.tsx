"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getLocalReceiptImage } from "@/lib/local-db/receipt-images";
import { ChevronDown, Image as ImageIcon } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt, ReceiptLineItem } from "@/lib/mock/types";
import { NOTCH, flameText } from "./primitives";
import { CONDENSED, MONO, money } from "./theme";

const INITIAL = 6;

function formatQty(qty?: number | null, unitType?: string | null): string | null {
  if (qty == null || !Number.isFinite(qty)) return null;
  const isWhole = Number.isInteger(qty);
  const num = isWhole ? String(qty) : qty.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return unitType ? `${num} ${unitType}` : num;
}

function Row({ item, currency }: { item: ReceiptLineItem; currency: string }) {
  // Show the human-readable name. canonicalName is a machine slug
  // (e.g. "h_w_1500ml") meant for matching only — never surface it to the user.
  const name = item.displayName || item.rawName || "—";
  const hasTotal = item.lineTotal != null && Number.isFinite(item.lineTotal);
  const hasUnit = item.unitPrice != null && Number.isFinite(item.unitPrice);
  const meta = [item.brand || null, formatQty(item.quantity, item.unitType), hasUnit ? `× ${money(item.unitPrice as number, currency)}` : null].filter(Boolean).join(" · ");
  return (
    <div className="flex items-baseline gap-2 py-2">
      <span className="shrink-0 text-sm" style={{ color: "var(--pf-text)", fontFamily: MONO }}>{name}</span>
      {meta && <span className="shrink-0 text-[10px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{meta}</span>}
      <span className="mb-1 flex-1 self-end border-b border-dotted" style={{ borderColor: "var(--pf-line-strong)" }} />
      {hasTotal && <span className="shrink-0 text-sm font-bold" style={{ color: "var(--pf-soft)", fontFamily: MONO }}>{money(item.lineTotal as number, currency)}</span>}
    </div>
  );
}

export function ItemsStrip({ receipt }: { receipt: Receipt }) {
  const { t, locale } = useAppLocale();
  const isTr = locale === "tr";
  const [expanded, setExpanded] = useState(false);
  const items = receipt.lineItems ?? [];
  const currency = receipt.currency;
  if (items.length === 0) return null;

  const subtotal = items.reduce((s, it) => s + (Number.isFinite(it.lineTotal) ? (it.lineTotal as number) : 0), 0);

  const visible = items.slice(0, INITIAL);
  const rest = items.slice(INITIAL);

  return (
    <div
      className="relative px-5 py-5"
      style={{ background: "var(--pf-inset)", borderLeft: "1px solid var(--pf-line)", clipPath: NOTCH }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ ...flameText, fontFamily: MONO }}>
          {t("breakdown.itemsCount", { count: items.length })}
        </span>
      </div>
      <h3 className="mt-1 text-2xl font-bold uppercase leading-none tracking-tight" style={{ color: "var(--pf-text)", fontFamily: CONDENSED }}>
        {t("receiptDetail.itemsTitle")}
      </h3>

      <div className="mt-3">
        {visible.map((item, idx) => <Row key={idx} item={item} currency={currency} />)}
        <AnimatePresence initial={false}>
          {expanded && rest.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
              {rest.map((item, idx) => <Row key={`r-${idx}`} item={item} currency={currency} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {rest.length > 0 && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--pf-gold)", fontFamily: MONO }}>
          {expanded ? t("receiptDetail.showLess") : t("receiptDetail.showMore", { count: rest.length })}
          <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
        </button>
      )}

      {/* Printed sub-totals — the grand total is shown once in the hero, not repeated here */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-dashed pt-3" style={{ borderColor: "var(--pf-line)" }}>
        {subtotal > 0 && (
          <span className="text-[11px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
            {isTr ? "KALEM TOPLAMI" : "ITEMS SUBTOTAL"}: <span style={{ color: "var(--pf-soft)" }}>{money(subtotal, currency)}</span>
          </span>
        )}
        {receipt.vat > 0 && (
          <span className="text-[11px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
            {isTr ? "KDV" : "VAT"}: <span style={{ color: "var(--pf-soft)" }}>{money(receipt.vat, currency)}</span>
          </span>
        )}
      </div>

      {/* Original receipt — the actual paper */}
      <OriginalReceiptImage receipt={receipt} isTr={isTr} />
    </div>
  );
}

/**
 * Shows the scanned receipt photo. Prefers the URL embedded in receipt_data
 * (fast, no roundtrip); otherwise falls back to the owner/admin image endpoint,
 * which resolves the file from Vercel Blob, the Neon fallback, or local disk.
 * If nothing resolves (e.g. a locally-scanned receipt whose file lives only on
 * another machine), it shows a clear empty state instead of a broken image.
 */
function OriginalReceiptImage({ receipt, isTr }: { receipt: Receipt; isTr: boolean }) {
  const [failed, setFailed] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localChecked, setLocalChecked] = useState(false);

  // Device-first: the photo scanned on this device lives in IndexedDB and
  // outlives the short server-side retention window.
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    if (receipt.id) {
      getLocalReceiptImage(receipt.id)
        .then((blob) => {
          if (cancelled) return;
          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            setLocalUrl(objectUrl);
          }
          setLocalChecked(true);
        })
        .catch(() => setLocalChecked(true));
    } else {
      setLocalChecked(true);
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [receipt.id]);

  const directUrl = receipt.imageUrl;
  const apiUrl = receipt.id ? `/api/receipts/${encodeURIComponent(receipt.id)}/image` : null;
  const src = localUrl || directUrl || apiUrl;
  if (!localChecked || !src) return null;

  if (failed) {
    return (
      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
        <ImageIcon className="h-3.5 w-3.5" />
        {isTr ? "ORİJİNAL FİŞ GÖRSELİ BULUNAMADI" : "ORIGINAL RECEIPT IMAGE UNAVAILABLE"}
      </div>
    );
  }

  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="group mt-3 block">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--pf-gold)", fontFamily: MONO }}>
        <ImageIcon className="h-3.5 w-3.5" />
        {isTr ? "ORİJİNAL FİŞ" : "ORIGINAL RECEIPT"} →
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="receipt"
        onError={() => setFailed(true)}
        className="mt-1.5 max-h-56 w-auto rounded-md object-contain transition-opacity group-hover:opacity-90"
        style={{ border: "1px solid var(--pf-line)" }}
      />
    </a>
  );
}
