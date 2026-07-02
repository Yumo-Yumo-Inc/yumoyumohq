"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReceiptStatus } from "@/lib/mock/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface StatusBadgeProps {
  status: ReceiptStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useAppLocale();
  
  const variants: Record<ReceiptStatus, { label: string; className: string }> = {
    VERIFIED: {
      label: t("status.verified"),
      className: "bg-accent/20 text-accent border-accent/30",
    },
    PENDING: {
      label: t("status.pending"),
      className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    REJECTED: {
      label: t("status.rejected"),
      className: "bg-muted text-muted-foreground border-border",
    },
    analyzed: {
      label: t("status.analyzed"),
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    scanned: {
      label: "Tarandı",
      className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    rewarded_other: {
      label: t("receiptScanner.expenseOther"),
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
  };

  const variant = variants[status];

  // Fallback if status is not in variants (should not happen, but safety check)
  if (!variant) {
    return (
      <Badge variant="outline" className={cn("font-medium", className)}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", variant.className, className)}
    >
      {variant.label}
    </Badge>
  );
}

