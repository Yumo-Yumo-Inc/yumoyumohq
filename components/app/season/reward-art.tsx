"use client";

/**
 * RewardArt — hand-illustrated, multi-layer SVG art drawn for Yumo Yumo's Genesis
 * pass. NOT a geometric glyph set: every icon is a proper little illustration with
 * a volume gradient (built from the reward's own colour), rim light, cast shadow,
 * embossed detail and forge accents (molten glow, sparks, gems). One 48-unit grid,
 * one cohesive forge craft; `tint` colours each piece so a spark reads icy-blue and
 * the forge finale reads molten-gold.
 */

import { useId } from "react";

export type RewardArtName =
  | "coin"
  | "spark" | "emberSeed" | "cinder" | "wildfire"
  | "ringSpark" | "ringKindled" | "ringEmber" | "ringFlame" | "ringCrown"
  | "sealSpark" | "sealEmber" | "sealFlame" | "sealGenesis"
  | "chipMolten" | "gem" | "dropFrost" | "dropGold"
  | "swatches" | "lens" | "slotplus" | "tag" | "shield" | "themeGenesis"
  | "anvil" | "crown" | "yumbie";

/** Every reward glyph → its illustration. */
const ART_BY_GLYPH: Record<string, RewardArtName> = {
  spark: "spark", emberSeed: "emberSeed", cinder: "cinder", wildfire: "wildfire",
  ringSpark: "ringSpark", ringKindled: "ringKindled", ringEmber: "ringEmber", ringFlame: "ringFlame", ringCrown: "ringCrown",
  sealSpark: "sealSpark", sealEmber: "sealEmber", sealFlame: "sealFlame", sealGenesis: "sealGenesis",
  chipGem: "gem", dropSpark: "dropGold", chip: "chipMolten", droplet: "dropFrost", palette: "themeGenesis",
  swatches: "swatches", lens: "lens", slotplus: "slotplus", tag: "tag", shield: "shield",
  anvil: "anvil", crown: "crown", yumbie: "yumbie",
};
/** Per-kind default, for rewards that carry no explicit glyph. */
const KIND_DEFAULT: Record<string, string> = {
  frame: "ringSpark", accent: "chip", name_color: "droplet", background: "chipMolten", theme: "palette", seal: "sealSpark",
};

/** Resolve a reward (its glyph + kind) to its hand-drawn illustration. */
export function rewardArtFor(glyph: string | null | undefined, kind: string): RewardArtName {
  const key = glyph ?? KIND_DEFAULT[kind] ?? "chip";
  return ART_BY_GLYPH[key] ?? "gem";
}

/* ---- colour helpers: build a metal/gem ramp from the reward's own hue ---- */
function hexToRgb(h: string) {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}
function mix(hex: string, t: [number, number, number], a: number) {
  const [r, g, b] = hexToRgb(hex);
  const c = (x: number, y: number) => Math.round(x + (y - x) * a);
  const n = ((c(r, t[0]) << 16) | (c(g, t[1]) << 8) | c(b, t[2])) >>> 0;
  return `#${n.toString(16).padStart(6, "0")}`;
}
const W: [number, number, number] = [255, 255, 255];
const K: [number, number, number] = [0, 0, 0];

