/**
 * reward-bonus.ts — Scan bonus stack (karar 2026-07-06).
 *
 * The hidden-cost slice alone yields single-digit USD-equivalent rewards
 * (a 272 THB receipt ≈ 2 cPoints). The bonus stack lifts a rewarded receipt
 * into the three-digit range while keeping the per-receipt / daily caps
 * meaningful:
 *
 *   boosted = (raw + scanBonus + firstScanOfDayBonus) × streakMultiplier
 *
 * - scanBonus            — flat, every receipt whose hidden-cost slice earned
 *                          a nonzero raw reward (ineligible documents never
 *                          reach this path; the orchestrator gate skips the
 *                          reward branch entirely).
 * - firstScanOfDayBonus  — flat, first rewarded receipt of the UTC day.
 * - streakMultiplier     — applied when the user also had a rewarded receipt
 *                          the previous UTC day.
 *
 * Defaults are env-overridable so the stack can be re-tuned per season
 * without a deploy.
 */

import { getSql } from "@/lib/db/client";

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getScanBonus(): number {
  return envNumber("REWARD_SCAN_BONUS", 75);
}

export function getFirstScanOfDayBonus(): number {
  return envNumber("REWARD_FIRST_SCAN_OF_DAY_BONUS", 15);
}

export function getStreakMultiplier(): number {
  const value = envNumber("REWARD_STREAK_MULTIPLIER", 1.1);
  return value >= 1 ? value : 1;
}

/**
 * CPI band cap (karar 2026-07-06): the annual inflation percent at/above which
 * the CPI multiplier reaches its ×2 top. The multiplier maps inflation into
 * the [×1.0, ×2.0] band — high-inflation countries earn more, but the
 * cross-country gap from inflation alone never exceeds 2×.
 */
export function getCpiBandCapPercent(): number {
  const value = envNumber("REWARD_CPI_BAND_CAP_PERCENT", 30);
  return value > 0 ? value : 30;
}

/** Maps annual inflation percent into the [1.0, 2.0] multiplier band. */
export function cpiMultiplierFromInflationPercent(inflationPercent: number): number {
  const capPct = getCpiBandCapPercent();
  const clamped = Math.min(Math.max(inflationPercent, 0), capPct);
  return Math.round((1 + clamped / capPct) * 10000) / 10000;
}

export interface BonusStackInput {
  rawReward: number;
  firstScanOfDay: boolean;
  streakActive: boolean;
}

export interface BonusStackResult {
  /** Reward after the bonus stack, before caps. */
  boostedReward: number;
  scanBonus: number;
  firstScanOfDayBonus: number;
  streakMultiplier: number;
}

/** Pure bonus math; only applies when the base reward is nonzero. */
export function computeBonusStack(input: BonusStackInput): BonusStackResult {
  const raw = Math.max(0, input.rawReward);
  if (raw <= 0) {
    return { boostedReward: 0, scanBonus: 0, firstScanOfDayBonus: 0, streakMultiplier: 1 };
  }
  const scanBonus = getScanBonus();
  const firstScanOfDayBonus = input.firstScanOfDay ? getFirstScanOfDayBonus() : 0;
  const streakMultiplier = input.streakActive ? getStreakMultiplier() : 1;
  const boosted = (raw + scanBonus + firstScanOfDayBonus) * streakMultiplier;
  return {
    boostedReward: Math.round(boosted * 100) / 100,
    scanBonus,
    firstScanOfDayBonus,
    streakMultiplier,
  };
}

/**
 * DB flags for the stack. Fail-safe: on DB error both flags are false, so the
 * user still gets raw + scanBonus (never an exception into the pricing path).
 */
export async function getBonusStackFlags(
  username: string
): Promise<{ firstScanOfDay: boolean; streakActive: boolean }> {
  const sql = getSql();
  if (!sql || !username) return { firstScanOfDay: false, streakActive: false };
  try {
    const rows = await sql`
      SELECT
        NOT EXISTS (
          SELECT 1 FROM receipts
          WHERE username = ${username}
            AND COALESCE(reward_final, 0) > 0
            AND created_at >= (NOW() AT TIME ZONE 'UTC')::date
        ) AS first_scan_of_day,
        EXISTS (
          SELECT 1 FROM receipts
          WHERE username = ${username}
            AND COALESCE(reward_final, 0) > 0
            AND created_at >= (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day'
            AND created_at < (NOW() AT TIME ZONE 'UTC')::date
        ) AS streak_active
    `;
    const row = rows?.[0] as
      | { first_scan_of_day?: boolean; streak_active?: boolean }
      | undefined;
    return {
      firstScanOfDay: row?.first_scan_of_day === true,
      streakActive: row?.streak_active === true,
    };
  } catch (err) {
    console.warn(`[reward-bonus] flag lookup failed for ${username}:`, err);
    return { firstScanOfDay: false, streakActive: false };
  }
}
