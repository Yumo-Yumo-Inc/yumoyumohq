"use client";

/**
 * Bubblemaps-style packed bubble chart of the user's referral network.
 * Every visual channel encodes data (no decoration):
 *   radius     → invitee's verified receipt count (sqrt scale)
 *   color      → invitee's spending-identity primary trait (friend-gated;
 *                neutral slate when unknown)
 *   gold halo  → all three referral milestones completed
 *   dimmed     → inactive invitee (no recent receipt)
 * Center bubble is the user; faint spokes connect them to every invitee.
 * Deterministic packing (seeded by list order) so the layout is stable
 * across renders.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface BubbleNode {
  username: string;
  label: string;
  receipts: number;
  /** Trait accent hex, or null → neutral. */
  color: string | null;
  /** All milestones done → gold halo. */
  completed: boolean;
  /** Inactive → dimmed. */
  dim: boolean;
}

interface Packed extends BubbleNode {
  x: number;
  y: number;
  r: number;
}

const MAP_HEIGHT = 320;
const ME_RADIUS = 30;

/** Deterministic LCG so the layout doesn't jump between renders. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function pack(nodes: BubbleNode[], width: number): { packed: Packed[]; cx: number; cy: number } {
  const cx = width / 2;
  const cy = MAP_HEIGHT / 2;
  const rnd = makeRng(42);
  const maxN = Math.max(1, ...nodes.map((n) => n.receipts));

  const packed: Packed[] = nodes.map((n) => ({
    ...n,
    r: 12 + Math.sqrt(n.receipts / maxN) * 18,
    x: cx + (rnd() - 0.5) * (width * 0.55),
    y: cy + (rnd() - 0.5) * (MAP_HEIGHT * 0.55),
  }));
  const me: Packed = { username: "", label: "", receipts: 0, color: null, completed: false, dim: false, x: cx, y: cy, r: ME_RADIUS };
  const all = [me, ...packed];

  // Relaxation: pull toward center, push overlapping pairs apart (me fixed).
  for (let it = 0; it < 260; it++) {
    for (const n of all) {
      if (n === me) continue;
      n.x += (cx - n.x) * 0.012;
      n.y += (cy - n.y) * 0.012;
    }
    for (let a = 0; a < all.length; a++) {
      for (let b = a + 1; b < all.length; b++) {
        const A = all[a];
        const B = all[b];
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = A.r + B.r + 4;
        if (d < min) {
          const push = (min - d) / d / 2;
          if (A !== me) { A.x -= dx * push; A.y -= dy * push; }
          if (B !== me) { B.x += dx * push; B.y += dy * push; }
          if (A === me) { B.x += dx * push; B.y += dy * push; }
          if (B === me) { A.x -= dx * push; A.y -= dy * push; }
        }
      }
    }
    for (const n of all) {
      if (n === me) continue;
      n.x = Math.max(n.r + 2, Math.min(width - n.r - 2, n.x));
      n.y = Math.max(n.r + 2, Math.min(MAP_HEIGHT - n.r - 2, n.y));
    }
  }

  return { packed, cx, cy };
}

export function BubbleMap({
  nodes,
  meLabel,
  selected,
  onSelect,
}: {
  nodes: BubbleNode[];
  meLabel: string;
  selected: string | null;
  onSelect: (username: string) => void;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => (width > 0 ? pack(nodes, width) : null), [nodes, width]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: MAP_HEIGHT }}>
      {layout && (
        <>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${width} ${MAP_HEIGHT}`}
            aria-hidden
          >
            {layout.packed.map((n) => (
              <line
                key={n.username}
                x1={layout.cx}
                y1={layout.cy}
                x2={n.x}
                y2={n.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            ))}
          </svg>

          {layout.packed.map((n, i) => {
            const color = n.color ?? "var(--app-text-muted)";
            const isSel = selected === n.username;
            return (
              <motion.button
                key={n.username}
                type="button"
                onClick={() => onSelect(n.username)}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: n.dim ? 0.55 : 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: reduce ? 0 : Math.min(i * 0.035, 0.7) }}
                className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-extrabold text-white"
                style={{
                  left: n.x,
                  top: n.y,
                  width: n.r * 2,
                  height: n.r * 2,
                  fontSize: Math.max(8, n.r * 0.62),
                  backgroundColor: "var(--app-bg-surface)",
                  border: `2px solid ${color}`,
                  boxShadow: n.dim
                    ? "none"
                    : isSel
                      ? `0 0 0 3px ${color}, 0 0 22px -2px ${color}`
                      : `0 0 16px -3px ${color}`,
                  color: n.dim ? "var(--app-text-secondary)" : "#fff",
                }}
                aria-label={n.username}
              >
                {n.label}
                {n.completed && (
                  <span
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      inset: -5,
                      border: "2px solid var(--app-gold-light)",
                      boxShadow: "0 0 14px -2px var(--app-gold)",
                    }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* me — fixed center */}
          <motion.div
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="absolute z-[2] grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-extrabold"
            style={{
              left: layout.cx,
              top: layout.cy,
              width: ME_RADIUS * 2,
              height: ME_RADIUS * 2,
              fontSize: 17,
              background: "radial-gradient(circle at 35% 30%, #2A3450, var(--app-bg-elevated) 75%)",
              border: "2px solid var(--app-gold-light)",
              boxShadow: "0 0 26px -4px var(--app-gold)",
              color: "var(--app-gold-light)",
            }}
          >
            {meLabel}
          </motion.div>
        </>
      )}
    </div>
  );
}
