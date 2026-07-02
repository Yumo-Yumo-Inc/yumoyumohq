/**
 * Proof-of-Expense detail — visual language aligned to the app shell (Slate + Gold)
 * so the screen feels continuous with the receipts list it opens from. The
 * distinctive part is the interactive layout, not a foreign palette.
 * Scoped via `--pf-*` CSS variables set on the page root in <ProofView>.
 */

import type { CSSProperties } from "react";

export const CONDENSED = "var(--font-barlow-condensed), 'Arial Narrow', ui-sans-serif, sans-serif";
export const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";

/** Cost-layer colors — same family the receipts list/feed uses. */
export const LAYER_COLOR = {
  productValue: "#34D399", // real value — emerald
  importSystem: "#0EA5E9", // supply — sky (--receipt-category-supply)
  retailBrand: "#A78BFA", // retail — violet (--receipt-category-retail)
  exciseTax: "#F472B6", // excise — pink
  state: "#8B5CF6", // VAT — purple (--receipt-category-tax)
} as const;

/** Signature accent — scanui gold (matches scanui-gold across the scan flow). */
export const FLAME = "linear-gradient(135deg, #FFD37A 0%, #FFC65A 55%, #FFB23E 100%)";

/**
 * Proof palette — aligned to the immersive scan-flow "scanui" surface
 * (dark-purple gradient + gold accent). The receipt detail is the tail of the
 * scan → analysis → result journey, so it stays dark regardless of app theme
 * (dark-only, product decision 2026-06-25). All `--pf-*` consumers inherit this centrally.
 */
export const pfVars = {
  "--pf-bg0": "#150E35",
  "--pf-bg1": "#2A2360",
  "--pf-panel": "linear-gradient(158deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.04) 62%, rgba(255,255,255,0.03) 100%)",
  "--pf-inset": "rgba(255,255,255,0.055)",
  "--pf-text": "#F5F3FC",
  "--pf-soft": "rgba(245,243,252,0.72)",
  "--pf-mute": "rgba(245,243,252,0.45)",
  "--pf-gold": "#FFC65A",
  "--pf-amber": "#FFC65A",
  "--pf-peach": "#FFD37A",
  "--pf-coral": "#F87171",
  "--pf-ember": "#3FD9A0",
  "--pf-rose": "#9B8FF0",
  "--pf-line": "rgba(255,255,255,0.10)",
  "--pf-line-strong": "rgba(255,255,255,0.16)",
  "--pf-glow": "rgba(255,170,60,0.25)",
  "--pf-flame": FLAME,
} as CSSProperties;

/**
 * Proof CSS-variable set. Forced to the dark scanui palette (dark-only) so the
 * receipt detail matches the immersive scan flow even in the app's light theme.
 */
export function proofVars(_isLight: boolean): CSSProperties {
  return pfVars;
}

export function currencySymbol(currency: string): string {
  switch (currency) {
    case "TRY":
      return "₺";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return "";
  }
}

export function money(value: number, currency: string, decimals = 2): string {
  const symbol = currencySymbol(currency);
  const num = (value ?? 0).toFixed(decimals);
  return symbol ? `${symbol}${num}` : `${num} ${currency}`;
}
