/**
 * patterns scene — chart board, honest mirror of REAL category spending, COMPACT
 * FRAME (ground y=108). Top categories from useYumbieInsights drive three bars
 * (measure beat); the biggest pulses with its label + share% (highlight beat).
 * Empty/low if no data — nothing fabricated. Logic + ids preserved; visuals
 * upgraded (easel, axis, trend line). Bar geometry constants remapped to ground.
 */
import type { Scene } from "../types";
import { useYumbieInsights, type YumbieCategory } from "../useYumbieInsights";

const BAR_IDS = ["yb-pbar1", "yb-pbar2", "yb-pbar3"] as const;
const BAR_X = [224, 242, 260];
const PALETTE = ["#3FB8A5", "#56C271", "#DCA22E"];
const BASE_Y = 100; // baseline (bar bottom)
const MIN_H = 4;
const MAX_H = 42; // top ~y=58 (board inner top 48)

function ratioToH(ratio: number): number {
  const r = Math.max(0, Math.min(1, ratio));
  return Math.round(MIN_H + (MAX_H - MIN_H) * r);
}

function topThree(): YumbieCategory[] {
  return useYumbieInsights.getState().categories.slice(0, 3);
}

const patterns: Scene = {
  id: "patterns",
  Props: () => (
    <g id="yb-scene-patterns" style={{ display: "none" }}>
      {/* ── Left-side decor: an analyst's study corner. Fills the bare left half
            so the board no longer floats in an empty room. Furniture uses --ys-*
            tokens (auto light/dark); accents reuse the family teal/gold/green.
            All wall art stays at y ≤ 70 — clear of Yumbie's head (stands y≈76+). */}

      {/* lower-wall wainscot — defines the room plane behind the furniture. The
            trim line spans the full wall (hidden behind the board + door) so it
            reads as continuous architecture, not a line stopping mid-air. */}
      <rect x="14" y="72" width="312" height="36" fill="var(--ys-deep)" opacity="0.18" />
      <line x1="14" y1="72" x2="326" y2="72" stroke="var(--ys-line)" strokeWidth="0.8" opacity="0.35" />

      {/* window with daylight — depth + a light source on the left */}
      <rect x="26" y="30" width="44" height="38" rx="3" fill="var(--ys-panel)" />
      <rect x="30" y="34" width="36" height="30" rx="1.5" fill="var(--ys-panel2)" />
      {/* distant skyline silhouette */}
      <rect x="33" y="56" width="5" height="8" fill="var(--ys-line)" />
      <rect x="40" y="51" width="6" height="13" fill="var(--ys-line)" />
      <rect x="48" y="57" width="5" height="7" fill="var(--ys-line)" />
      <rect x="55" y="53" width="6" height="11" fill="var(--ys-line)" />
      {/* glare bands */}
      <polygon points="32,64 41,34 47,34 38,64" fill="#FBD76E" opacity="0.10" />
      <polygon points="50,64 56,42 60,42 54,64" fill="#FBD76E" opacity="0.08" />
      {/* mullions + sill */}
      <line x1="48" y1="34" x2="48" y2="64" stroke="var(--ys-line)" strokeWidth="1" />
      <line x1="30" y1="49" x2="66" y2="49" stroke="var(--ys-line)" strokeWidth="1" />
      <rect x="23" y="67" width="50" height="3" rx="1" fill="var(--ys-edge)" />

      {/* framed mini-chart on the wall — echoes the board's measure theme */}
      <rect x="124" y="40" width="36" height="24" rx="2" fill="var(--ys-panel)" />
      <rect x="127" y="43" width="30" height="18" rx="1" fill="var(--ys-deep)" />
      <rect x="129" y="45.4" width="10" height="1.6" rx="0.8" fill="var(--ys-edge)" opacity="0.7" />
      <line x1="129" y1="58" x2="155" y2="58" stroke="var(--ys-line)" strokeWidth="0.8" />
      <polyline points="129,57 135,52 141,54 147,48 154,50" fill="none" stroke="#3FB8A5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="154" cy="50" r="1.4" fill="#E8A33B" />

      {/* floor contact shadows */}
      <ellipse cx="40" cy="108" rx="14" ry="2.4" fill="#000" opacity="0.16" />
      <ellipse cx="106" cy="108" rx="18" ry="2.4" fill="#000" opacity="0.15" />

      {/* potted plant — far-left corner, organic warmth */}
      <ellipse cx="33" cy="85" rx="4" ry="8.5" fill="#2C8A7A" transform="rotate(-28 33 85)" />
      <ellipse cx="47" cy="85" rx="4" ry="8.5" fill="#2C8A7A" transform="rotate(28 47 85)" />
      <ellipse cx="37" cy="82" rx="4.2" ry="9.5" fill="#3FB8A5" transform="rotate(-12 37 82)" />
      <ellipse cx="43" cy="82" rx="4.2" ry="9.5" fill="#3FB8A5" transform="rotate(12 43 82)" />
      <ellipse cx="40" cy="79" rx="4" ry="10" fill="#56C271" />
      <path d="M33 97 L47 97 L45 108 L35 108 Z" fill="var(--ys-panel2)" />
      <path d="M40 97 L47 97 L45 108 L40 108 Z" fill="#000" opacity="0.10" />
      <rect x="31.5" y="95" width="17" height="3.2" rx="1.2" fill="var(--ys-edge)" />

      {/* stack of ledgers — analysis/study cue, colored spines */}
      <rect x="92" y="103.5" width="30" height="4.5" rx="1" fill="var(--ys-panel)" />
      <rect x="92" y="103.5" width="4" height="4.5" rx="1" fill="#3FB8A5" />
      <rect x="95" y="99.5" width="25" height="4" rx="1" fill="var(--ys-panel2)" />
      <rect x="95" y="99.5" width="3.5" height="4" rx="1" fill="#E8A33B" />
      <g transform="rotate(-5 107 98)">
        <rect x="97" y="95.8" width="21" height="3.6" rx="1" fill="var(--ys-panel)" />
        <rect x="97" y="95.8" width="3.2" height="3.6" rx="1" fill="#56C271" />
      </g>

      {/* easel legs */}
      <line x1="218" y1="102" x2="210" y2="108" stroke="var(--ys-line)" strokeWidth="2" strokeLinecap="round" />
      <line x1="282" y1="102" x2="290" y2="108" stroke="var(--ys-line)" strokeWidth="2" strokeLinecap="round" />
      {/* board */}
      <rect x="208" y="42" width="84" height="62" rx="4" fill="var(--ys-panel)" />
      <rect x="214" y="48" width="72" height="52" rx="2" fill="var(--ys-deep)" />
      <line x1="222" y1="52" x2="222" y2="100" stroke="var(--ys-line)" strokeWidth="1.2" />
      <line x1="222" y1="100" x2="282" y2="100" stroke="var(--ys-line)" strokeWidth="1.2" />
      <line x1="222" y1="70" x2="282" y2="70" stroke="var(--ys-panel)" strokeWidth="1" />
      <line x1="222" y1="84" x2="282" y2="84" stroke="var(--ys-panel)" strokeWidth="1" />
      {/* bars — heights/colors set imperatively from real data (measure beat) */}
      <rect id="yb-pbar1" x="224" y={BASE_Y - MIN_H} width="11" height={MIN_H} fill="#3FB8A5" />
      <rect id="yb-pbar2" x="242" y={BASE_Y - MIN_H} width="11" height={MIN_H} fill="#56C271" />
      <rect id="yb-pbar3" x="260" y={BASE_Y - MIN_H} width="11" height={MIN_H} fill="#DCA22E" />
      {/* decorative trend (static); the real signal is the bars */}
      <polyline points="229,80 247,66 265,74 278,58" fill="none" stroke="#E8A33B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M278 58 l-4 1 m4 -1 l-1 4" fill="none" stroke="#E8A33B" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <text id="yb-pbar-label" x="247" y="40" fontSize="9" fill="#9AA3AD" textAnchor="middle" style={{ display: "none" }} />
    </g>
  ),
  plan: () => [
    { m: "idle", d: 1.0, msg: "yumbie.workspace.patterns.reviewing" },
    { m: "walk", to: 182, msg: "yumbie.workspace.patterns.approaching" },
    { m: "act", d: 1.2, fx: "measure", msg: "yumbie.workspace.patterns.measuring" },
    { m: "act", d: 1.1, fx: "highlight", msg: "yumbie.workspace.patterns.trendUp" },
    { m: "walk", to: 60, msg: "yumbie.workspace.patterns.shiftContinues" },
  ],
  onActStart: (fx, api) => {
    if (fx !== "measure") return;
    const cats = topThree();
    BAR_IDS.forEach((id, i) => {
      const el = api.$(id);
      if (!el) return;
      el.setAttribute("fill", cats[i]?.color ?? PALETTE[i]);
      el.setAttribute("height", String(MIN_H));
      el.setAttribute("y", String(BASE_Y - MIN_H));
    });
    const label = api.$("yb-pbar-label");
    if (label) label.style.display = "none";
  },
  onActEnd: (fx, api) => {
    const cats = topThree();
    if (fx === "measure") {
      if (!cats.length) return;
      BAR_IDS.forEach((id, i) => {
        const target = ratioToH(cats[i]?.ratio ?? 0);
        api.pushFx({ t: "bargrow", a: 0, id, fromH: MIN_H, toH: target, fromY: BASE_Y - MIN_H, toY: BASE_Y - target });
      });
      return;
    }
    if (fx === "highlight") {
      if (!cats.length) return;
      let bi = 0;
      cats.forEach((c, i) => {
        if ((c?.ratio ?? 0) > (cats[bi]?.ratio ?? 0)) bi = i;
      });
      const big = cats[bi];
      const el = api.$(BAR_IDS[bi]);
      if (el) {
        const orig = el.getAttribute("fill") ?? PALETTE[bi];
        el.setAttribute("fill", "#FBD76E");
        setTimeout(() => el.setAttribute("fill", orig), 350);
      }
      const label = api.$("yb-pbar-label");
      if (label && big) {
        label.textContent = big.label;
        label.setAttribute("x", String(BAR_X[bi] + 5));
        label.style.display = "";
      }
      if (big) {
        api.pushFx({ t: "plus", a: 0, x: BAR_X[bi] + 5, y: BASE_Y - ratioToH(big.ratio) - 6, txt: `${Math.round(big.ratio * 100)}%` });
      }
    }
  },
  frame: (api, { step, st }) => {
    const bar = api.$("yb-pbar2");
    if (!bar) return;
    if (step.m === "act" && step.fx === "measure") {
      bar.setAttribute("opacity", (0.6 + 0.4 * Math.abs(Math.sin(st * 6))).toFixed(2));
    } else {
      bar.setAttribute("opacity", "1");
    }
  },
};

export default patterns;
