"use client";

import { ThemeCard } from "@/components/app/theme-card";
import { VectorReceipt } from "@/components/app/vector-receipt";
import { Share2 } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";

interface ShareCardPreviewProps {
  receipt: Receipt;
  accountLevel?: number;
  className?: string;
}

export function ShareCardPreview({
  receipt,
  accountLevel = 1,
  className,
}: ShareCardPreviewProps) {
  const { t } = useAppLocale();

  return (
    <ThemeCard accountLevel={accountLevel} className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm" style={{ color: "var(--app-text-primary)" }}>
            {t("common.shareReceipt")}
          </h3>
          <div
            className="p-2 rounded-lg"
            style={{
              background: "var(--app-bg-elevated)",
              border: "1px solid var(--app-border)",
            }}
          >
            <Share2 className="h-4 w-4 text-white/60" />
          </div>
        </div>
        <div className="rounded-xl overflow-hidden">
          <VectorReceipt
            receipt={receipt}
            accountLevel={accountLevel}
            compact
            className="h-[240px] sm:h-[280px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: "var(--app-bg-elevated)" }}>
            <span className="text-white/50">{t("receipts.merchant")}</span>
            <span className="font-medium truncate ml-2">{receipt.merchantName}</span>
          </div>
          <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: "var(--app-bg-elevated)" }}>
            <span className="text-white/50">{t("receiptDetail.total")}</span>
            <span className="font-mono tabular-nums">
              {receipt.total.toFixed(2)} {receipt.currency}
            </span>
          </div>
          <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: "var(--app-bg-elevated)" }}>
            <span className="text-white/50">{t("receiptDetail.hiddenCost")}</span>
            <span className="font-mono tabular-nums text-primary">
              {receipt.hiddenCost.totalHidden.toFixed(2)} {receipt.currency}
            </span>
          </div>
          <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: "var(--app-bg-elevated)" }}>
            <span className="text-white/50">{t("breakdown.productValue")}</span>
            <span className="font-mono tabular-nums">
              {receipt.hiddenCost.productValue.toFixed(2)} {receipt.currency}
            </span>
          </div>
        </div>
      </div>
    </ThemeCard>
  );
}
