/**
 * Scene registry + route → scene mapping. Five rooms (per spec); any other
 * authenticated /app route shows the home (today) room.
 */
import type { Scene, SceneId } from "../types";
import today from "./today";
import receipts from "./receipts";
import wallet from "./wallet";
import patterns from "./patterns";
import scan from "./scan";
import bills from "./bills";

export const SCENES: Record<SceneId, Scene> = { today, receipts, wallet, patterns, scan, bills };

/** Render order of the prop layers (all mounted, toggled via display). */
export const SCENE_ORDER: SceneId[] = ["today", "receipts", "wallet", "patterns", "scan", "bills"];

const ROUTE_SCENE: Array<[RegExp, SceneId]> = [
  [/^\/app(\/dashboard)?\/?$/, "today"],
  [/^\/app\/receipts/, "receipts"],
  // The "Wallet" tab routes to /app/mine; /app/rewards is the same vault.
  [/^\/app\/mine/, "wallet"],
  [/^\/app\/rewards/, "wallet"],
  [/^\/app\/patterns/, "patterns"],
  [/^\/app\/(insights|personal-insights|insights-preview)/, "patterns"],
  [/^\/app\/bills/, "bills"],
  [/^\/app\/upload/, "scan"],
];

/** Every allowed /app route gets a room; unmapped routes use the home room. */
export function pathToScene(pathname: string): SceneId {
  for (const [re, id] of ROUTE_SCENE) {
    if (re.test(pathname)) return id;
  }
  return "today";
}

/** Routes where the workspace must NOT appear: auth / onboarding, and the
 *  Patterns page (its identity radar is the focus — no companion overlay). */
const DENY = [
  /^\/app\/patterns/,
  /^\/app\/login/,
  /^\/app\/register/,
  /^\/app\/forgot-password/,
  /^\/app\/reset-password/,
  /^\/app\/verify/,
  /^\/app\/verify-email/,
  /^\/app\/welcome/,
];

export function isWorkspaceAllowed(pathname: string): boolean {
  return !DENY.some((re) => re.test(pathname));
}
