"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Package, Building2, Info, Tag, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Receipt } from "@/lib/mock/types";
import { useAppLocale } from "@/lib/i18n/app-context";
import {
  getCategorySchemaLabel,
  getCostLayerCopy,
  getEvidenceBadge,
  getMvpCopy,
  getProvenanceNotice,
} from "@/lib/receipt/cost-layer-display";
import { getBreakdownItemCopy } from "@/lib/receipt/breakdown-item-copy";

interface BreakdownItemsPanelProps {
  receipt: Receipt;
  className?: string;
}

const bucketIcons = {
  store: Store,
  supply: Package,
  retail: Tag,
  excise: Landmark,
  government: Building2,
};

const bucketColors = {
  store: "text-orange-400",
  supply: "text-blue-400",
  retail: "text-amber-400",
  excise: "text-rose-400",
  government: "text-purple-400",
};

export function BreakdownItemsPanel({ receipt, className }: BreakdownItemsPanelProps) {
  const { t, locale } = useAppLocale();
  const mvp = getMvpCopy(locale);
  // Rule: no fabricated data. Only backend-provided breakdownItems are rendered;
  // if empty, the panel does not render (returns null below).
  const items = receipt.hiddenCost.breakdownItems || [];

  const bucketLabels = {
    store: t("breakdown.storeOperations"),
    supply: t("breakdown.supplyChain"),
    retail: t("breakdown.retailBrand"),
    government: t("breakdown.stateLayer"),
  };

  if (items.length === 0) {
    return null;
  }

  // Group items by bucket
  const groupedItems = items.reduce((acc, item) => {
    const bucket = item.bucket || "other";
    if (!acc[bucket]) {
      acc[bucket] = [];
    }
    acc[bucket].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Use receipt.hiddenCost.totalHidden as the authoritative total (not sum of items)
  const totalAmount = receipt.hiddenCost.totalHidden;

  return (
    <Card className={cn("card-cinematic", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {t("breakdown.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("breakdown.totalHiddenCost")}</span>
            <span className="text-xl font-bold tabular-nums text-accent">
              {totalAmount.toFixed(2)} {receipt.currency}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("breakdown.costItemsIdentified", { count: items.length })}
          </div>
        </div>

        {/* Computation provenance — mandatory transparency notice */}
        {(() => {
          const notice = getProvenanceNotice(receipt.hiddenCost.provenance, locale);
          const success = notice.tone === "success";
          return (
            <div
              className={cn(
                "rounded-lg p-3 flex items-start gap-2 border",
                success
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-amber-500/10 border-amber-500/30"
              )}
            >
              <span className="text-sm leading-none mt-0.5">{success ? "✅" : "ℹ️"}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold">{notice.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notice.detail}</p>
              </div>
            </div>
          );
        })()}

        {/* Grouped Items */}
        {Object.entries(groupedItems).map(([bucket, bucketItems]) => {
          const Icon = bucketIcons[bucket as keyof typeof bucketIcons] || Info;
          const bucketTotal = bucketItems.reduce((sum, item) => sum + item.amount, 0);
          const bucketPercentage = totalAmount > 0 ? (bucketTotal / totalAmount) * 100 : 0;
          const layerCopy = getCostLayerCopy({
            category: receipt.category,
            merchantChannel: receipt.merchantChannel,
            bucket,
            locale,
          });
          const groupEvidence = getEvidenceBadge({ bucket, amount: bucketTotal, locale });

          return (
            <div key={bucket} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", bucketColors[bucket as keyof typeof bucketColors] || "text-muted-foreground")} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold">
                        {layerCopy.label || bucketLabels[bucket as keyof typeof bucketLabels] || bucket}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-1.5 py-0",
                          groupEvidence.tone === "success" && "border-emerald-500/40 text-emerald-500",
                          groupEvidence.tone === "warning" && "border-amber-500/40 text-amber-500"
                        )}
                      >
                        {groupEvidence.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{layerCopy.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">
                    {bucketTotal.toFixed(2)} {receipt.currency}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bucketPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="space-y-2 pl-6">
                {bucketItems.map((item, idx) => {
                  const itemPercentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
                  const itemEvidence = getEvidenceBadge({ bucket, amount: item.amount, locale });
                  const itemCopy = getBreakdownItemCopy(item.label, item.description, locale);

                  // Highlight OTA commission for hospitality receipts
                  const isOTACommission = receipt.category === "hospitality_lodging" &&
                    (item.label.toLowerCase().includes("ota") || item.label.toLowerCase().includes("distribution"));
                  const isOTAMerchant = receipt.merchantName && 
                    ['agoda', 'booking.com', 'booking', 'expedia'].some(ota => 
                      receipt.merchantName.toLowerCase().includes(ota)
                    );
                  const shouldHighlightOTA = isOTACommission && isOTAMerchant;
                  
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg border",
                        shouldHighlightOTA 
                          ? "bg-amber-500/10 border-amber-500/30" 
                          : "bg-muted/50 border-border/50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs sm:text-sm font-medium break-words">{itemCopy.label}</span>
                          {shouldHighlightOTA && (
                            <Badge variant="default" className="text-xs px-1.5 py-0 flex-shrink-0 bg-amber-500">
                              {t("breakdown.otaCommission")}
                            </Badge>
                          )}
                          {!shouldHighlightOTA && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-1.5 py-0 flex-shrink-0",
                                itemEvidence.tone === "success" && "border-emerald-500/40 text-emerald-500",
                                itemEvidence.tone === "warning" && "border-amber-500/40 text-amber-500"
                              )}
                            >
                              {itemEvidence.label}
                            </Badge>
                          )}
                        </div>
                        {itemCopy.description && (
                          <p className="text-xs text-muted-foreground break-words">
                            {itemCopy.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right sm:text-right ml-0 sm:ml-4 flex-shrink-0 w-full sm:w-auto">
                        <div className="text-xs sm:text-sm font-semibold tabular-nums">
                          {item.amount != null && Number.isFinite(item.amount) 
                            ? `${item.amount.toFixed(2)} ${receipt.currency}`
                            : `0.00 ${receipt.currency}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {itemPercentage != null && Number.isFinite(itemPercentage)
                            ? `${itemPercentage.toFixed(1)}%`
                            : '0.0%'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{getCategorySchemaLabel(receipt.category, locale, receipt.merchantChannel)}</p>
              <p className="text-xs text-muted-foreground mt-1">{mvp.categorySchemaNote}</p>
            </div>
            <Badge variant="outline" className="border-amber-500/40 text-amber-500">
              {mvp.estimated}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

