/**
 * useYumbieVitality — Yumbie's "energy": a vitality value tied to REAL signals
 * that the rAF engine reads to smooth its walking pace and mood. Energy only
 * rises from real events (a completed scan, a daily check-in) and relaxes back
 * toward a calm floor over time — it NEVER drops into "sad/sick" (no guilt
 * mechanic). Low energy means calm/resting, not sad. Read by the engine via
 * getState() (no re-render).
 */
import { create } from "zustand";

const FLOOR = 0.2; // calmest resting level (never drops below this)
const CEIL = 1; // most vital
const RELAX_PER_SEC = 0.05; // relax-to-floor rate (~16s span)

function relaxed(energy: number, updatedAt: number): number {
  const dt = (Date.now() - updatedAt) / 1000;
  const v = energy - RELAX_PER_SEC * dt;
  return Math.max(FLOOR, Math.min(CEIL, v));
}

interface YumbieVitalityState {
  energy: number; // last-set value, 0..1
  updatedAt: number; // timestamp of the last change (ms)
  /** Real positive event (scan completed, check-in). Raises energy. */
  bump: (amount?: number) => void;
  /** Current energy with time-relaxation applied. Cheap; safe to call from rAF. */
  energyNow: () => number;
}

export const useYumbieVitality = create<YumbieVitalityState>((set, get) => ({
  energy: FLOOR,
  updatedAt: Date.now(),
  bump: (amount = 0.6) =>
    set((s) => {
      // relax the current value to "now" first, then add the bump
      const base = relaxed(s.energy, s.updatedAt);
      return { energy: Math.min(CEIL, base + amount), updatedAt: Date.now() };
    }),
  energyNow: () => {
    const s = get();
    return relaxed(s.energy, s.updatedAt);
  },
}));
