/**
 * useYumbieGoals — soft spending caps the user sets THEMSELVES (per category).
 * Autonomy: the user sets the cap, Yumbie never imposes one. Persistence belongs
 * to the app; the callback wired via `configure(persist)` is called on every
 * setCap. Going over a cap is NEVER penalized or shamed — Yumbie only celebrates
 * staying under it at month end (no mid-month nagging; research shows early/strict
 * budgeting backfires).
 */
import { create } from "zustand";

type Persist = (categoryKey: string, amount: number) => void;

interface YumbieGoalsState {
  caps: Record<string, number>;
  _persist: Persist | null;
  configure: (persist: Persist | null) => void;
  /** Load existing caps from the app (server truth). */
  hydrate: (caps: Record<string, number>) => void;
  setCap: (categoryKey: string, amount: number) => void;
  clearCap: (categoryKey: string) => void;
  capOf: (categoryKey: string) => number | null;
}

export const useYumbieGoals = create<YumbieGoalsState>((set, get) => ({
  caps: {},
  _persist: null,
  configure: (persist) => set({ _persist: persist }),
  hydrate: (caps) => set({ caps: { ...caps } }),
  setCap: (k, amount) => {
    set((s) => ({ caps: { ...s.caps, [k]: amount } }));
    get()._persist?.(k, amount);
  },
  clearCap: (k) =>
    set((s) => {
      const c = { ...s.caps };
      delete c[k];
      return { caps: c };
    }),
  capOf: (k) => get().caps[k] ?? null,
}));
