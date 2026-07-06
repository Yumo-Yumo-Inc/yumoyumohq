/**
 * Oracle rollout phase flags.
 * Each phase is toggled via an env var. All default to disabled (false),
 * except the retry cron which defaults to enabled.
 *
 * Example: to enable phase 2, add to .env.local:
 *   ORACLE_FAZ2_ENABLED=true
 *
 * Phases:
 *   ORACLE_FAZ2_ENABLED                 — Queues a receipt for post-process after it's saved; runs the worker.
 *   ORACLE_TRUST_WORKER_ENABLED         — Runs the trust-update step after phase 2 completes (user_trust_scores, history).
 *   ORACLE_ACCOUNT_SEASON_LEVEL_ENABLED — Writes XP and updates account/season level after trust-update.
 *   ORACLE_RETRY_CRON_ENABLED           — Enables the retry-failed-postprocess cron (otherwise it's a no-op).
 */

function envBool(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

/** Default-on flag: disabled only when the env var is explicitly false. */
function envBoolDefaultTrue(name: string): boolean {
  const v = process.env[name];
  return v !== "false" && v !== "0";
}

export const oraclePhases = {
  /** Phase 2: post-process worker (receipt_vision_raw → verified, triggers trust-update). */
  get faz2Enabled(): boolean {
    return envBool("ORACLE_FAZ2_ENABLED");
  },

  /** Trust worker: updates user_trust_scores + user_trust_score_history after phase 2. */
  get trustWorkerEnabled(): boolean {
    return envBool("ORACLE_TRUST_WORKER_ENABLED");
  },

  /** Account + season level: XP events, user_profiles.account_xp/level, season_xp/level. */
  get accountSeasonLevelEnabled(): boolean {
    return envBool("ORACLE_ACCOUNT_SEASON_LEVEL_ENABLED");
  },

  /**
   * Retry cron: re-queues failed/stale post-process jobs. Default ON — the
   * cron is the only mechanism draining receipts whose inline after()
   * post-process died (fix 2026-07-06). Set ORACLE_RETRY_CRON_ENABLED=false
   * to disable.
   */
  get retryCronEnabled(): boolean {
    return envBoolDefaultTrue("ORACLE_RETRY_CRON_ENABLED");
  },
};

export function isFaz2Enabled(): boolean {
  return oraclePhases.faz2Enabled;
}

export function isTrustWorkerEnabled(): boolean {
  return oraclePhases.trustWorkerEnabled;
}

export function isAccountSeasonLevelEnabled(): boolean {
  return oraclePhases.accountSeasonLevelEnabled;
}
