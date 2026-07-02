"use client";

/**
 * Yumo Yumo custom category icons — duotone SVG.
 * Each icon has two layers: background (opacity 0.35) + foreground (full).
 * Not Lucide outline — a Yumo Yumo-specific filled+stroke mix.
 *
 * Sizes are designed on a 0 0 24 24 viewBox, scaled via the size prop.
 */

import type { CSSProperties } from "react";

interface GlyphProps {
  size?: number;
  color?: string; // foreground color
  bgOpacity?: number; // background opacity (default 0.35)
  style?: CSSProperties;
}

function wrap(children: React.ReactNode, p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ color, ...style }}
      fill="none"
      aria-hidden
    >
      <g style={{ color }}>
        <g style={{ opacity: bgOpacity }}>{(children as { props: { fill?: React.ReactNode } }).props ? null : null}</g>
        {children}
      </g>
    </svg>
  );
}

// Grocery — wheeled shopping cart
export function GlyphGrocery(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* Basket body (trapezoid) — filled */}
      <path
        d="M6.5 8h13.5l-1.8 7.5a1.8 1.8 0 0 1-1.75 1.4H9.55a1.8 1.8 0 0 1-1.76-1.4L6.5 8Z"
        fill="currentColor"
        fillOpacity={bgOpacity}
      />
      {/* Basket outline */}
      <path
        d="M6.5 8h13.5l-1.8 7.5a1.8 1.8 0 0 1-1.75 1.4H9.55a1.8 1.8 0 0 1-1.76-1.4L6.5 8Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Handle — extends down from the left corner */}
      <path
        d="M3 5h2l1.5 3"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner divider lines */}
      <path
        d="M10 11v3M13.5 11v3M17 11v3"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
      {/* Wheels — two filled circles */}
      <circle cx="10" cy="20" r="1.6" fill="currentColor" />
      <circle cx="16.5" cy="20" r="1.6" fill="currentColor" />
    </svg>
  );
}

// Restaurant — crossed fork & knife
export function GlyphRestaurant(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* Plate ring (background) */}
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={bgOpacity} />
      {/* Fork — handled, 3-pronged */}
      <path
        d="M8 5v5.5a1.5 1.5 0 0 0 3 0V5M9.5 11v8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Knife — notched blade */}
      <path
        d="M16 5c-1 1.5-1.5 3-1.5 5s.5 2 1.5 2v7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Cafe — cup + steam
export function GlyphCafe(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* Cup body — filled */}
      <path
        d="M4 10h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-5Z"
        fill="currentColor"
        fillOpacity={bgOpacity}
      />
      {/* Cup outline */}
      <path
        d="M4 10h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-5Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Handle */}
      <path
        d="M16 12h2a2.5 2.5 0 0 1 0 5h-2"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Steam — two waves */}
      <path
        d="M8 6c0-1 1-1 1-2.5M11.5 6c0-1 1-1 1-2.5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Fuel — gas pump
export function GlyphFuel(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* Tank body — filled */}
      <rect
        x="4"
        y="4"
        width="9"
        height="16"
        rx="1.5"
        fill="currentColor"
        fillOpacity={bgOpacity}
      />
      {/* Tank outline */}
      <rect
        x="4"
        y="4"
        width="9"
        height="16"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
      {/* Window */}
      <rect
        x="6"
        y="7"
        width="5"
        height="3"
        rx="0.5"
        fill="currentColor"
      />
      {/* Hose handle */}
      <path
        d="M13 11h3a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0V8L17.5 5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Online marketplace — box (star-marked)
export function GlyphMarketplace(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* Box face — filled */}
      <path
        d="M3.5 8l8.5-4.5L20.5 8v8L12 20.5 3.5 16V8Z"
        fill="currentColor"
        fillOpacity={bgOpacity}
      />
      {/* Box outline */}
      <path
        d="M3.5 8l8.5-4.5L20.5 8v8L12 20.5 3.5 16V8Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Top Y seams */}
      <path
        d="M3.5 8L12 12.5 20.5 8M12 12.5V20.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Pharmacy — cross + medicine bottle
export function GlyphPharmacy(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* Circle background */}
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={bgOpacity} />
      {/* Cross — bold */}
      <path
        d="M12 7v10M7 12h10"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Electronics — phone
export function GlyphElectronics(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* Phone body — filled */}
      <rect
        x="6"
        y="2.5"
        width="12"
        height="19"
        rx="2.5"
        fill="currentColor"
        fillOpacity={bgOpacity}
      />
      {/* Phone outline */}
      <rect
        x="6"
        y="2.5"
        width="12"
        height="19"
        rx="2.5"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
      {/* Screen line */}
      <path
        d="M6 6h12M6 18h12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Home button */}
      <circle cx="12" cy="20" r="0.7" fill="currentColor" />
    </svg>
  );
}

// Convenience store — heart + basket (local love)
export function GlyphConvenience(p: GlyphProps) {
  const { size = 24, color = "currentColor", bgOpacity = 0.32, style } = p;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ...style }} aria-hidden>
      {/* House — filled */}
      <path
        d="M4 11l8-7 8 7v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5V11Z"
        fill="currentColor"
        fillOpacity={bgOpacity}
      />
      {/* Roof + walls */}
      <path
        d="M3 12l9-8 9 8M5 10v9.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V10"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Door */}
      <path
        d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// General category dictionary
export const CATEGORY_GLYPHS: Record<string, (p: GlyphProps) => React.JSX.Element> = {
  grocery: GlyphGrocery,
  restaurant: GlyphRestaurant,
  cafe: GlyphCafe,
  fuel: GlyphFuel,
  marketplace: GlyphMarketplace,
  pharmacy: GlyphPharmacy,
  electronics: GlyphElectronics,
  convenience: GlyphConvenience,
};

