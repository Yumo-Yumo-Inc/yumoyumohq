/**
 * Premium superapp design tokens (Grab / Duolingo inspired).
 * Single source for colors, typography scale, spacing, radius, shadow.
 * Use in TS and mirror in app/globals.css for Tailwind/CSS.
 */

export const tokens = {
  /** Primary green (Duolingo Feather Green / Grab-style) */
  color: {
    primary: "#58CC02",
    primaryHover: "#4BB302",
    primaryMuted: "rgba(88, 204, 2, 0.15)",
    /** Neutral backgrounds */
    bgBase: "#0F0F0F",
    bgElevated: "#1A1A1A",
    bgSurface: "#242424",
    /** Text */
    textPrimary: "#FFFFFF",
    textSecondary: "#A1A1A1",
    textMuted: "#6B6B6B",
    /** Borders */
    border: "rgba(255, 255, 255, 0.08)",
    borderStrong: "rgba(255, 255, 255, 0.12)",
    /** Semantic */
    success: "#58CC02",
    warning: "#FF9600",
    error: "#FF4B4B",
  },

  /** Typography scale (min 12px for body/labels) */
  fontSize: {
    label: "12px",
    bodySm: "14px",
    body: "16px",
    bodyLg: "18px",
    headlineSm: "20px",
    headline: "24px",
    headlineLg: "28px",
    display: "32px",
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  /** Spacing (4px base unit) */
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
  },

  /** Border radius */
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },

  /** Elevation / shadow */
  shadow: {
    card: "0 1px 3px rgba(0, 0, 0, 0.25)",
    cardHover: "0 4px 12px rgba(0, 0, 0, 0.35)",
    cta: "0 2px 8px rgba(88, 204, 2, 0.25)",
  },
} as const;

export type DesignTokens = typeof tokens;
