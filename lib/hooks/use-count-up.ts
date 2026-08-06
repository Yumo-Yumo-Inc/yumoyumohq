"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface CountUpOptions {
  /** Animation duration in ms (default 900). */
  durationMs?: number;
  /** Gate: while false the value holds and no animation runs (default true). */
  start?: boolean;
}

/**
 * rAF-based count-up that eases from the previous value to the target and
 * respects `prefers-reduced-motion` (jumps straight to the target). Canonical
 * shared implementation — replaces the three copies that used to live in
 * insights, hidden-cost-reveal, and receipt-pipeline-steps. Pass `start: false`
 * to defer the animation until a reveal beat is ready.
 *
 * Returns the raw eased float; callers round/format as they need (integers via
 * `Math.round`, currency via `.toFixed(2)`).
 */
export function useCountUp(target: number, opts: CountUpOptions = {}): number {
  const { durationMs = 900, start = true } = opts;
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    if (reduce) {
      setVal(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, reduce, start]);

  return val;
}
