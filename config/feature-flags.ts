/**
 * Feature flags for the v1 on-chain reward layer. Pure TS, env-driven.
 *
 * All default to false: the on-chain layer ships dark and is enabled per
 * environment (Vercel). Staking, 777 pNFT and premium are infra-ready but
 * launch-disabled (karar §11.2 / §11.3 / §11.4).
 *
 * A flag is on only when its env var is exactly "true".
 */

function flag(key: string, def = false): boolean {
  const raw = process.env[key];
  if (raw === undefined) return def;
  return raw === "true";
}

export const FLAGS = {
  /** Off-chain reward engine + epoch settlement flow. */
  onchainRewards: flag("FEATURE_ONCHAIN_REWARDS"),
  /** Staking accrual — phase 2 (built but dormant). */
  staking: flag("FEATURE_STAKING"),
  /** 777 corporate pNFT — designs not ready. */
  pnft777: flag("FEATURE_777_PNFT"),
  /** Consumer premium (off-chain entitlement, fiat). */
  premium: flag("FEATURE_PREMIUM"),
  /** Periodic participation-based airdrop distributions (config/airdrop.ts). */
  airdrop: flag("FEATURE_AIRDROP"),
  /** Daily season rollover cron — ships dark until Genesis is live. */
  seasonRollover: flag("FEATURE_SEASON_ROLLOVER"),
} as const;

export type FeatureFlag = keyof typeof FLAGS;