export function RewardArt({ name, size = 48, tint = "#FFD66B" }: { name: RewardArtName; size?: number; tint?: string }) {
  const id = useId().replace(/:/g, "");
  const g = (s: string) => `${id}-${s}`;
  const hi = mix(tint, W, 0.6);
  const mid = tint;
  const lo = mix(tint, K, 0.32);
  const deep = mix(tint, K, 0.58);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id={g("body")} x1="14" y1="8" x2="34" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.45" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <radialGradient id={g("core")} cx="24" cy="22" r="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.6" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </radialGradient>
        <radialGradient id={g("glow")} cx="24" cy="30" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF7A1A" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FF7A1A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g("bag")} cx="20" cy="16" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="0.55" stopColor="#F7C948" />
          <stop offset="1" stopColor="#D89B24" />
        </radialGradient>
      </defs>

      <ellipse cx="24" cy="40.5" rx="14" ry="4" fill={`url(#${g("glow")})`} />

      {/* ── points / medallion ── */}
      {name === "coin" && (
        <g>
          <ellipse cx="27" cy="26" rx="12" ry="12.5" fill={lo} stroke={deep} strokeWidth="1" />
          <ellipse cx="21" cy="24" rx="12.5" ry="13" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="1.1" />
          <ellipse cx="21" cy="24" rx="9" ry="9.5" fill="none" stroke={hi} strokeWidth="1" opacity="0.5" />
          <path d="M21 17.5 C22.6 20 23.6 21.3 23.6 23.5 C23.6 25.5 22.5 27 21 27 C19.5 27 18.4 25.5 18.4 23.5 C18.4 22 19.3 21.4 19.6 19.6 C20.2 20.6 20.4 18.6 21 17.5 Z" fill={hi} opacity="0.9" />
          <path d="M13 18 A12.5 13 0 0 1 26 14 C22 12.5 16 13 13 18 Z" fill="#fff" opacity="0.35" />
        </g>
      )}

      {/* ── sticker: sparks & flames ── */}
      {name === "spark" && (
        <g>
          <path d="M24 6 L26.5 19 L36 22 L26.5 25 L24 40 L21.5 25 L12 22 L21.5 19 Z" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M24 6 L25.4 17 L24 21 L22.6 17 Z" fill={hi} opacity="0.85" />
          <path d="M33 10 C33.4 13 34 13.6 37 14 C34 14.4 33.4 15 33 18 C32.6 15 32 14.4 29 14 C32 13.6 32.6 13 33 10 Z" fill={mid} />
          <circle cx="14" cy="14" r="1.6" fill={hi} />
          <circle cx="34" cy="31" r="1.4" fill={mid} />
        </g>
      )}
      {name === "emberSeed" && (
        <g>
          <ellipse cx="24" cy="27" rx="10" ry="9" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="1" />
          <path d="M17 25 Q22 22 27 26 M18 30 Q24 28 30 31" stroke={deep} strokeWidth="1" opacity="0.5" fill="none" />
          <ellipse cx="21" cy="24" rx="4" ry="3" fill="#FFB347" opacity="0.6" />
          <path d="M24 8 C26 12 28 14 28 18 C28 21 26.2 23 24 23 C21.8 23 20 21 20 18 C20 15.5 21.5 14.6 22 11.5 C22.8 13 23.2 10 24 8 Z" fill="#FF7A1A" />
          <path d="M24 13 C25 15 25.8 16 25.8 17.6 C25.8 19 25 20 24 20 C23 20 22.2 19 22.2 17.6 C22.2 16.4 23 15.8 23.2 14.6 C23.6 15.4 23.6 14 24 13 Z" fill="#FFD66B" />
        </g>
      )}
      {name === "cinder" && (
        <g>
          <path d="M24 9 L26 16 L24 22 L22 16 Z" fill={`url(#${g("core")})`} />
          <path d="M31 15 L30 21 L26 24 L28 18 Z" fill={mid} />
          <path d="M17 15 L18 21 L22 24 L20 18 Z" fill={mid} />
          <circle cx="24" cy="27" r="4" fill={hi} />
          <circle cx="24" cy="27" r="4" fill="#FF7A1A" opacity="0.35" />
          <circle cx="15" cy="26" r="2.2" fill={mid} />
          <circle cx="33" cy="26" r="2.2" fill={mid} />
          <circle cx="20" cy="33" r="1.5" fill={hi} />
          <circle cx="29" cy="33" r="1.5" fill={hi} />
        </g>
      )}
      {name === "wildfire" && (
        <g>
          <path d="M24 6 C29 13 35 17 35 26 C35 33 30 38 24 38 C18 38 13 33 13 26 C13 19 18 17 19 11 C21 14 22 9 24 6 Z" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="0.9" />
          <path d="M24 16 C27 20 30 23 30 28 C30 32 27.4 35 24 35 C20.6 35 18 32 18 28 C18 24.5 20 23 21 19.5 C22 21.5 22.6 18 24 16 Z" fill="#FF9D47" />
          <path d="M24 24 C25.8 26.5 27 28 27 30.5 C27 32.6 25.6 34 24 34 C22.4 34 21 32.6 21 30.5 C21 28.5 22.2 27.6 22.6 25.5 C23.2 26.6 23.4 24.8 24 24 Z" fill="#FFE9B0" />
          <circle cx="33" cy="12" r="1.5" fill={mid} />
          <circle cx="15" cy="14" r="1.2" fill={mid} />
        </g>
      )}

      {/* ── frames: forged rings ── */}
      {(name === "ringSpark" || name === "ringKindled" || name === "ringEmber" || name === "ringFlame") && (
        <g>
          <circle cx="24" cy="24" r="13" fill="none" stroke={`url(#${g("body")})`} strokeWidth="6" />
          <circle cx="24" cy="24" r="13" fill="none" stroke={hi} strokeWidth="1.1" opacity="0.55" strokeDasharray="9 42" strokeDashoffset="5" />
          <circle cx="24" cy="24" r="13" fill="none" stroke={deep} strokeWidth="0.8" opacity="0.55" />
          {name === "ringSpark" && (
            <g>
              <circle cx="24" cy="11" r="1.8" fill={hi} /><circle cx="37" cy="24" r="1.6" fill={mid} />
              <circle cx="11" cy="24" r="1.6" fill={mid} /><circle cx="24" cy="37" r="1.6" fill={mid} />
            </g>
          )}
          {name === "ringKindled" && (
            <g fill="#FF9D47">
              <path d="M24 8.5 C25 10 25.6 10.8 25.6 12 C25.6 13 25 13.8 24 13.8 C23 13.8 22.4 13 22.4 12 C22.4 11 23 10.7 23.2 9.6 C23.6 10.3 23.6 9.3 24 8.5 Z" />
              <path d="M37 20.5 C38 22 38.6 22.8 38.6 24 C38.6 25 38 25.8 37 25.8 C36 25.8 35.4 25 35.4 24 C35.4 23 36 22.7 36.2 21.6 C36.6 22.3 36.6 21.3 37 20.5 Z" opacity="0.9" />
            </g>
          )}
          {name === "ringEmber" && <ellipse cx="24" cy="24" rx="16" ry="16" fill="#FF7A1A" opacity="0.14" />}
          {name === "ringFlame" && (
            <g fill="#FF5D3B">
              <path d="M24 6 C25.6 8.5 27 10 27 12.5 C27 14.6 25.6 16 24 16 C22.4 16 21 14.6 21 12.5 C21 10.5 22.2 9.6 22.6 7.5 C23.2 8.6 23.4 6.8 24 6 Z" />
              <path d="M11 30 C12.2 31.8 13 33 13 34.6 C13 36 12 37 11 37 C10 37 9 36 9 34.6 C9 33.4 9.8 32.8 10 31.5 C10.4 32.3 10.6 31 11 30 Z" opacity="0.85" />
            </g>
          )}
        </g>
      )}

      {/* ── seals: wax rosettes with an embossed mark + ribbon tails ── */}
      {(name === "sealSpark" || name === "sealEmber" || name === "sealFlame" || name === "sealGenesis") && (
        <g>
          <path d="M19 30 L17 41 L21 37 Z" fill="#C0392B" stroke="#7C1327" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M29 30 L31 41 L27 37 Z" fill="#C0392B" stroke="#7C1327" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M24 7 L27 9.5 L30.7 8.9 L31.5 12.6 L34.9 14.2 L33.6 17.7 L35.6 20.8 L32.7 23.2 L32.7 27 L29 27.6 L27 30.8 L24 29 L21 30.8 L19 27.6 L15.3 27 L15.3 23.2 L12.4 20.8 L14.4 17.7 L13.1 14.2 L16.5 12.6 L17.3 8.9 L21 9.5 Z" fill={`url(#${g("body")})`} stroke={deep} strokeWidth="1" strokeLinejoin="round" />
          <circle cx="24" cy="18.5" r="7.4" fill={lo} stroke={deep} strokeWidth="0.9" />
          <path d="M18 14.5 A7.4 7.4 0 0 1 30 14.5 C27 12.5 21 12.5 18 14.5 Z" fill={hi} opacity="0.4" />
          {name === "sealSpark" && <path d="M24 12.5 L25.3 17 L29.5 18.5 L25.3 20 L24 24.5 L22.7 20 L18.5 18.5 L22.7 17 Z" fill={hi} opacity="0.95" />}
          {name === "sealEmber" && <path d="M24 12.5 C25.6 15 27 16.5 27 18.8 C27 20.8 25.6 22.2 24 22.2 C22.4 22.2 21 20.8 21 18.8 C21 17 22.2 16.4 22.6 14.5 C23.2 15.6 23.4 13.6 24 12.5 Z" fill="#FFE0B0" />}
          {name === "sealFlame" && <path d="M25.5 12.5 L20 20 H23.4 L22 24.5 L28 17 H24.6 L26 12.5 Z" fill="#FFE0B0" />}
          {name === "sealGenesis" && <path d="M19 21 L20.5 17 L24 20 L27.5 17 L29 21 Z M19.5 22.3 H28.5 V23.6 H19.5 Z" fill={hi} opacity="0.95" />}
        </g>
      )}

      {name === "ringCrown" && (
        <g>
          <circle cx="24" cy="26" r="12" fill="none" stroke={`url(#${g("body")})`} strokeWidth="6" />
          <circle cx="24" cy="26" r="12" fill="none" stroke={hi} strokeWidth="1.1" opacity="0.55" strokeDasharray="8 40" strokeDashoffset="5" />
          <path d="M14 22 L16.5 24 M31 29 L34 27" stroke="#FF6A1A" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
          <path d="M19 12 L21.5 7 L24 10.5 L26.5 7 L29 12 Z" fill={`url(#${g("body")})`} stroke={deep} strokeWidth="0.8" strokeLinejoin="round" />
          <circle cx="24" cy="12.5" r="2.2" fill="#F43F5E" stroke="#7C1327" strokeWidth="0.8" /><circle cx="23.3" cy="11.8" r="0.6" fill="#fff" />
        </g>
      )}

      {/* ── accents / name colours ── */}
      {name === "chipMolten" && (
        <g>
          <rect x="10" y="12" width="24" height="24" rx="6" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="1.1" />
          <path d="M12 16 A4 4 0 0 1 16 12 H30 A4 4 0 0 1 34 16 V18 H12 Z" fill={hi} opacity="0.55" />
          <path d="M30 30 C30 33 27.5 35.5 24.5 35.5 C27 33 26 29 30 30 Z" fill="#FF7A1A" opacity="0.7" />
          <circle cx="30" cy="30" r="1.6" fill={hi} />
        </g>
      )}
      {(name === "dropFrost" || name === "dropGold") && (
        <g>
          <path d="M24 7 C29 15 33 19 33 25 C33 30 29 34 24 34 C19 34 15 30 15 25 C15 19 19 15 24 7 Z" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="1" />
          <path d="M20 20 C18.5 23 19 27 21.5 29 C18.5 27.5 17 23 18.4 20 C19 18.5 19.5 18.8 20 20 Z" fill="#fff" opacity="0.5" />
          <path d="M27 12 L28 15 L31 16 L28 17 L27 20 L26 17 L23 16 L26 15 Z" fill={hi} opacity="0.85" />
        </g>
      )}

      {/* ── capabilities: object illustrations ── */}
      {name === "swatches" && (
        <g>
          <rect x="10" y="14" width="10" height="22" rx="2.5" transform="rotate(-8 15 25)" fill="#4FB4FF" stroke={deep} strokeWidth="0.9" />
          <rect x="19" y="12" width="10" height="24" rx="2.5" fill="#F59E0B" stroke={deep} strokeWidth="0.9" />
          <rect x="28" y="14" width="10" height="22" rx="2.5" transform="rotate(8 33 25)" fill="#34D399" stroke={deep} strokeWidth="0.9" />
          <rect x="19" y="12" width="10" height="6" rx="2.5" fill="#fff" opacity="0.35" />
          <circle cx="24" cy="30" r="1.8" fill="#fff" opacity="0.85" />
        </g>
      )}
      {name === "lens" && (
        <g>
          <rect x="12" y="12" width="15" height="13" rx="2" fill={lo} stroke={deep} strokeWidth="0.9" />
          <path d="M15 21 V18 M18.5 21 V15 M22 21 V17" stroke={hi} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="22" cy="21" r="9" fill={mid} fillOpacity="0.18" stroke={`url(#${g("body")})`} strokeWidth="3" />
          <path d="M16 16 A9 9 0 0 1 26 15" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          <rect x="27" y="26" width="10" height="4.5" rx="2.2" transform="rotate(45 29 27)" fill={`url(#${g("body")})`} stroke={deep} strokeWidth="0.8" />
        </g>
      )}
      {name === "slotplus" && (
        <g>
          <path d="M18 30 L16 41 L20 37 Z M30 30 L32 41 L28 37 Z" fill="#C0392B" stroke="#7C1327" strokeWidth="0.7" strokeLinejoin="round" />
          <circle cx="24" cy="19" r="11" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="1.1" />
          <circle cx="24" cy="19" r="7.5" fill="none" stroke={hi} strokeWidth="1" opacity="0.5" />
          <path d="M22.4 13.5 H25.6 V17.4 H29.5 V20.6 H25.6 V24.5 H22.4 V20.6 H18.5 V17.4 H22.4 Z" fill={hi} />
          <path d="M16 14 A11 11 0 0 1 30 10.5 C25 8.5 19 9 16 14 Z" fill="#fff" opacity="0.3" />
        </g>
      )}
      {name === "tag" && (
        <g>
          <path d="M9 20 L20 9 A2.5 2.5 0 0 1 23.5 9 L38 23.5 A2.5 2.5 0 0 1 38 27 L27 38 A2.5 2.5 0 0 1 23.5 38 L9 23.5 A2.5 2.5 0 0 1 9 20 Z" fill={`url(#${g("body")})`} stroke={deep} strokeWidth="1.1" strokeLinejoin="round" />
          <circle cx="16.5" cy="16.5" r="2.6" fill={lo} stroke={deep} strokeWidth="0.9" />
          <circle cx="16.5" cy="16.5" r="0.9" fill={hi} />
          <path d="M22 24 L26 28 M28 22 L24 26 M22 22 L28 28" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          <path d="M14 12 L30 12" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        </g>
      )}
      {name === "shield" && (
        <g>
          <path d="M24 6 L37 10.5 V21 C37 30 31.5 36.5 24 39 C16.5 36.5 11 30 11 21 V10.5 Z" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M24 6 L37 10.5 V13 L24 8.8 L11 13 V10.5 Z" fill={hi} opacity="0.5" />
          <path d="M17 21.5 L22 26.5 L31 16.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="12.5" r="1.6" fill={hi} />
        </g>
      )}
      {name === "themeGenesis" && (
        <g>
          <g stroke={`url(#${g("body")})`} strokeWidth="2.2" strokeLinecap="round">
            <path d="M24 5 V10 M24 38 V43 M5 24 H10 M38 24 H43 M11 11 L14.5 14.5 M33.5 33.5 L37 37 M37 11 L33.5 14.5 M14.5 33.5 L11 37" />
          </g>
          <circle cx="24" cy="24" r="10.5" fill={`url(#${g("core")})`} stroke={deep} strokeWidth="1.1" />
          <path d="M24 15 C27 19 29.5 21.5 29.5 26 C29.5 30 27 33 24 33 C21 33 18.5 30 18.5 26 C18.5 22.5 20.5 21 21.5 17.5 C22.5 19.5 23 16.5 24 15 Z" fill="#FF7A1A" opacity="0.9" />
          <path d="M16 18 A10.5 10.5 0 0 1 30 15 C25 13 20 13.5 16 18 Z" fill="#fff" opacity="0.35" />
        </g>
      )}

      {/* ── forged hero pieces (verified batch) ── */}
      {name === "anvil" && (
        <g>
          <path d="M7 17 H33 C33 20 30 22 26 22 L26 25 C26 27 24 28.5 21 28.5 H19.5 V33 H27 A2 2 0 0 1 29 35 V37 H13 V35 A2 2 0 0 1 15 33 H14.5 V26 C10 25.5 7 21 7 17 Z" fill={`url(#${g("body")})`} stroke={deep} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M8.5 18 H31 C31 19.6 29.5 20.6 27 20.6 H10.5 C9.4 20 8.7 19 8.5 18 Z" fill={hi} opacity="0.7" />
          <ellipse cx="20" cy="17.5" rx="6" ry="1.6" fill="#FF7A1A" opacity="0.5" />
          <path d="M22 12 L23 9 M25 13 L27 11 M18 12 L16.5 9.5" stroke={mid} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="27.5" cy="10" r="0.9" fill="#FFB347" /><circle cx="16" cy="9" r="0.8" fill="#FF7A1A" />
        </g>
      )}
      {name === "crown" && (
        <g>
          <path d="M8 18 L14 26 L19 13 L24 24 L29 13 L34 26 L40 18 L37 37 H11 Z" fill={`url(#${g("body")})`} stroke={deep} strokeWidth="1" strokeLinejoin="round" />
          <path d="M8 18 L14 26 L19 13 L24 24 L29 13 L34 26 L40 18" stroke={hi} strokeWidth="1.3" strokeLinejoin="round" opacity="0.8" fill="none" />
          <path d="M10.5 33 H37.5 A2 2 0 0 1 39.5 35 V38.5 A2 2 0 0 1 37.5 40.5 H10.5 A2 2 0 0 1 8.5 38.5 V35 A2 2 0 0 1 10.5 33 Z" fill={lo} stroke={deep} strokeWidth="1" />
          <circle cx="15" cy="36.7" r="1.5" fill={deep} /><circle cx="24" cy="36.7" r="1.5" fill={deep} /><circle cx="33" cy="36.7" r="1.5" fill={deep} />
          <circle cx="19" cy="12" r="2.4" fill="#4FB4FF" stroke="#0B4A78" strokeWidth="0.8" />
          <circle cx="24" cy="23" r="2.6" fill="#F43F5E" stroke="#7C1327" strokeWidth="0.8" />
          <circle cx="29" cy="12" r="2.4" fill="#34D399" stroke="#0B5A3C" strokeWidth="0.8" />
          <circle cx="18.2" cy="11.2" r="0.7" fill="#fff" /><circle cx="23.2" cy="22.2" r="0.8" fill="#fff" /><circle cx="28.2" cy="11.2" r="0.7" fill="#fff" />
        </g>
      )}
      {name === "gem" && (
        <g>
          <path d="M24 6 L36 15 L31 33 L17 33 L12 15 Z" fill={`url(#${g("body")})`} stroke={deep} strokeWidth="1" strokeLinejoin="round" />
          <path d="M24 6 L31 12 L24 16 L17 12 Z" fill={hi} opacity="0.85" />
          <path d="M12 15 L17 12 L24 16 L20 24 Z" fill={mid} opacity="0.9" />
          <path d="M36 15 L31 12 L24 16 L28 24 Z" fill={lo} opacity="0.9" />
          <path d="M20 24 L24 16 L28 24 L24 30 Z" fill={mid} />
          <path d="M20 24 L24 30 L17 33 Z" fill={lo} />
          <path d="M28 24 L24 30 L31 33 Z" fill={deep} opacity="0.85" />
          <path d="M26 8.5 L28.5 10.5 L27 12 L25 10 Z" fill="#fff" opacity="0.9" />
        </g>
      )}
      {name === "yumbie" && (
        <g>
          <path d="M13 14 L18 7 H30 L35 14 V36 A3 3 0 0 1 32 39 H16 A3 3 0 0 1 13 36 Z" fill={`url(#${g("bag")})`} stroke="#B87A16" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M13 14 L18 7 H30 L35 14 Z" fill="#F0B429" stroke="#B87A16" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M18 7 L21 14 M30 7 L27 14" stroke="#B87A16" strokeWidth="0.9" opacity="0.7" />
          <path d="M15 16 C19 15 24 15 24 15 L24 34 C20 34 16 32 15 28 Z" fill="#FFF1C4" opacity="0.35" />
          <ellipse cx="20" cy="22" rx="3.2" ry="3.6" fill="#fff" stroke="#8A5A16" strokeWidth="0.7" />
          <ellipse cx="28" cy="22" rx="3.2" ry="3.6" fill="#fff" stroke="#8A5A16" strokeWidth="0.7" />
          <circle cx="20.6" cy="22.6" r="1.5" fill="#2A1E10" /><circle cx="28.6" cy="22.6" r="1.5" fill="#2A1E10" />
          <circle cx="20.1" cy="21.9" r="0.5" fill="#fff" /><circle cx="28.1" cy="21.9" r="0.5" fill="#fff" />
          <circle cx="16.5" cy="26.5" r="1.7" fill="#FF8A5C" opacity="0.55" /><circle cx="31.5" cy="26.5" r="1.7" fill="#FF8A5C" opacity="0.55" />
          <path d="M21 29 Q24 33 27 29 Q24 30.5 21 29 Z" fill="#7C3A12" />
        </g>
      )}
    </svg>
  );
}
