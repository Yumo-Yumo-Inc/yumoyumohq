/**
 * useYumbieInsights — grounded view-model that the workspace RENDERS. The app
 * fills it with REAL data (the same figures shown on the dashboard); Yumbie's
 * scenes read from here, so the animation is an honest mirror rather than
 * decoration. When a field is missing, the scene shows a neutral "no data yet"
 * state instead of fabricating one. Read by scenes via getState() (does not
 * re-render the rAF loop).
 */
import { create } from "zustand";

export interface YumbieCategory {
  /** Short, ALREADY localized label, e.g. "Groceries". */
  label: string;
  /** Share of total spend, [0,1]. */
  ratio: number;
  /** Optional bar color (hex); falls back to palette order if omitted. */
  color?: string;
}

interface YumbieInsightsState {
  /** Top categories (any length; the patterns scene uses the first 3). */
  categories: YumbieCategory[];
  /** Has the app pushed real data at least once this session? */
  ready: boolean;
  setCategories: (categories: YumbieCategory[]) => void;
  reset: () => void;
}

export const useYumbieInsights = create<YumbieInsightsState>((set) => ({
  categories: [],
  ready: false,
  setCategories: (categories) =>
    set({ categories: categories.slice(0, 6), ready: categories.length > 0 }),
  reset: () => set({ categories: [], ready: false }),
}));
