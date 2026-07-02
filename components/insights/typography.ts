/**
 * Yumo /insights — typography system.
 * 4 weights (400 / 500 / 600 / 700) with a simple scale. Numbers always use DM Mono.
 *
 * Usage: via className. This module exports className strings.
 */

// Page title (h1) — Wallet
export const TXT_PAGE_H1 =
  "text-[26px] sm:text-[28px] font-bold leading-none tracking-[-0.025em] text-app-text-primary";

// Section title (h2) — "Category breakdown"
export const TXT_SECTION_TITLE =
  "text-[16px] sm:text-[17px] font-semibold leading-tight tracking-[-0.01em] text-app-text-primary";

// Section subtitle / label — "47 RECEIPTS · 8 CATEGORIES"
export const TXT_SECTION_LABEL =
  "text-[10.5px] font-medium uppercase tracking-[0.12em] text-app-text-muted";

// Card title — merchant name, brand name, etc.
export const TXT_CARD_TITLE =
  "text-[15px] sm:text-[16px] font-semibold leading-tight tracking-[-0.005em] text-app-text-primary";

// Body / paragraph text
export const TXT_BODY =
  "text-[13px] font-normal leading-snug text-app-text-secondary";

// Mini label — over-line caps like "VISITS", "TOTAL"
export const TXT_MINI_CAPS =
  "text-[10px] font-medium uppercase tracking-[0.1em] text-app-text-muted";

// Large amount — hero display figure (₺14,382)
export const TXT_HERO_AMOUNT =
  "font-mono font-bold tracking-[-0.03em] leading-none text-app-text-primary";

// Stat figure — medium size (₺306, 47)
export const TXT_STAT_AMOUNT =
  "font-mono text-[20px] font-bold leading-none tracking-[-0.02em] text-app-text-primary";

// List figure — small (₺42)
export const TXT_LIST_AMOUNT =
  "font-mono text-[14px] font-semibold leading-tight tracking-[-0.01em] text-app-text-primary";

// Delta / percentage — small colored figure
export const TXT_DELTA =
  "font-mono text-[11.5px] font-semibold leading-none";

// Numeric helper: add everywhere. tabular-nums + DM Mono
export const NUM_FEAT = { fontFeatureSettings: '"tnum"' as const };
