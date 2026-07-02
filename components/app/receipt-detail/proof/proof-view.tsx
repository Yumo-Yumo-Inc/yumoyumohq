"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ChevronLeft, Coins, Download, Share2, Trash2 } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import {
  getCostLayerCopy,
  getEvidenceBadge,
  getProvenanceNotice,
  getMvpCopy,
  getCategorySchemaLabel,
} from "@/lib/receipt/cost-layer-display";
import { buildReceiptBreakdownDisplay } from "@/lib/receipt/build-breakdown-display";
import { displayHiddenCost } from "@/lib/receipt/display-hidden-cost";
import { computeReceiptXRay } from "@/lib/receipt/xray/compute-xray";
import type { Receipt } from "@/lib/mock/types";
import { proofVars, FLAME, MONO } from "./theme";
import { useTheme } from "@/lib/theme/theme-context";
import { Reveal, Stamp } from "./primitives";
import { RewardSeal } from "./reward-seal";
import { ItemsStrip } from "./items-strip";
import { MetaTags } from "./meta-tags";

/** Positional palette for hidden-cost layers (distinct colour per layer). */
const PF_LAYER_PALETTE = ["#9B8FF0", "#3FD9A0", "#FFC65A", "#F2A03C", "#7CA0FF", "#E879A8"];

interface ProofViewProps {
  receipt: Receipt;
  onBack: () => void;
  onShare: () => void;
  onDownloadCard: () => void;
  onDelete: () => void;
  onReportBug: () => void;
  onDateCorrect: () => void;
  isDeleting?: boolean;
  isDownloadingCard?: boolean;
  /** When rendered inside a dialog instead of a full page: drops the page-breakout margins. */
  inModal?: boolean;
}

