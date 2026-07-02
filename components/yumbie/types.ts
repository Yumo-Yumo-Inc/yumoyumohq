/**
 * Shared types for the YumbieWorkspace — a persistent, side-view, route-aware
 * SVG "office". Yumbie walks between stations on a ground line and passes through
 * a fixed door on the right to swap rooms (scenes) on navigation. Ported 1:1 from
 * the reference prototype (yumbie_final_cpoints_gunes_ay.html).
 *
 * Scenes loop a `plan(cycle)` of steps (continuous work — never fake idle).
 * The scan room is the only one that does REAL work: it processes a real OCR
 * task from useYumbieStore for its real duration.
 */

import type { ReactNode } from "react";

export type SceneId = "today" | "receipts" | "wallet" | "patterns" | "scan" | "bills";

/** Face the engine injects into the walker's face group. */
export type Mood = "idle" | "blink" | "happy" | "sleep";

/**
 * A scripted action. `msg`/`label` are i18n KEYS (resolved at display time).
 *
 * Resting poses: `sit` (settles onto a chair to read) and `lie` (lies down to
 * sleep) are timed steps the engine renders with an eased body pose instead of
 * the upright stance. `tend` waters the plant. They turn idle time into a
 * settled activity rather than aimless standing.
 */
export type Step =
  | { m: "idle"; d: number; msg?: string }
  | { m: "walk"; to: number; msg?: string }
  | { m: "pick"; d: number; src?: string; label?: string; msg?: string }
  | { m: "act"; d: number; fx: string; msg?: string; awaitTask?: boolean }
  | { m: "tend"; d: number; msg?: string; lean?: number }
  | { m: "sit"; d: number; msg?: string }
  | { m: "lie"; d: number; msg?: string }
  | { m: "door"; d: number };

/** A queued reward/feedback effect drawn into <g id="yb-fx">. */
export type Effect =
  | {
      t: "coin";
      a: number;
      from: [number, number];
      ctrl: [number, number];
      to: [number, number];
      onLand?: () => void;
      el?: SVGElement;
      dur?: number;
    }
  | { t: "sink"; a: number; x: number; el?: SVGElement; dur?: number }
  | { t: "plus"; a: number; x: number; y: number; txt: string; el?: SVGElement; dur?: number }
  | {
      t: "bargrow";
      a: number;
      id: string;
      fromH: number;
      toH: number;
      fromY: number;
      toY: number;
      el?: SVGElement;
      dur?: number;
    };

/** API handed to scene callbacks so they can read/mutate the live SVG. */
export interface SceneApi {
  /** Scoped element lookup by id within this workspace's <svg>. */
  $: (id: string) => SVGElement | null;
  /** Push a reward effect into the FX layer. */
  pushFx: (fx: Effect) => void;
  /** Resolve an i18n key (status/label/fx text) to localized text. */
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface Scene {
  id: SceneId;
  /** Static prop layer (behind Yumbie); rendered once, toggled via display. */
  Props: () => ReactNode;
  /** Props drawn IN FRONT of Yumbie (held items like a book or watering can),
   * so they overlay the walker instead of hiding behind it. Same stable ids. */
  FrontProps?: () => ReactNode;
  /** The room's looping work plan (returned each cycle). */
  plan: (cycle: number, api: SceneApi) => Step[];
  /** True when a REAL operation for this room is in flight (scan room only). */
  hasWork?: (api: SceneApi) => boolean;
  /** Steps for the in-flight real operation (only used when hasWork). */
  work?: (api: SceneApi) => Step[];
  /** Called when an `act` step begins. */
  onActStart?: (fx: string, api: SceneApi) => void;
  /** Called at the end of an `act` step to spawn FX and mutate props. */
  onActEnd?: (fx: string, api: SceneApi) => void;
  /** Per-frame scene-specific animation (LED pulse, leaf pulse, …). */
  frame?: (api: SceneApi, ctx: { step: Step; st: number }) => void;
}
