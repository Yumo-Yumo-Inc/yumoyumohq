"use client";

import { useMemo } from "react";

/**
 * Yumbie companion mood — state derived from the user's receipt activity.
 *
 *   idle     → default, no receipts yet or 0-day streak
 *   happy    → a receipt was uploaded today (checkedInToday)
 *   worried  → no receipt for 1-2 days
 *   asleep   → no receipt for 3+ days (Yumbie is asleep — meant to pull the user back)
 *
 * Phase 1 scope. Future moods: alpha (opportunity found), focused (analyzing),
 * curious (awaiting input), etc. — see yumo-app-blueprint.md §4.
 */
export type YumbieMood = "idle" | "happy" | "worried" | "asleep";

/**
 * Transient expression — a 1-2 second reaction to an event, then reverts to mood.
 *
 *   celebrate → a receipt was just uploaded: confetti + star eyes + body jump
 */
export type YumbieExpression = "celebrate" | null;

export interface UseYumbieMoodInput {
  /** Was at least 1 receipt uploaded today? */
  checkedInToday?: boolean;
  /** Number of consecutive days with a receipt upload. */
  streak?: number;
  /** ISO timestamp of the last contribution (receipt/quest). */
  lastContributionAt?: string | null;
  /** Override — force the mood manually (e.g. preview/test). */
  override?: YumbieMood;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function useYumbieMood(input: UseYumbieMoodInput): YumbieMood {
  return useMemo(() => {
    if (input.override) return input.override;

    if (input.checkedInToday) return "happy";

    // No receipts at all → idle (new user, no point signaling a negative state)
    if (!input.lastContributionAt && (input.streak ?? 0) === 0) {
      return "idle";
    }

    if (input.lastContributionAt) {
      const last = Date.parse(input.lastContributionAt);
      if (Number.isFinite(last)) {
        const days = Math.floor((Date.now() - last) / MS_PER_DAY);
        if (days >= 3) return "asleep";
        if (days >= 1) return "worried";
      }
    }

    return "idle";
  }, [input.checkedInToday, input.streak, input.lastContributionAt, input.override]);
}
