"use client";

/**
 * Photo Guidelines Component
 * Displays photo capture guidelines to users (locale from app context).
 */

import { Info } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";

interface PhotoGuidelinesProps {
  /** @deprecated Use app locale from context */
  locale?: string;
  className?: string;
}

const GUIDELINE_KEYS = [
  { icon: "📐", titleKey: "photoGuidelines.receiptUpright", descKey: "photoGuidelines.receiptUprightDesc" },
  { icon: "📏", titleKey: "photoGuidelines.entireReceipt", descKey: "photoGuidelines.entireReceiptDesc" },
  { icon: "🧹", titleKey: "photoGuidelines.cleanBackground", descKey: "photoGuidelines.cleanBackgroundDesc" },
  { icon: "💡", titleKey: "photoGuidelines.sufficientLight", descKey: "photoGuidelines.sufficientLightDesc" },
  { icon: "🎯", titleKey: "photoGuidelines.sharpFocused", descKey: "photoGuidelines.sharpFocusedDesc" },
  { icon: "⬜", titleKey: "photoGuidelines.margins", descKey: "photoGuidelines.marginsDesc" },
] as const;

export function PhotoGuidelines({ className = "" }: PhotoGuidelinesProps) {
  const { t } = useAppLocale();

  return (
    <div className={`p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 ${className}`}>
      <h3 className="font-semibold text-xs flex items-center gap-1.5 text-blue-900 dark:text-blue-100 mb-2">
        <Info className="h-3.5 w-3.5" />
        {t("photoGuidelines.title")}
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
        {GUIDELINE_KEYS.map((g, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-sm flex-shrink-0 mt-0.5">{g.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900 dark:text-blue-100 leading-tight">{t(g.titleKey)}</p>
              <p className="text-blue-700 dark:text-blue-300 text-[10px] leading-tight mt-0.5">{t(g.descKey)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
