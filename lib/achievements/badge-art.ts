/**
 * Achievement badge art — the Yumo Yumo visual language ported from the
 * yumo-rozet-sistemi.html mockup: a squircle body (Yumbie DNA), a subtle receipt
 * tear-line motif, and a teal→gold color journey that maps a tier's position in
 * its track to its color (early = teal, mastery = gold).
 *
 * Pure helpers (no React) so they are testable and reusable. The React renderer
 * is components/achievements/achievement-badge.tsx.
 */

/** Superellipse (squircle) path — same body shape as Yumbie. */
export function squirclePath(size: number, n = 4.2, inset = 0): string {
  const r = size / 2 - inset;
  const cx = size / 2;
  const cy = size / 2;
  const steps = 140;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x = cx + r * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const y = cy + r * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d + "Z";
}

// Per-badge icons live in components/achievements/badge-icons.ts (lucide, one per
// tier). badge-art stays icon-agnostic: it only provides the squircle + palette.

// ---- teal → gold interpolation (mirrors the mockup's rank strip) ----
type RGB = [number, number, number];
const TEAL: RGB = [0x2b, 0xc4, 0xae];
const TEAL_DEEP: RGB = [0x0e, 0x7c, 0x6e];
const TEAL_BRIGHT: RGB = [0x74, 0xf0, 0xdc];
const GOLD: RGB = [0xf2, 0xb3, 0x3d];
const GOLD_DEEP: RGB = [0xb4, 0x76, 0x1a];
const GOLD_BRIGHT: RGB = [0xff, 0xd8, 0x88];
const FILL_A_TEAL: RGB = [0x10, 0x30, 0x2c];
const FILL_A_GOLD: RGB = [0x2a, 0x21, 0x10];
const FILL_B_TEAL: RGB = [0x0c, 0x1f, 0x1d];
const FILL_B_GOLD: RGB = [0x17, 0x12, 0x06];

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const hx = (n: number) => n.toString(16).padStart(2, "0");
const mix = (c1: RGB, c2: RGB, t: number) =>
  `#${hx(lerp(c1[0], c2[0], t))}${hx(lerp(c1[1], c2[1], t))}${hx(lerp(c1[2], c2[2], t))}`;

export type BadgePalette = {
  ring: [string, string];
  fillA: string;
  fillB: string;
  iconColor: string;
  glow: boolean;
  gold: boolean;
};

/**
 * Palette for a tier given its position in the track. `t` in [0,1] (0 = first
 * tier, 1 = top tier) drives the teal→gold journey; the top of a track glows.
 */
export function tierPalette(tierIndex: number, tierCount: number): BadgePalette {
  const t = tierCount <= 1 ? 1 : (tierIndex - 1) / (tierCount - 1);
  return {
    ring: [mix(TEAL, GOLD, t), mix(TEAL_DEEP, GOLD_DEEP, t)],
    fillA: mix(FILL_A_TEAL, FILL_A_GOLD, t),
    fillB: mix(FILL_B_TEAL, FILL_B_GOLD, t),
    iconColor: mix(TEAL_BRIGHT, GOLD_BRIGHT, t),
    glow: t > 0.75,
    gold: t > 0.6,
  };
}
