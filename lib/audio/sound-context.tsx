"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type SfxKey =
  | "tap"
  | "whoosh"
  | "tick"
  | "scan_complete"
  | "reveal"
  | "success"
  | "checkin"
  | "quest_complete"
  | "level_up"
  | "notification";

type SoundPrefs = {
  enabled: boolean;
  volume: number; // 0..1
};

type SoundContextValue = {
  prefs: SoundPrefs;
  unlocked: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setVolume: (volume: number) => void;
  playSfx: (key: SfxKey) => Promise<void>;
};

const STORAGE_KEY = "yumo:sound:v1";

const DEFAULT_PREFS: SoundPrefs = {
  enabled: true,
  volume: 0.65,
};

const SFX: Record<SfxKey, { src: string[]; volume: number }> = {
  tap: { src: ["/api/sfx/tap?f=ogg", "/api/sfx/tap?f=mp3"], volume: 0.45 },
  whoosh: { src: ["/api/sfx/whoosh?f=ogg", "/api/sfx/whoosh?f=mp3"], volume: 0.55 },
  tick: { src: ["/api/sfx/tick?f=ogg", "/api/sfx/tick?f=mp3"], volume: 0.35 },
  scan_complete: { src: ["/api/sfx/scan_complete?f=ogg", "/api/sfx/scan_complete?f=mp3"], volume: 0.6 },
  reveal: { src: ["/api/sfx/reveal?f=ogg", "/api/sfx/reveal?f=mp3"], volume: 0.65 },
  success: { src: ["/api/sfx/success?f=ogg", "/api/sfx/success?f=mp3"], volume: 0.75 },
  checkin: { src: ["/api/sfx/checkin?f=ogg", "/api/sfx/checkin?f=mp3"], volume: 0.7 },
  quest_complete: { src: ["/api/sfx/quest_complete?f=ogg", "/api/sfx/quest_complete?f=mp3"], volume: 0.75 },
  level_up: { src: ["/api/sfx/level_up?f=ogg", "/api/sfx/level_up?f=mp3"], volume: 0.8 },
  notification: { src: ["/api/sfx/notification?f=ogg", "/api/sfx/notification?f=mp3"], volume: 0.5 },
};

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function readPrefsFromStorage(): SoundPrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SoundPrefs>;
    return {
      enabled: parsed.enabled ?? DEFAULT_PREFS.enabled,
      volume: clamp01(typeof parsed.volume === "number" ? parsed.volume : DEFAULT_PREFS.volume),
    };
  } catch {
    return null;
  }
}

function writePrefsToStorage(prefs: SoundPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      prefs: DEFAULT_PREFS,
      unlocked: false,
      setEnabled: () => {},
      toggleEnabled: () => {},
      setVolume: () => {},
      playSfx: async () => {},
    } satisfies SoundContextValue;
  }
  return ctx;
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<SoundPrefs>(DEFAULT_PREFS);
  const [unlocked, setUnlocked] = useState(false);
  const howlsRef = useRef<Map<SfxKey, unknown>>(new Map());
  const unlockInFlightRef = useRef<Promise<void> | null>(null);

  // Load prefs on mount
  useEffect(() => {
    const stored = readPrefsFromStorage();
    if (stored) setPrefs(stored);
  }, []);

  // Persist prefs
  useEffect(() => {
    writePrefsToStorage(prefs);
  }, [prefs]);

  const setEnabled = useCallback((enabled: boolean) => {
    setPrefs((p) => ({ ...p, enabled: Boolean(enabled) }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setPrefs((p) => ({ ...p, enabled: !p.enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const v = clamp01(volume);
    setPrefs((p) => ({ ...p, volume: v }));
  }, []);

  const ensureUnlocked = useCallback(async () => {
    if (unlocked) return;
    if (unlockInFlightRef.current) return unlockInFlightRef.current;

    unlockInFlightRef.current = (async () => {
      try {
        const { Howler } = await import("howler");
        if (Howler?.ctx && Howler.ctx.state === "suspended") {
          await Howler.ctx.resume();
        }
      } catch {
        // ignore
      } finally {
        setUnlocked(true);
        unlockInFlightRef.current = null;
      }
    })();

    return unlockInFlightRef.current;
  }, [unlocked]);

  // Unlock audio after first user gesture
  useEffect(() => {
    const handler = () => {
      void ensureUnlocked();
    };
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [ensureUnlocked]);

  // Keep master volume in sync after unlock
  useEffect(() => {
    if (!unlocked) return;
    void import("howler").then(({ Howler }) => {
      Howler.volume(prefs.enabled ? clamp01(prefs.volume) : 0);
    }).catch(() => {});
  }, [prefs.enabled, prefs.volume, unlocked]);

  const playSfx = useCallback(
    async (key: SfxKey) => {
      if (!prefs.enabled) return;
      await ensureUnlocked();

      const spec = SFX[key];
      if (!spec) return;

      const { Howl, Howler } = await import("howler");
      Howler.volume(clamp01(prefs.volume));

      const cache = howlsRef.current;
      const existing = cache.get(key) as any | undefined;
      if (existing) {
        try {
          existing.play();
        } catch {
          // ignore
        }
        return;
      }

      const howl = new Howl({
        src: spec.src,
        // format: ["ogg"],
        volume: clamp01(spec.volume),
        preload: true,
      });
      cache.set(key, howl);
      howl.play();
    },
    [ensureUnlocked, prefs.enabled, prefs.volume]
  );

  const value = useMemo(
    () => ({ prefs, unlocked, setEnabled, toggleEnabled, setVolume, playSfx }),
    [prefs, unlocked, setEnabled, toggleEnabled, setVolume, playSfx]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

