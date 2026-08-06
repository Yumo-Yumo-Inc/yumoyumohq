"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store for the user's chosen theme accent (a config/theme-accents
 * key). It lives outside React so `useTier` — mounted ABOVE the profile provider
 * — can still read the accent that AppProfileProvider writes, without reordering
 * providers or threading it through 25 accent consumers. null = brand accent.
 */

let accentKey: string | null = null;
const listeners = new Set<() => void>();

/** Set by the profile provider whenever the stored theme accent changes. */
export function setThemeAccentKey(key: string | null): void {
  if (accentKey === key) return;
  accentKey = key;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current accent key; re-renders subscribers on change. Server snapshot = null. */
export function useThemeAccentKey(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => accentKey,
    () => null,
  );
}
