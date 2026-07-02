/**
 * Conversation state for the Yumbie chat panel (open/closed, message thread,
 * loading). Kept separate from the mascot task queue (useYumbieStore).
 */
import { create } from "zustand";

export interface YumbieChatMessage {
  id: string;
  role: "user" | "yumbie";
  text: string;
}

interface YumbieChatState {
  open: boolean;
  messages: YumbieChatMessage[];
  loading: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggle: () => void;
  push: (role: "user" | "yumbie", text: string) => void;
  setLoading: (loading: boolean) => void;
}

let seq = 0;
const nextId = () => {
  seq += 1;
  return `msg-${seq}`;
};

export const useYumbieChatStore = create<YumbieChatState>((set) => ({
  open: false,
  messages: [],
  loading: false,
  openChat: () => set({ open: true }),
  closeChat: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
  push: (role, text) =>
    set((s) => ({ messages: [...s.messages, { id: nextId(), role, text }].slice(-30) })),
  setLoading: (loading) => set({ loading }),
}));
