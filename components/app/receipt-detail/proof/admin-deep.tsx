"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, Download, Shield, Trash2 } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";
import { NOTCH } from "./primitives";
import { CONDENSED, MONO } from "./theme";

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ background: "var(--pf-inset)", borderLeft: "2px solid var(--pf-line)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--pf-soft)", fontFamily: MONO }}>{title}</span>
        <ChevronDown className="h-4 w-4 transition-transform" style={{ color: "var(--pf-mute)", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * A bounded, scrollable log box with a one-click copy button. The whole point:
 * long pipeline/OCR logs stay inside a fixed-height scroller (never push the
 * page off-screen) and the full text is copyable even when it doesn't all fit.
 */
function LogBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable (insecure context) — fall back to selecting nothing
    }
  };
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)", color: copied ? "#34D399" : "var(--pf-text)", fontFamily: MONO }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <pre
        className="max-h-[55vh] overflow-auto whitespace-pre-wrap break-words rounded p-3 text-[11px] leading-relaxed"
        style={{ background: "rgba(0,0,0,0.35)", color: "var(--pf-soft)", fontFamily: MONO }}
      >
        {text}
      </pre>
    </div>
  );
}

interface AdminDeepProps {
  receipt: Receipt;
  onDownloadImage: () => void;
  onDelete: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export function AdminDeep({ receipt, onDownloadImage, onDelete, isDownloading, isDeleting }: AdminDeepProps) {
  const { t } = useAppLocale();
  const fraud = receipt.fraudInfo;
  const ptc = receipt.pickedTotalCandidate;
  const ocrText =
    receipt.ocrRawText ||
    (receipt.ocrLines && receipt.ocrLines.length > 0
      ? receipt.ocrLines.map((l) => `${l.lineNo}: ${l.text}`).join("\n")
      : "");

  return (
    <div className="px-5 py-5" style={{ background: "rgba(0,0,0,0.25)", borderLeft: "3px solid var(--pf-coral)", clipPath: NOTCH }}>
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4" style={{ color: "var(--pf-coral)" }} />
        <h3 className="text-2xl font-bold uppercase leading-none tracking-tight" style={{ color: "var(--pf-coral)", fontFamily: CONDENSED }}>
          {t("receiptDetail.adminSection")}
        </h3>
      </div>

      <div className="space-y-2">
        {/* PIPELINE — the full analysis log, scrollable + copyable */}
        <Section title="PIPELINE LOG" defaultOpen>
          {ptc && (
            <div className="mb-2 text-[11px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
              picked total: <span style={{ color: "var(--pf-soft)" }}>{ptc.value}</span> · score {ptc.score} · line {ptc.fromLine}
              {ptc.reasons?.length > 0 && <span> · {ptc.reasons.join(", ")}</span>}
            </div>
          )}
          {receipt.reasons && receipt.reasons.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs" style={{ color: "var(--pf-soft)", fontFamily: MONO }}>
              {receipt.reasons.map((r, i) => <li key={i}>· {r}</li>)}
            </ul>
          )}
          {receipt.pipelineLog ? (
            <LogBlock text={receipt.pipelineLog} />
          ) : (
            <p className="text-xs" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>no pipeline log</p>
          )}
        </Section>

        {/* OCR — kept collapsed; full text scrollable + copyable */}
        <Section title={`OCR · ${receipt.ocrLines?.length ?? 0} lines`}>
          {ocrText ? (
            <LogBlock text={ocrText} />
          ) : (
            <p className="text-xs" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>no OCR text</p>
          )}
        </Section>

        {/* FRAUD */}
        {fraud && (
          <Section title={`FRAUD · ${fraud.riskLevel} · ${fraud.fraudScore}`}>
            {fraud.warnings?.length > 0 && (
              <ul className="mb-2 list-inside list-disc space-y-1 text-xs" style={{ color: "var(--pf-amber)" }}>
                {fraud.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
            {fraud.rejectionReasons?.length > 0 && (
              <ul className="list-inside list-disc space-y-1 text-xs" style={{ color: "var(--pf-coral)" }}>
                {fraud.rejectionReasons.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
            {fraud.checks && (
              <div className="mt-2 text-[11px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
                {Object.entries(fraud.checks).map(([k, v]) => `${k}=${v}`).join("  ·  ")}
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={onDownloadImage} disabled={isDownloading} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide disabled:opacity-50" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)", color: "var(--pf-text)", fontFamily: MONO }}>
          <Download className="h-3.5 w-3.5" />
          {isDownloading ? t("receiptDetail.downloading") : t("receiptDetail.downloadImage")}
        </button>
        <button type="button" onClick={onDelete} disabled={isDeleting} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide disabled:opacity-50" style={{ background: "color-mix(in srgb, var(--pf-coral) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--pf-coral) 50%, transparent)", color: "var(--pf-coral)", fontFamily: MONO }}>
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? t("receiptDetail.deleting") : t("receiptDetail.deleteReceipt")}
        </button>
      </div>
    </div>
  );
}
