/**
 * useYumbieStore — the task queue that lets any part of the app ask the Yumbie
 * workspace to do real work (e.g. the upload flow enqueues a "scan" task and
 * settles it when OCR/analyze completes, so Yumbie's scan animation is tied to
 * the real duration). Read by the rAF engine via getState() (not the hook).
 */

import { create } from "zustand";

export type YumbieTaskKind = "process" | "scan";
export type YumbieTaskStatus = "pending" | "running" | "done" | "error";

export interface YumbieTask {
  id: string;
  kind: YumbieTaskKind;
  status: YumbieTaskStatus;
  /** i18n key for the carry/FX label. */
  label?: string;
  createdAt: number;
}

interface YumbieState {
  queue: YumbieTask[];
  enqueue: (task: { kind: YumbieTaskKind; label?: string; id?: string }) => string;
  setStatus: (id: string, status: YumbieTaskStatus) => void;
  shift: () => YumbieTask | undefined;
  peek: () => YumbieTask | undefined;
  remove: (id: string) => void;
}

let seq = 0;
function nextId(): string {
  seq += 1;
  return `yb-${seq}`;
}

export const useYumbieStore = create<YumbieState>((set, get) => ({
  queue: [],
  enqueue: ({ kind, label, id }) => {
    const taskId = id ?? nextId();
    const task: YumbieTask = { id: taskId, kind, label, status: "pending", createdAt: Date.now() };
    set((s) => ({ queue: [...s.queue, task].slice(-4) }));
    return taskId;
  },
  setStatus: (id, status) =>
    set((s) => ({ queue: s.queue.map((t) => (t.id === id ? { ...t, status } : t)) })),
  shift: () => {
    const head = get().queue[0];
    if (head) set((s) => ({ queue: s.queue.slice(1) }));
    return head;
  },
  peek: () => get().queue[0],
  remove: (id) => set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));