export function ProofView(props: ProofViewProps) {
  const { receipt, onBack, onShare, onDownloadCard, onDelete, onReportBug, onDateCorrect, isDeleting, isDownloadingCard, inModal } = props;
  const { t, locale } = useAppLocale();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isTr = locale === "tr";

  const hc = receipt.hiddenCost;
  const currency = receipt.currency;
  const total = receipt.total || 0;
  const vat = receipt.vat || hc.state || 0;

  // Card-list breakdown (same data-honest helpers the in-flow result step uses).
  const breakdownDisplay = buildReceiptBreakdownDisplay(receipt, locale);
  const hidden = displayHiddenCost(receipt);
  const productValue = Math.max(0, hc.productValue ?? total - hidden);
  const hiddenPctPaid = total > 0 ? Math.min(100, (hidden / total) * 100) : 0;
  const schemaLabel = getCategorySchemaLabel(receipt.category, locale, receipt.merchantChannel);
  const mvp = getMvpCopy(locale);
  const stackGroups = breakdownDisplay.groups.filter((g) => g.bucket !== "government");
  const stackIndex = (bucket: string) => stackGroups.findIndex((g) => g.bucket === bucket);

  const verified = receipt.status === "VERIFIED";
  const rejected = receipt.status === "REJECTED";
  const statusLabel = verified ? t("status.verified") : rejected ? t("status.rejected") : t("status.pending");
  const statusColor = verified ? "#34D399" : rejected ? "#F87171" : "#C9A84C";
  const conf = Math.round(receipt.confidence <= 1 ? receipt.confidence * 100 : receipt.confidence);
  const metaLine = [
    receipt.category && receipt.category !== "other" ? receipt.category : null,
    receipt.date,
    receipt.time || null,
    receipt.country || null,
    `${isTr ? "okuma" : "read"} %${conf}`,
  ].filter(Boolean).join("  ·  ");

  const showDateBanner = receipt.reward?.noRewardReasonCode === "out_of_current_month";
  const dateOnly = (receipt.date || "").split("T")[0];
  const isFutureDate = !!dateOnly && dateOnly > new Date().toISOString().split("T")[0];

  // Behavioural read (deterministic, no LLM) — shown as an "estimated read".
  const persona = computeReceiptXRay(receipt).merchantPersona;
  const personaLabel = t(`xrayCard.persona.${persona}`);
  const personaRead = t(`xrayCard.read.${persona}`, { merchant: receipt.merchantName });
  const showXray =
    personaLabel !== `xrayCard.persona.${persona}` && personaRead !== `xrayCard.read.${persona}`;

  // Sector comparison — verified, sourced benchmark only (T3). Card hidden if none.
  const [sectorAvg, setSectorAvg] = useState<number | null>(null);
  const [sectorSource, setSectorSource] = useState<string | null>(null);
  useEffect(() => {
    if (!receipt.category) return;
    let alive = true;
    const country = receipt.country || "TR";
    fetch(`/api/sector-benchmark?category=${encodeURIComponent(receipt.category)}&country=${encodeURIComponent(country)}`)
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
  }, [receipt.category, receipt.country]);

  return (
    <div style={proofVars(isLight)} className={inModal ? "relative min-h-full overflow-hidden" : "relative -m-3 min-h-screen overflow-hidden sm:-m-4 lg:-mx-8 lg:-my-6"}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% -10%, rgba(201,168,76,0.07) 0%, transparent 55%), linear-gradient(180deg, var(--pf-bg1) 0%, var(--pf-bg0) 100%)" }} />
      <div className="pointer-events-none absolute -top-44 left-1/2 h-[26rem] w-[130%] -translate-x-1/2 blur-3xl" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 62%)" }} />

      <div className="relative mx-auto w-full max-w-5xl space-y-5 px-4 py-5 pb-28 lg:px-6 lg:py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="group inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--pf-soft)", background: "var(--pf-inset)", borderLeft: "2px solid var(--pf-line-strong)", fontFamily: MONO }}>
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t("common.back")}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onDownloadCard} disabled={isDownloadingCard} title={t("receiptDetail.downloadCard")} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line-strong)", color: "var(--pf-text)", fontFamily: MONO }}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("receiptDetail.downloadCard")}</span>
            </button>
            <button type="button" onClick={onShare} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-transform hover:scale-[1.03] active:scale-95" style={{ background: FLAME, color: "#10131A", clipPath: "polygon(8px 0, 100% 0, 100% 100%, 0 100%)", boxShadow: "0 8px 22px var(--pf-glow)", fontFamily: MONO }}>
              <Share2 className="h-3.5 w-3.5" />
              {t("common.share")}
            </button>
          </div>
        </div>

        {showDateBanner && (
          <Reveal>
            <div className="flex items-start gap-3 rounded-2xl px-5 py-4" style={{ background: "var(--pf-inset)", borderLeft: "3px solid var(--pf-amber)" }}>
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--pf-amber)" }} />
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "var(--pf-text)" }}>{t(isFutureDate ? "correctionModal.dateConfirm.futureTitle" : "correctionModal.dateConfirm.title")}</p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--pf-mute)" }}>{t(isFutureDate ? "correctionModal.dateConfirm.futureBody" : "correctionModal.dateConfirm.body", { date: dateOnly })}</p>
                <button type="button" onClick={onDateCorrect} className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide" style={{ background: FLAME, color: "#10131A", fontFamily: MONO }}>{t("correctionModal.dateConfirm.cta")}</button>
              </div>
            </div>
          </Reveal>
        )}

        <div className="mx-auto max-w-xl space-y-3">
          {/* Category + status */}
          <Reveal>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-lg border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: "var(--pf-soft)", borderColor: "var(--pf-line-strong)", fontFamily: MONO }}>{schemaLabel}</span>
              <Stamp label={statusLabel} color={statusColor} />
            </div>
          </Reveal>

          {/* Hero — hidden cost */}
          <Reveal>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{mvp.hiddenEstimate}</p>
              <p className="mt-1 text-[50px] font-bold leading-none tracking-tight" style={{ background: FLAME, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 5px 26px rgba(255,180,60,0.45))" }}>
                {hidden.toFixed(2)} <span className="text-[18px] font-semibold" style={{ color: "var(--pf-gold)", WebkitTextFillColor: "var(--pf-gold)" }}>{currency}</span>
              </p>
              <p className="mt-2 text-[11.5px] uppercase tracking-wide" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{metaLine}</p>
              <div className="mt-3.5 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}><div className="h-full rounded-full" style={{ width: `${hiddenPctPaid}%`, background: FLAME }} /></div>
              <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--pf-soft)" }}>{t("resultHero.ratioCap", { paid: `${total.toFixed(0)} ${currency}`, pct: Math.round(hiddenPctPaid) })}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[mvp.totalConfidence, vat > 0 ? mvp.taxConfidence : mvp.noTaxConfidence, mvp.distributionConfidence].map((chip) => (
                  <span key={chip} className="rounded-md px-2 py-1 text-[10px]" style={{ color: "var(--pf-mute)", background: "var(--pf-inset)", border: "1px solid var(--pf-line)" }}>{chip}</span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: isTr ? "Ödenen" : "Paid", v: total.toFixed(2) },
                { l: mvp.taxRead, v: vat.toFixed(2) },
                { l: t("breakdown.productValue"), v: productValue.toFixed(2) },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-3" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)" }}>
                  <span className="text-[10.5px]" style={{ color: "var(--pf-mute)" }}>{s.l}</span>
                  <p className="mt-1.5 text-[16px] font-semibold tabular-nums" style={{ color: "var(--pf-text)" }}>{s.v}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Reward */}
          <Reveal><div className="flex justify-start"><RewardSeal receipt={receipt} /></div></Reveal>

          {/* Breakdown — where the hidden cost goes */}
          <Reveal>
            <div className="rounded-2xl p-4" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)" }}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[15px] font-semibold" style={{ color: "var(--pf-text)" }}>{t("pipeline.breakdownTitle")}</span>
                <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: FLAME, color: "#1c1638" }}>{schemaLabel}</span>
              </div>
              <p className="mb-3 text-[11.5px] leading-relaxed" style={{ color: "var(--pf-soft)" }}>{breakdownDisplay.storyIntro}</p>
              {stackGroups.length > 0 && (
                <div className="mb-3.5 flex h-3 overflow-hidden rounded-full">
                  {stackGroups.map((g, i) => (<div key={g.bucket} style={{ width: `${hidden > 0 ? (g.total / hidden) * 100 : 0}%`, background: PF_LAYER_PALETTE[i % PF_LAYER_PALETTE.length] }} />))}
                </div>
              )}
              {breakdownDisplay.groups.length > 0 && (() => {
                const notice = getProvenanceNotice(receipt.hiddenCost.provenance, locale);
                const success = notice.tone === "success";
                return (
                  <div className="mb-3 flex items-start gap-2 rounded-xl p-3" style={{ background: success ? "rgba(63,217,160,0.1)" : "rgba(245,180,80,0.1)", border: `1px solid ${success ? "rgba(63,217,160,0.28)" : "rgba(245,180,80,0.28)"}` }}>
                    <span className="mt-0.5 text-sm leading-none">{success ? "✅" : "ℹ️"}</span>
                    <div className="min-w-0"><p className="text-[12px] font-semibold" style={{ color: "var(--pf-text)" }}>{notice.label}</p><p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--pf-mute)" }}>{notice.detail}</p></div>
                  </div>
                );
              })()}
              <div className="space-y-3">
                {breakdownDisplay.groups.map(({ bucket, items: _items, total: bucketTotal }) => {
                  const layer = getCostLayerCopy({ category: receipt.category, merchantChannel: receipt.merchantChannel, bucket, locale });
                  const evidence = getEvidenceBadge({ bucket, amount: bucketTotal, locale });
                  const pct = hidden > 0 ? (bucketTotal / hidden) * 100 : 0;
                  const si = stackIndex(bucket);
                  const dot = bucket === "government" ? "#8B5CF6" : PF_LAYER_PALETTE[(si < 0 ? 0 : si) % PF_LAYER_PALETTE.length];
                  return (
                    <div key={bucket} className="border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: "var(--pf-line)" }}>
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: dot }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[13.5px] font-medium" style={{ color: "var(--pf-text)" }}>{layer.label}</span>
                            <span className="text-[14px] font-semibold tabular-nums" style={{ color: "var(--pf-text)" }}>{bucketTotal > 0 ? `${bucketTotal.toFixed(2)} ${currency}` : "—"}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--pf-mute)" }}>{layer.description}{bucketTotal > 0 && hidden > 0 ? ` · ${pct.toFixed(0)}%` : ""}</p>
                          <p className="mt-1 text-[10px]" style={{ color: "var(--pf-gold)" }}>{t("sectorCompare.sourcePrefix")}: {evidence.label}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {vat > 0 && (
                  <div className="border-t pt-3" style={{ borderColor: "var(--pf-line)" }}>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: "#8B5CF6" }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13.5px] font-medium" style={{ color: "var(--pf-text)" }}>{getCostLayerCopy({ category: receipt.category, merchantChannel: receipt.merchantChannel, bucket: "government", locale }).label}</span>
                          <span className="text-[14px] font-semibold tabular-nums" style={{ color: "var(--pf-text)" }}>{vat.toFixed(2)} {currency}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--pf-mute)" }}>{getCostLayerCopy({ category: receipt.category, merchantChannel: receipt.merchantChannel, bucket: "government", locale }).description}</p>
                        <p className="mt-1 text-[10px]" style={{ color: "var(--pf-gold)" }}>{t("sectorCompare.sourcePrefix")}: {mvp.receiptRead}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Sector comparison — only with a sourced, verified benchmark */}
          {sectorAvg != null && (
            <Reveal>
              <div className="rounded-2xl p-4" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)" }}>
                <p className="mb-3 text-[15px] font-semibold" style={{ color: "var(--pf-text)" }}>{t("sectorCompare.title")}</p>
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="w-16 shrink-0 text-[11px]" style={{ color: "var(--pf-mute)" }}>{t("sectorCompare.thisReceipt")}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.09)" }}><span className="block h-full rounded-full" style={{ width: `${Math.round(hiddenPctPaid)}%`, background: FLAME }} /></span>
                  <span className="w-9 text-right text-[12.5px] font-bold tabular-nums" style={{ color: "var(--pf-gold)" }}>%{Math.round(hiddenPctPaid)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-16 shrink-0 text-[11px]" style={{ color: "var(--pf-mute)" }}>{t("sectorCompare.sectorAvg")}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.09)" }}><span className="block h-full rounded-full" style={{ width: `${sectorAvg}%`, background: "rgba(255,255,255,0.32)" }} /></span>
                  <span className="w-9 text-right text-[12.5px] font-bold tabular-nums" style={{ color: "var(--pf-soft)" }}>%{sectorAvg}</span>
                </div>
                {sectorSource && <p className="mt-2.5 text-[10px]" style={{ color: "var(--pf-gold)" }}>{t("sectorCompare.sourcePrefix")}: {sectorSource}</p>}
              </div>
            </Reveal>
          )}

          {/* Receipt X-ray (persona) — estimated behavioural read */}
          {showXray && (
            <Reveal>
              <div className="rounded-2xl p-4" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)" }}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold" style={{ color: "var(--pf-text)" }}>{t("xrayCard.title")}</span>
                  <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "linear-gradient(140deg,#CABFFF,#9B8FF0)", color: "#1c1638" }}>{personaLabel}</span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--pf-text)" }}>{personaRead}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--pf-mute)" }}>{t("xrayCard.estimateBadge")}</p>
              </div>
            </Reveal>
          )}

          {/* Printed items + record */}
          <Reveal><ItemsStrip receipt={receipt} /></Reveal>
          <Reveal><MetaTags receipt={receipt} onReportBug={onReportBug} /></Reveal>
        </div>

        <div className="flex justify-center pt-2">
          <button type="button" onClick={onDelete} disabled={isDeleting} className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wide disabled:opacity-50" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? t("receiptDetail.deleting") : t("receiptDetail.deleteReceipt")}
          </button>
        </div>
      </div>
    </div>
  );
}
