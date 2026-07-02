/**
 * useYumbieMessage — the one-line message Yumbie shows to the USER beneath the
 * workspace (the area that used to narrate internal work like "scanning…").
 * Any part of the app can make Yumbie speak:
 *   useYumbieMessage.getState().say("3 receipts pending processing")
 * Pass null to fall back to the default greeting. Read by the engine via
 * getState()/subscribe (not the hook) so it never re-renders the rAF loop.
 *
 * Once-per-day acknowledgement: when the user taps the "!" cue (or Yumbie),
 * `markSeen()` records the message text + today's date and persists it to
 * localStorage. The "!" cue treats a message as unseen only when it differs
 * from the acknowledged one OR a new day has begun — so the same daily line
 * never re-raises the cue within the same day, even across remounts/reloads.
 */
import { create } from "zustand";

const SEEN_KEY = "yumbie_msg_seen_v1";

/** Local calendar day key (YYYY-M-D) — daily reset boundary. */
export function yumbieToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadSeen(): { seenMessage: string | null; seenDate: string | null } {
  if (typeof window === "undefined") return { seenMessage: null, seenDate: null };
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return { seenMessage: null, seenDate: null };
    const o = JSON.parse(raw) as { seenMessage?: string | null; seenDate?: string | null };
    return { seenMessage: o.seenMessage ?? null, seenDate: o.seenDate ?? null };
  } catch {
    return { seenMessage: null, seenDate: null };
  }
}

interface YumbieMessageState {
  message: string | null;
  /** Message text the user has acknowledged, and the day they did so. */
  seenMessage: string | null;
  seenDate: string | null;
  say: (message: string | null) => void;
  /** Mark the current message as seen for today (persists across reloads). */
  markSeen: () => void;
}

export const useYumbieMessage = create<YumbieMessageState>((set, get) => ({
  message: null,
  ...loadSeen(),
  say: (message) => set({ message }),
  markSeen: () => {
    const { message } = get();
    if (!message) return;
    const seenDate = yumbieToday();
    set({ seenMessage: message, seenDate });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify({ seenMessage: message, seenDate }));
      } catch {
        // localStorage unavailable (private mode) — in-memory state still dedups this session.
      }
    }
  },
}));
