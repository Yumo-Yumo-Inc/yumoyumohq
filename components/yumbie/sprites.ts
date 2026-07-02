/**
 * sprites.ts — Yumbie face builders + layout constants, ported 1:1 from the
 * reference prototype. The face <g> is injected into the walker via innerHTML by
 * the engine (so they are SVG strings). The body/tie/feet are rendered as JSX in
 * the engine. The necktie is TEAL (#3FB8A5) per the reference.
 */
import type { Mood } from "./types";

export const EYE_L = 67;
export const EYE_R = 133;
export const EYE_Y = 79;
/** Walker render scale and ground baseline. Reference was 0.45; reduced 30%. */
export const SC = 0.22;
export const GROUND = 108;
/** Vertical offset so the scaled walker stands on the ground line. */
export const TY = GROUND - 165 * SC;

function openEye(cx: number): string {
  return (
    `<ellipse cx="${cx}" cy="${EYE_Y}" rx="15" ry="18" fill="#2B2118"/>` +
    `<circle cx="${cx + 6}" cy="${EYE_Y - 8}" r="5.5" fill="#FFF7E8"/>` +
    `<circle cx="${cx - 5}" cy="${EYE_Y + 8}" r="3" fill="#CDBDA6"/>`
  );
}
function closedEye(cx: number): string {
  return `<path d="M${cx - 13} ${EYE_Y} Q${cx} ${EYE_Y + 9} ${cx + 13} ${EYE_Y}" stroke="#2B2118" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}
function happyEye(cx: number): string {
  return `<path d="M${cx - 13} ${EYE_Y + 2} Q${cx} ${EYE_Y - 11} ${cx + 13} ${EYE_Y + 2}" stroke="#2B2118" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}

const CHEEKS =
  '<ellipse cx="49" cy="98" rx="10" ry="5.5" fill="#EF8F74"/><ellipse cx="151" cy="98" rx="10" ry="5.5" fill="#EF8F74"/>';
/** Cat mouth (ω) — preserved across all moods. */
const CAT =
  '<path d="M86 102 Q93 110 100 102 Q107 110 114 102" stroke="#5B3210" stroke-width="4" stroke-linecap="round" fill="none"/>';

/** Calm resting mouth (smaller ω) — used while sleeping. */
const CALM_MOUTH =
  '<path d="M90 103 Q96 109 102 103" stroke="#5B3210" stroke-width="3.5" stroke-linecap="round" fill="none"/>';

const FACE_IDLE = openEye(EYE_L) + openEye(EYE_R) + CHEEKS + CAT;
const FACE_BLINK = closedEye(EYE_L) + closedEye(EYE_R) + CHEEKS + CAT;
const FACE_HAPPY = happyEye(EYE_L) + happyEye(EYE_R) + CHEEKS + CAT;
/** Sleeping: eyes shut and a small calm mouth — a persistent rest face (not a
 * transient blink), so the blink/happy logic leaves it alone while dozing. */
const FACE_SLEEP = closedEye(EYE_L) + closedEye(EYE_R) + CHEEKS + CALM_MOUTH;

export function buildFace(mood: Mood): string {
  if (mood === "happy") return FACE_HAPPY;
  if (mood === "blink") return FACE_BLINK;
  if (mood === "sleep") return FACE_SLEEP;
  return FACE_IDLE;
}
