/**
 * Correction-flow policy constants (Faz 3).
 * CALIBRATION (CLAUDE.md §9): thresholds stay in code, never in docs/UI copy.
 * See: memory/decisions/2026-06-03-honor-tabanli-odul-ve-edit-akisi.md (Karar A/C).
 */

/** Approved correction bonus = this fraction of the receipt's reward (cPoints). */
export const CORRECTION_BONUS_RATE = 0.1;

/** Rolling window for counting a user's rejected corrections. */
export const WRONG_CORRECTION_WINDOW_DAYS = 30;

/**
 * Karar C escalation: 1st/2nd rejection → warning only; from the Nth rejection in
 * the window the user's honor drops. N = this value (the "3rd wrong" tier).
 */
export const WRONG_CORRECTION_HONOR_DROP_TIER = 3;

/** Honor delta magnitude applied at/after the drop tier (negative). */
export const WRONG_CORRECTION_HONOR_PENALTY = 8;
