/**
 * useYumbieInsight — state for the weekly grounded awareness feature. `current`
 * is the single observation the app derives from a REAL period comparison (null
 * otherwise). While `pending`, the workspace shows a small "Yumbie noticed
 * something" pill; tapping it opens the sheet. `dismiss` marks it as seen (app
 * callback) and closes the pill. Yumbie never force-opens itself (autonomy) and
 * never judges.
 */
import { create } from "zustand";
import { markInsightSeenId } from "./yumbieRhythm";

export interface YumbieAwareness {
  /** Stable identity (e.g. "2026-W25-foodDrink") — used for "seen" tracking. */
  id: string;
  /** Internal category key (for cap persistence). */
  categoryKey: string;
  /** Localized label (e.g. "Food & Drink"). */
  label: string;
  /** Direction — relative to the user's own history. */
  direction: "up" | "down" | "flat";
  /** Soft magnitude bucket (not an exact % — avoids backlash). */
  magnitude: "slight" | "notable";
  /** Recent-period monthly average (for the soft-cap suggestion); null if unavailable. */
  recentMonthlyAvg?: number | null;
  /** Currency label (e.g. "TRY"). */
  currency?: string;
}

type MarkSeen = (id: string) => void;

interface YumbieInsightState {
  open: boolean;
  current: YumbieAwareness | null;
  pending: boolean;
  _markSeen: MarkSeen | null;
  configure: (markSeen: MarkSeen | null) => void;
  setInsight: (a: YumbieAwareness | null) => void;
  show: () => void;
  hide: () => void;
  /** Close + notify the app "seen" (pill disappears). */
  dismiss: () => void;
}

export const useYumbieInsight = create<YumbieInsightState>((set, get) => ({
  open: false,
  current: null,
  pending: false,
  _markSeen: null,
  configure: (markSeen) => set({ _markSeen: markSeen }),
  setInsight: (a) => set({ current: a, pending: !!a }),
  show: () => {
    const { current } = get();
    if (!current) return;
    // Opening the sheet = the user has READ it. Persist "seen" right now (id-keyed
    // localStorage) so it never re-pops on re-entry, even if they leave without
    // pressing dismiss. Persist only — we do NOT clear `current`, so the sheet we
    // are opening stays up; the source filters it via isInsightSeen(id) on the
    // next mount/reload. Clearing `pending` also drops the "!" cue immediately.
    markInsightSeenId(current.id);
    set({ open: true, pending: false });
  },
  hide: () => set({ open: false }),
  dismiss: () => {
    const { current, _markSeen } = get();
    if (current && _markSeen) _markSeen(current.id);
    set({ open: false, pending: false });
  },
}));
