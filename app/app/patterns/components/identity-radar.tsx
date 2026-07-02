"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Trait, TraitKey } from "@/lib/insights/identity/identity-types";
import { TRAIT_ACCENT, TRAIT_LABEL, tx } from "../identity-copy";

const CX = 130;
const CY = 130;
const R = 88;
const LR = 112; // label radius
const RINGS = [0.25, 0.5, 0.75, 1];

/** Vertex on the hexagon for axis i at radius r (i=0 points up). */
function pt(i: number, r: number): [number, number] {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function polyPoints(values: number[]): string {
  return values.map((v, i) => pt(i, (R * v) / 100).join(",")).join(" ");
}

interface Props {
  traits: Trait[];
  selected: TraitKey | null;
  onSelect: (key: TraitKey) => void;
  locale: string;
  primaryAccent: string;
}

export function IdentityRadar({ traits, selected, onSelect, locale, primaryAccent }: Props) {
  const reduce = useReducedMotion();
  const [frac, setFrac] = useState(reduce ? 1 : 0);
  const raf = useRef<number | null>(null);

  // Current value (null → 0 for geometry) and the previous-period value.
  const cur = traits.map((t) => t.value ?? 0);
  const prev = traits.map((t) => (t.value !== null && t.delta !== null ? t.value - t.delta : t.value ?? 0));

  useEffect(() => {
    if (reduce) {
      setFrac(1);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 1000);
      const eased = 1 - Math.pow(1 - k, 3);
      setFrac(eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // Re-run when the underlying data identity changes.
  }, [reduce, traits]);

  // Cheap (6 axes) — recompute each render so it tracks both frac and traits.
  const shape = cur.map((c, i) => prev[i] + (c - prev[i]) * frac);

  const gridRings = RINGS.map((f) => polyPoints(traits.map(() => 100 * f)));
  const hasGhost = traits.some((t) => t.delta !== null && t.value !== null);

  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[300px] overflow-visible" role="img"
      aria-label="Identity radar">
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor={primaryAccent} stopOpacity="0.34" />
          <stop offset="60%" stopColor={primaryAccent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={primaryAccent} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* grid rings */}
      {gridRings.map((p, i) => (
        <polygon key={i} points={p} fill="none" stroke="var(--app-border)" strokeWidth={1} />
      ))}
      {/* spokes */}
      {traits.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--app-border)" strokeWidth={1} />;
      })}

      {/* ghost (previous period) */}
      {hasGhost && (
        <polygon
          points={polyPoints(prev)}
          fill="none"
          stroke="var(--app-text-muted)"
          strokeWidth={1.1}
          strokeDasharray="3 4"
          opacity={0.6}
        />
      )}

      {/* data polygon */}
      <polygon
        points={polyPoints(shape)}
        fill="url(#radar-fill)"
        stroke="var(--app-text-primary)"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      {/* center dot */}
      <circle cx={CX} cy={CY} r={4} fill="var(--app-text-primary)" opacity={0.85} />

      {/* axis labels */}
      {traits.map((t, i) => {
        let [x, y] = pt(i, LR);
        if (i === 0) y += 4;
        if (i === 3) y += 10;
        const on = selected === t.key;
        return (
          <text
            key={t.key}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={9.5}
            fontWeight={600}
            fill={on ? "var(--app-text-primary)" : "var(--app-text-muted)"}
            style={{ transition: "fill .2s", pointerEvents: "none" }}
          >
            {tx(locale, TRAIT_LABEL[t.key])}
          </text>
        );
      })}

      {/* nodes */}
      {traits.map((t, i) => {
        const v = shape[i];
        const [x, y] = pt(i, (R * v) / 100);
        const accent = TRAIT_ACCENT[t.key];
        const empty = t.value === null;
        const on = selected === t.key;
        return (
          <g
            key={t.key}
            onClick={() => onSelect(t.key)}
            style={{ cursor: "pointer", opacity: selected && !on ? 0.4 : 1, transition: "opacity .25s" }}
          >
            <circle
              cx={x}
              cy={y}
              r={empty ? 7 : on ? 16 : 13}
              fill={empty ? "var(--app-bg-surface)" : accent}
              stroke={empty ? "var(--app-border-strong)" : "none"}
              style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,.4))", transition: "r .2s" }}
            />
            {!empty && (
              <>
                <ellipse cx={x - 4.5} cy={y - 5} rx={4.5} ry={3} fill="rgba(255,255,255,.4)" pointerEvents="none" />
                <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#0A0C10"
                  pointerEvents="none">
                  {Math.round(v)}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
