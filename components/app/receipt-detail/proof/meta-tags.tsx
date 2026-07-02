"use client";

import { Bug, Camera, Copy } from "lucide-react";
import Link from "next/link";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";
import { NOTCH, SLANT, flameText } from "./primitives";
import { MONO } from "./theme";

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3.5 py-2" style={{ background: "var(--pf-inset)", borderLeft: "2px solid var(--pf-line-strong)", clipPath: SLANT }}>
      <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{label}</div>
      <div className="mt-0.5 text-sm font-semibold" style={{ color: "var(--pf-soft)" }}>{value}</div>
    </div>
  );
}

function Callout({ icon: Icon, color, title, body, children }: { icon: typeof Copy; color: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4" style={{ background: "var(--pf-inset)", borderLeft: `3px solid ${color}`, clipPath: NOTCH }}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} />
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: "var(--pf-text)" }}>{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--pf-mute)" }}>{body}</p>
        {children}
      </div>
    </div>
  );
}

export function MetaTags({ receipt, onReportBug }: { receipt: Receipt; onReportBug: () => void }) {
  const { t, locale } = useAppLocale();
  const isTr = locale === "tr";
  const dup = receipt.duplicateCheck;

  let uploaded = receipt.createdAt;
  try {
    uploaded = new Date(receipt.createdAt).toLocaleString(isTr ? "tr-TR" : undefined, { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    /* keep raw */
  }
  const expense = receipt.expenseType === "other" ? (isTr ? "Başkası adına" : "On behalf") : isTr ? "Kişisel" : "Personal";
  // Show the real merchant category (e.g. "Market"), not merchantChannel — the
  // merchants table has no `channel` column, so merchantChannel was always "other".
  const categoryKey = (receipt.category || "").trim();
  const categoryTranslated = categoryKey ? t(`insights.categories.${categoryKey}`) : "";
  const category =
    categoryTranslated && !categoryTranslated.includes("insights.categories")
      ? categoryTranslated
      : categoryKey
        ? categoryKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "";

  return (
    <div className="space-y-3">
      {dup?.isDuplicate && (
        <Callout icon={Copy} color="var(--pf-amber)" title={t("receiptDetail.duplicateTitle")} body={t("receiptDetail.duplicateBody")}>
          {dup.matchedReceiptId && (
            <Link href={`/app/receipts/${dup.matchedReceiptId}`} className="mt-2 inline-flex text-xs font-bold hover:underline" style={{ color: "var(--pf-amber)" }}>
              {t("receiptDetail.viewOriginal")} →
            </Link>
          )}
        </Callout>
      )}
      {receipt.marginViolation?.hasViolation && (
        <Callout icon={Camera} color="var(--pf-peach)" title={t("receiptDetail.photoTipTitle")} body={isTr ? "Fişi koyu bir zemine koyup tüm kenarlardan biraz boşluk bırakırsan okuma kalitesi artar." : "Place the receipt on a dark surface with a little space around all edges."} />
      )}

      <div className="flex items-center gap-2">
        <span className="h-[3px] w-5 rounded-full" style={{ background: "var(--pf-flame)" }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ ...flameText, fontFamily: MONO }}>{isTr ? "KÜNYE" : "RECORD"}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Tag label={isTr ? "Tip" : "Type"} value={expense} />
        {receipt.country && <Tag label={isTr ? "Ülke" : "Country"} value={receipt.country} />}
        <Tag label={isTr ? "Yüklendi" : "Uploaded"} value={uploaded} />
        {category && <Tag label={isTr ? "Kategori" : "Category"} value={category} />}
        <Tag label="Fiş #" value={receipt.id.slice(0, 10)} />
      </div>

      <button type="button" onClick={onReportBug} className="inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ background: "var(--pf-inset)", borderLeft: "2px solid var(--pf-line-strong)", clipPath: SLANT, color: "var(--pf-mute)", fontFamily: MONO }}>
        <Bug className="h-3.5 w-3.5" />
        {t("correctionModal.button")}
      </button>
    </div>
  );
}
