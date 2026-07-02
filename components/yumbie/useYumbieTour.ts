/**
 * useYumbieTour — the brain of the weekly tour. Walks Yumbie through the user's
 * world using the existing door/room mechanism: each "beat" requests a scene
 * (the engine calls goScene), updates the message bar with a grounded line, and
 * gives a small vitality bump. The full timeline lives here (setTimeout); the
 * engine only renders the requested scene and returns to the route once the
 * tour ends.
 *
 * `pending`: weekly-summary beats stored once the app prepares them — the
 * workspace shows this as a small "Weekly summary" pill; tapping it calls
 * start(). The tour never force-starts itself (autonomy).
 */
import { create } from "zustand";
import type { SceneId } from "./types";
import { useYumbieMessage } from "./useYumbieMessage";
import { useYumbieVitality } from "./useYumbieVitality";

export interface TourBeat {
  /** Scene to show for this beat (keeps the current scene if omitted). */
  scene?: SceneId;
  /** Grounded line to show in the message bar (already localized). */
  line: string;
  /** How long this beat is held (ms). Generous since door transitions take ~1.7-3s. */
  holdMs?: number;
}

interface YumbieTourState {
  active: boolean;
  scene: SceneId | null; // scene the tour currently requests (read by the engine)
  pending: TourBeat[] | null; // prepared weekly summary (for the pill)
  setPending: (beats: TourBeat[] | null) => void;
  start: (beats: TourBeat[], opts?: { onDone?: () => void }) => void;
  stop: () => void;
}

let timers: ReturnType<typeof setTimeout>[] = [];
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

export const useYumbieTour = create<YumbieTourState>((set) => ({
  active: false,
  scene: null,
  pending: null,

  setPending: (beats) => set({ pending: beats }),

  start: (beats, opts) => {
    clearTimers();
    if (!beats.length) return;
    set({ active: true, pending: null });

    let tAcc = 0;
    for (const b of beats) {
      const at = tAcc;
      timers.push(
        setTimeout(() => {
          if (b.scene) set({ scene: b.scene });
          useYumbieMessage.getState().say(b.line);
          useYumbieVitality.getState().bump(0.3);
        }, at)
      );
      tAcc += b.holdMs ?? 3000;
    }

    timers.push(
      setTimeout(() => {
        set({ active: false, scene: null });
        // The last beat is the farewell ("A good week. See you tomorrow.") — it
        // stays as Yumbie's final word. We do NOT revert to the daily greeting,
        // and we mark it seen so the "!" cue doesn't re-pop after goodbye. The
        // daily line is suppressed for the rest of the day by YumbieDataBridge.
        useYumbieMessage.getState().markSeen();
        opts?.onDone?.();
      }, tAcc + 200)
    );
  },

  stop: () => {
    clearTimers();
    set({ active: false, scene: null });
    useYumbieMessage.getState().say(null);
  },
}));
