"use client";

import { ThemeCard } from "@/components/app/theme-card";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

interface LineItemsPanelProps {
  receipt: Receipt;
  currency: string;
  accountLevel?: number;
  className?: string;
}

function formatQty(qty: number | null | undefined, unitType: string | null | undefined): string | null {
  if (qty == null || !Number.isFinite(qty)) return null;
  // Whole numbers render without decimals; weights keep up to 3.
  const isWhole = Number.isInteger(qty);
  const num = isWhole ? String(qty) : qty.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return unitType ? `${num} ${unitType}` : num;
}

export function LineItemsPanel({
  receipt,
  currency,
  accountLevel = 1,
  className,
}: LineItemsPanelProps) {
  const tier = useTier(accountLevel);
  const acc = tier.accent;
  const { t } = useAppLocale();

  // No fabricated data: only line items sent by the backend are shown.
  // If there are no items, the panel does not render.
  const items = receipt.lineItems ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <ThemeCard accountLevel={accountLevel} className={cn("p-4", className)}>
      <h3 className="text-base font-semibold mb-1" style={{ color: "var(--app-text-primary)" }}>
        {t("breakdown.itemsTitle")}
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--app-text-muted)" }}>
        {t("breakdown.itemsSubtitle")}
      </p>

      <div className="space-y-2">
        {items.map((item, idx) => {
          // displayName is the human label; canonicalName is a machine slug — never shown.
          const name = item.displayName || item.rawName || "—";
          const qtyLabel = formatQty(item.quantity, item.unitType);
          const hasUnitPrice = item.unitPrice != null && Number.isFinite(item.unitPrice);
          const hasTotal = item.lineTotal != null && Number.isFinite(item.lineTotal);

          return (
            <div
              key={idx}
              className="rounded-xl p-3 flex items-start justify-between gap-3"
              style={{
                background: "var(--app-bg-elevated)",
                border: "1px solid var(--app-border)",
              }}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm break-words" style={{ color: "var(--app-text-primary)" }}>
                  {name}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  {item.brand && (
                    <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                      {item.brand}
                    </span>
                  )}
                  {qtyLabel && (
                    <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                      {t("breakdown.itemQty")}: {qtyLabel}
                    </span>
                  )}
                  {hasUnitPrice && (
                    <span className="text-xs font-mono tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                      {t("breakdown.itemUnitPrice")}: {item.unitPrice!.toFixed(2)} {currency}
                    </span>
                  )}
                </div>
              </div>
              {hasTotal && (
                <p
                  className="font-mono font-semibold tabular-nums flex-shrink-0 text-sm"
                  style={{ color: "var(--app-text-primary)" }}
                >
                  {item.lineTotal!.toFixed(2)} {currency}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between pt-4 mt-4 border-t"
        style={{ borderColor: "var(--app-border)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
          {t("breakdown.itemsCount", { count: items.length })}
        </span>
        <span className="text-lg font-bold tabular-nums" style={{ color: acc }}>
          {receipt.total.toFixed(2)} {currency}
        </span>
      </div>
    </ThemeCard>
  );
}
