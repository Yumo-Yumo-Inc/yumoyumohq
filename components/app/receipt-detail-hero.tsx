"use client";

import { motion } from "framer-motion";
import { ThemeCard } from "@/components/app/theme-card";
import { VectorReceipt } from "@/components/app/vector-receipt";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, Clock3, Share2 } from "lucide-react";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import type { Receipt } from "@/lib/mock/types";
import {
  getCategorySchemaLabel,
  getMvpCopy,
  isReceiptVerified,
} from "@/lib/receipt/cost-layer-display";
import { displayHiddenCost } from "@/lib/receipt/display-hidden-cost";

interface ReceiptDetailHeroProps {
  receipt: Receipt;
  accountLevel?: number;
  onBack?: () => void;
  onShare?: () => void;
  showVectorReceipt?: boolean;
  compact?: boolean;
}

export function ReceiptDetailHero({
  receipt,
  accountLevel = 1,
  onBack,
  onShare,
  showVectorReceipt = true,
  compact = false,
}: ReceiptDetailHeroProps) {
  const tier = useTier(accountLevel);
  const { t, locale } = useAppLocale();
  const acc = tier.accent;
  const copy = getMvpCopy(locale);
  const schemaLabel = getCategorySchemaLabel(receipt.category, locale, receipt.merchantChannel);
  const taxAmount = receipt.vat || receipt.hiddenCost.state || 0;
  const shownHidden = displayHiddenCost(receipt);
  const verified = isReceiptVerified(receipt.status);
  const isTr = String(locale || "").toLowerCase().startsWith("tr");
  const timeline = [
    { label: isTr ? "OCR tamamlandı" : "OCR complete", done: true },
    { label: `${isTr ? "Kategori" : "Category"}: ${schemaLabel}`, done: true },
    { label: verified ? copy.lineVerificationDone : copy.lineVerificationPending, done: verified },
    {
      label: receipt.reward.claimable
        ? isTr ? "Reward hazır" : "Reward ready"
        : isTr ? "Reward beklemede" : "Reward pending",
      done: receipt.reward.claimable,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top row: back + share */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">{t("common.back")}</span>
          </button>
        )}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: `${acc}20`,
              border: `1px solid ${acc}40`,
              color: acc,
            }}
          >
            <Share2 className="h-4 w-4" />
            {t("common.share")}
          </button>
        )}
      </div>

      {/* Receipt card + summary */}
      <ThemeCard accountLevel={accountLevel} className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4 lg:p-6">
          {/* Left: vector receipt */}
          {showVectorReceipt && (
            <motion.div
              className="lg:col-span-2 flex items-center justify-center"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <VectorReceipt
                receipt={receipt}
                locale="tr"
                accountLevel={accountLevel}
                compact={compact}
                className="max-w-full h-[240px] sm:h-[320px] lg:h-[380px]"
              />
            </motion.div>
          )}

          {/* Right: summary metrics */}
          <motion.div
            className={showVectorReceipt ? "lg:col-span-3" : "lg:col-span-5"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="space-y-4">
              <div>
                <h1
                  className="text-xl sm:text-2xl font-bold tracking-tight"
                  style={{ color: "var(--app-text-primary)" }}
                >
                  {receipt.merchantName}
                </h1>
                <p className="text-sm text-white/50 mt-1">
                  {receipt.date}
                  {receipt.time ? ` · ${receipt.time}` : ""}
                  {receipt.category && receipt.category !== "other"
                    ? ` · ${categoryLabel(receipt.category, locale)}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-500">
                    {schemaLabel}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-500">
                    {copy.totalConfidence}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-500">
                    {copy.distributionConfidence}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: `${acc}10`,
                    border: `1px solid ${acc}25`,
                  }}
                >
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {t("receiptDetail.total")}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/40 text-emerald-500">
                    {copy.receiptRead}
                  </Badge>
                  <p
                    className="text-lg font-bold tabular-nums mt-0.5"
                    style={{ color: acc }}
                  >
                    {receipt.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/50">{receipt.currency}</p>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: `${acc}08`,
                    border: `1px solid ${acc}20`,
                  }}
                >
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {copy.hiddenEstimate}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/40 text-amber-500">
                    {copy.estimated}
                  </Badge>
                  <p
                    className="text-lg font-bold tabular-nums mt-0.5"
                    style={{ color: tier.accent2 }}
                  >
                    {shownHidden.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/50">{receipt.currency}</p>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: "var(--app-bg-elevated)",
                    border: "1px solid var(--app-border)",
                  }}
                >
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {t("receiptDetail.reward")}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      receipt.reward.claimable
                        ? "mt-1 text-[10px] border-emerald-500/40 text-emerald-500"
                        : "mt-1 text-[10px] border-amber-500/40 text-amber-500"
                    }
                  >
                    {receipt.reward.claimable
                      ? isTr
                        ? "Ödül hazır"
                        : "Reward ready"
                      : copy.verifying}
                  </Badge>
                  <p
                    className="text-lg font-bold tabular-nums mt-0.5"
                    style={{ color: acc }}
                  >
                    +{receipt.reward.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/50">cPoints</p>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: "var(--app-bg-elevated)",
                    border: "1px solid var(--app-border)",
                  }}
                >
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {copy.taxRead}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/40 text-emerald-500">
                    {taxAmount > 0 ? copy.receiptRead : copy.verifying}
                  </Badge>
                  <p className="text-lg font-bold tabular-nums mt-0.5" style={{ color: "var(--app-text-primary)" }}>
                    {taxAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/50">{receipt.currency}</p>
                </div>
              </div>

              <div
                className="rounded-xl p-3"
                style={{
                  background: "var(--app-bg-elevated)",
                  border: "1px solid var(--app-border)",
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    {t("receiptDetail.status")}
                  </p>
                  <StatusBadge status={receipt.status} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {timeline.map((item) => {
                    const Icon = item.done ? CheckCircle2 : Clock3;
                    return (
                      <div key={item.label} className="flex items-center gap-2 min-w-0">
                        <Icon
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: item.done ? acc : "var(--app-text-muted)" }}
                        />
                        <span
                          className="text-xs truncate"
                          style={{ color: item.done ? "var(--app-text-secondary)" : "var(--app-text-muted)" }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </ThemeCard>
    </div>
  );
}
