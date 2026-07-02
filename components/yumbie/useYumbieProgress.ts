/**
 * useYumbieProgress — the user's REAL progress state: cPoints balance, streak,
 * and bond level. All of it is fed by the app (from real history); Yumbie
 * reflects it rather than generating it. The wallet scene reads cPoints, the
 * today scene reads bond. Scenes read via getState() (does not re-render the
 * rAF loop).
 */
import { create } from "zustand";

interface YumbieProgressFields {
  /** Real total cPoints balance; null if unknown. */
  cPoints: number | null;
  /** Streak (days); null if unknown. */
  streak: number | null;
  /** Bond level (0..N, scale is a real app-owned engagement metric). */
  bond: number | null;
  /**
   * REAL receipt count over the last 7 days. The today scene reads this to
   * replay the user's actions (receipt scans) back through Yumbie; 0 means no
   * fabricated action is shown.
   */
  recentReceipts: number | null;
}

interface YumbieProgressState extends YumbieProgressFields {
  set: (p: Partial<YumbieProgressFields>) => void;
}

export const useYumbieProgress = create<YumbieProgressState>((set) => ({
  cPoints: null,
  streak: null,
  bond: null,
  recentReceipts: null,
  set: (p) => set(p),
}));
