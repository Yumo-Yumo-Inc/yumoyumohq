"use client";

import { ThemeCard } from "@/components/app/theme-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/insights/format";
import type { InsightsAggregate } from "@/lib/insights/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface MerchantTablesProps {
  aggregate: InsightsAggregate;
  currency: string;
  accountLevel?: number;
}

export function MerchantTables({
  aggregate,
  currency,
  accountLevel = 1,
}: MerchantTablesProps) {
  const { t } = useAppLocale();

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--app-text-primary)" }}>{t("insights.merchantTables.title")}</h3>
      <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "var(--app-border)" }}>
                <TableHead style={{ color: "var(--app-text-muted)" }}>{t("insights.merchantTables.merchant")}</TableHead>
                <TableHead className="text-right" style={{ color: "var(--app-text-muted)" }}>{t("insights.merchantTables.hiddenCost")}</TableHead>
                <TableHead className="text-right" style={{ color: "var(--app-text-muted)" }}>{t("insights.merchantTables.avgPercent")}</TableHead>
                <TableHead className="text-right" style={{ color: "var(--app-text-muted)" }}>{t("insights.merchantTables.count")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregate.merchantStats.slice(0, 5).map((merchant, idx) => (
                <TableRow key={idx} style={{ borderColor: "var(--app-border)" }}>
                  <TableCell className="font-medium" style={{ color: "var(--app-text-primary)" }}>
                    {merchant.merchantName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                    {formatCurrency(merchant.totalHiddenCostCore, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                    {merchant.avgHiddenPercent.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                    {merchant.receiptCount}
                  </TableCell>
                </TableRow>
              ))}
              {aggregate.merchantStats.length === 0 && (
                <TableRow style={{ borderColor: "var(--app-border)" }}>
                  <TableCell colSpan={4} className="text-center" style={{ color: "var(--app-text-muted)" }}>
                    {t("insights.merchantTables.noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
    </ThemeCard>
  );
}

