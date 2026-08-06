import type { AppLocale } from "@/lib/i18n/app-context";

/**
 * Display label for stored unitType values.
 * Pipeline stores "adet" as the discrete-piece enum; UI maps it per locale.
 * kg/g/l/ml stay as-is (SI abbreviations).
 */
const ADET_LABEL: Record<AppLocale, string> = {
  tr: "adet",
  en: "pcs",
  ru: "шт",
  th: "ชิ้น",
  es: "ud",
  zh: "件",
};

export function formatUnitType(
  unitType: string | null | undefined,
  locale: AppLocale
): string | null {
  if (!unitType) return null;
  const key = unitType.trim().toLowerCase();
  if (!key) return null;
  if (key === "adet" || key === "piece" || key === "pcs" || key === "pc") {
    return ADET_LABEL[locale] ?? ADET_LABEL.en;
  }
  return unitType.trim();
}

/** Quantity + unit for receipt item rows, e.g. "2 pcs" / "1.250 kg". */
export function formatQtyWithUnit(
  qty: number | null | undefined,
  unitType: string | null | undefined,
  locale: AppLocale
): string | null {
  if (qty == null || !Number.isFinite(qty)) return null;
  const isWhole = Number.isInteger(qty);
  const num = isWhole ? String(qty) : qty.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  const unit = formatUnitType(unitType, locale);
  return unit ? `${num} ${unit}` : num;
}
