"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReceiptText, Calculator } from "lucide-react";
import type { Pricing, HiddenCost } from "@/lib/receipt/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface BreakdownCardProps {
  pricing: Pricing;
  hiddenCost: HiddenCost;
  showEstimate?: boolean;
}

export function BreakdownCard({ pricing, hiddenCost, showEstimate }: BreakdownCardProps) {
  const { t } = useAppLocale();
  // Defensive defaults
  const totalPaid = pricing?.totalPaid ?? 0;
  const vatAmount = pricing?.vatAmount ?? 0;
  const vatRate = pricing?.vatRate;
  
  const breakdown = hiddenCost?.breakdown ?? { importSystemCost: 0, retailHiddenCost: 0, items: [] };
  const importSystemCost = breakdown.importSystemCost ?? 0;
  const retailHiddenCost = breakdown.retailHiddenCost ?? 0;
  const items = breakdown.items ?? [];
  const hiddenCostCore = hiddenCost?.hiddenCostCore ?? 0;
  const referencePrice = hiddenCost?.referencePrice ?? 0;

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            <CardTitle>{t("breakdownCard.title")}</CardTitle>
          </div>
          {showEstimate && (
            <Badge variant="outline" className="text-xs">
              <Calculator className="h-3 w-3 mr-1" />
              {t("breakdownCard.estimated")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("breakdownCard.totalPaid")}</span>
              <span className="font-medium">{totalPaid.toFixed(2)}</span>
            </div>
            {vatAmount > 0 && vatRate !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("breakdownCard.vat")}</span>
                <span className="font-medium">{vatAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Hidden Costs Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t("breakdownCard.hiddenCostBreakdown")}</h4>

            {/* Import/System Costs */}
            {importSystemCost > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("breakdownCard.supplyChain")}</span>
                  <span className="font-medium">{importSystemCost.toFixed(2)}</span>
                </div>
                {items
                  .filter(item => item.label.includes("Supply") || item.label.includes("Chain"))
                  .map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground pl-4">
                      <span>{item.label}</span>
                      <span>{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Retail Hidden Costs */}
            {retailHiddenCost > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("breakdownCard.storeAndBrand")}</span>
                  <span className="font-medium">{retailHiddenCost.toFixed(2)}</span>
                </div>
                {items
                  .filter(item => item.label.includes("Store") || item.label.includes("Retail") || item.label.includes("Platform"))
                  .map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground pl-4">
                      <span>{item.label}</span>
                      <span>{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Total Hidden Cost */}
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="font-semibold">{t("breakdownCard.totalHiddenCost")}</span>
                <span className="font-bold text-primary">{hiddenCostCore.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>{t("breakdownCard.referencePrice")}</span>
                <span>{referencePrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
