/**
 * Contribution Center — economy and engine parameters.
 *
 * Single source of truth for the task economy, mirroring config/contribution-config.ts
 * (quest → cPoints) and config/tokenomics.ts (daily caps). Values here are internal
 * calibration: per CLAUDE.md §9 they are never published in the technical paper, and
 * anything that gates abuse (accuracy, quota, evidence) stays out of user-facing copy.
 *
 * Decisions: memory/decisions/2026-07-17-katki-merkezi-kararlari.md
 */

// ─── Points (K3: paid immediately, accuracy gates volume, not payment) ───────

/**
 * Points for answering one identification task.
 *
 * Anchored below a receipt on purpose. A good receipt pays ~20-60 cPoints and uploading
 * one must stay the primary behaviour; a task is one tap against a receipt's photograph
 * + upload. See DAILY_TASK_POINT_CAP for how this ties to the 500/day ceiling.
 */
export const TASK_POINTS_IDENTIFY = 10;

/** Same payout as identify — one tap for a pack / gramaj fact. */
export const TASK_POINTS_PACK_SIZE = TASK_POINTS_IDENTIFY;

export const TASK_TYPE_IDENTIFY = "product_identify";
export const TASK_TYPE_PACK_SIZE = "product_pack_size";

/**
 * Bonus for the user whose free-text "Diğer" answer went on to win the task.
 *
 * They did the hard half of the work: the machine had no candidate, they supplied the
 * name, and later users only had to agree with it. Paying that the same as a tap would
 * make typing the worst-value action on the screen.
 */
export const TASK_POINTS_OTHER_WINNER = 25;

/**
 * "Bilmiyorum" pays nothing and costs nothing (no points, no reliability hit).
 *
 * Deliberate: if not-knowing has a price, people guess, and guesses poison the data
 * somewhere you cannot see. It is also information — enough of them retire the task.
 */
export const TASK_POINTS_UNKNOWN = 0;

/**
 * Hard ceiling on points from tasks per user per day (Uğur, 2026-07-17).
 *
 * This is a backstop, not the main limiter — QUOTA_MAX * TASK_POINTS_IDENTIFY lands on
 * exactly this number, so the quota is what normally binds. The cap still matters
 * because field missions and "Diğer" bonuses pay from outside the quota.
 *
 * Needed because contribution_point_events has NO daily cap of its own: every existing
 * daily limit sits on receipt_rewards.bint_bonus_amount (run-post-process.ts), so a new
 * source_type is an uncapped tap unless it brings its own ceiling.
 */
export const DAILY_TASK_POINT_CAP = 500;

/** Ledger source_type prefix. The daily cap sums over `source_type LIKE 'task_%'`. */
export const TASK_SOURCE_TYPE_PREFIX = "task_";

export function taskSourceType(taskType: string): string {
  return `${TASK_SOURCE_TYPE_PREFIX}${taskType}`;
}

// ─── Quota (K2: accuracy earns the right to more work) ───────────────────────

/** Daily task quota at reliability 0.5 — where every new account starts. */
export const QUOTA_BASE = 20;

/**
 * Quota floor. Never zero: a user who drops to the floor must still be able to earn
 * their way back, and gold tasks are the only instrument that measures them.
 */
export const QUOTA_MIN = 3;

/** Quota ceiling. QUOTA_MAX * TASK_POINTS_IDENTIFY === DAILY_TASK_POINT_CAP. */
export const QUOTA_MAX = 50;

/** Quota gained/lost per unit of reliability away from the 0.5 starting point. */
export const QUOTA_SLOPE = 60;

/**
 * Daily quota from reliability. Monotonic, clamped, and integer.
 *
 *   reliability 0.14 (consistently wrong) → floor
 *   reliability 0.50 (new account)        → QUOTA_BASE
 *   reliability 0.86 (consistently right) → ceiling
 */
export function dailyQuotaFor(reliability: number): number {
  const r = Number.isFinite(reliability) ? reliability : 0.5;
  const raw = QUOTA_BASE + QUOTA_SLOPE * (r - 0.5);
  return Math.max(QUOTA_MIN, Math.min(QUOTA_MAX, Math.round(raw)));
}

// ─── Reliability (K2: measured by gold tasks, never by agreement) ────────────

/**
 * Beta prior on the gold-task success rate. alpha === beta, so a brand-new account
 * starts at exactly 0.5 and has to earn movement in either direction.
 *
 * Why a prior at all: a raw hit rate says 2/2 is perfect and 0/1 is hopeless. With
 * alpha=beta=2, ten straight correct answers reach ~0.86 and ten straight wrong reach
 * ~0.14 — strong signals, but neither the floor nor the ceiling, so one bad session
 * cannot delete an account and a short lucky streak cannot unlock the ceiling.
 *
 * This is also what breaks K2's chicken-and-egg: without a prior, a new user has no
 * accuracy history, so no quota, so no way to build accuracy history.
 */
export const RELIABILITY_PRIOR_ALPHA = 2;
export const RELIABILITY_PRIOR_BETA = 2;

/** Reliability of an account with no gold history yet. */
export const RELIABILITY_DEFAULT =
  RELIABILITY_PRIOR_ALPHA / (RELIABILITY_PRIOR_ALPHA + RELIABILITY_PRIOR_BETA);

export function reliabilityFrom(goldCorrect: number, goldSeen: number): number {
  const correct = Math.max(0, goldCorrect);
  const seen = Math.max(correct, goldSeen);
  return (
    (correct + RELIABILITY_PRIOR_ALPHA) /
    (seen + RELIABILITY_PRIOR_ALPHA + RELIABILITY_PRIOR_BETA)
  );
}

/**
 * How often a served task is a gold (known-answer) task.
 *
 * Every gold task is a task nobody needed answered, so this is a direct tax on useful
 * throughput — but it is the ONLY way to measure a user without an admin, and both the
 * quota (K2) and the evidence weights depend on that measurement.
 */
export const GOLD_TASK_RATE = 0.12;

// ─── Resolution (K9: threshold follows user density, engine does not change) ─

/**
 * Evidence needed to resolve a task, in summed answer weight (weight = reliability).
 *
 * PROD 2026-07-17: 16 real users, and not one real product string has reached even 2
 * witnesses; monthly witness arrival is 0.334 per string. A "4 users agree" rule would
 * resolve exactly nothing today — this is user density, not a design flaw.
 *
 * So today's threshold accepts a single confident answer. What keeps that honest is not
 * the crowd but the machine: gold-measured reliability (K2), the price-band check
 * (price_ledger_clean) that catches a wrong link before it reaches the chain, and the
 * revertible provenance stamp on the alias.
 *
 * Raise this to open real consensus once density allows — engine, tables and flow are
 * unchanged, only this number moves. Watch CONSENSUS_WITNESS_RATE_TRIGGER.
 */
export const EVIDENCE_THRESHOLD = 0.6;

/**
 * Lead the winning candidate must hold over the runner-up.
 *
 * Without it, a task where two candidates run neck and neck tips to whichever side
 * happens to cross the threshold first.
 */
export const EVIDENCE_MARGIN = 0.25;

/**
 * Monthly new-witness-per-string rate at which a consensus threshold starts to be
 * reachable. PROD is at 0.334 (2026-07-17). Surfaced by /api/contribution/stats.
 */
export const CONSENSUS_WITNESS_RATE_TRIGGER = 0.7;

/** "Bilmiyorum" weight needed before a task is retired as unresolvable. */
export const UNKNOWN_THRESHOLD = 1.5;

/**
 * Stop serving a task after this many answers even if nothing won.
 *
 * Past this point the crowd demonstrably cannot read the string, and every further
 * answer is points spent on a question that is not converging. The task becomes a field
 * mission (K5) instead.
 */
export const ANSWER_CAP = 8;

/** Candidates shown per task: 3 + "Diğer". More than 3 turns a glance into a chore. */
export const CANDIDATES_PER_TASK = 3;

// ─── Task generation ────────────────────────────────────────────────────────

/**
 * A string must cover at least this many line items to be worth crowd attention.
 *
 * PROD 2026-07-17: 96.9% of unresolved strings appear exactly once. Those are owner
 * tasks (K7 — ask whoever bought it, same day) or field missions, not crowd work.
 */
export const MIN_ROW_COUNT_FOR_CROWD = 4;

/**
 * Generic words carry no product identity, so identifying them resolves nothing.
 *
 * They are also, perversely, the only strings that reach many witnesses — a naive
 * generator would ask the crowd exactly the questions that do not need asking and look
 * busy while resolving nothing. Matching is exact against the folded string.
 */
export const GENERIC_STRINGS: ReadonlySet<string> = new Set([
  "ekmek",
  "domates",
  "salatalik",
  "karpuz",
  "limon",
  "patates",
  "sogan",
  "elma",
  "muz",
  "yumurta",
  "su",
  "cay",
  "kahve",
  "seker",
  "un",
  "temel gida",
  "unlu mam",
  "unlu mamul",
  "unlu mamuller",
  "unlu mamuler", // OCR/spelling variant seen on PROD (single L, "MAMÜLER")
  "unlu mamulleri",
  "yiyecek",
  "icecek",
  "gida",
  "manav",
  "kasap",
  "sarkuteri",
  "alkol",
  "ilac",
  "otogaz",
  "yedek parca",
  "muhtelif",
]);

/**
 * Merchant categories whose receipts carry cryptic PRODUCT strings worth identifying.
 *
 * The whole premise is a shelf-product problem: "K.GOFRET" is a supermarket's shorthand
 * for a wafer. A bank statement, a telecom bill, a restaurant tab or a fuel slip has no
 * abbreviated product — it has transaction lines, menu items and fees. Generating tasks
 * from those receipts surfaces "identify this deposit / service fee / döner", which is
 * noise. PROD 2026-07-17: excluding non-retail categories removes ~28% of the unresolved
 * pool at the source, and it is exactly the part with no real product to name.
 *
 * This is the coarse gate (which receipt). The line_kind classifier is the fine gate
 * (which line within a retail receipt) — a grocery receipt still has bag and department
 * lines, and those are caught by line_kind, not here.
 *
 * Values are the live receipts.merchant_category vocabulary (verified on PROD).
 */
export const RETAIL_MERCHANT_CATEGORIES: ReadonlySet<string> = new Set([
  "grocery",
  "supermarket",
  "market",
  "kiosk",
  "pharmacy",
  "apparel",
  "fashion",
  "beauty",
  "personal_care",
  "cosmetics",
  "electronics",
  "alcohol",
  "tobacco",
  "sports",
  "specialty_retail",
]);

/**
 * Task priority. row_count is the honest multiplier shown to the user ("47 fiş
 * düzeldi"); merchant_count is where the product value is — a string seen at several
 * merchants is one whose resolution merges price series, which is the whole point of
 * a price-comparison product. Those strings also carry the most witnesses, so value
 * and solvability point the same way.
 */
export function taskPriority(rowCount: number, merchantCount: number): number {
  return Math.round(rowCount * (1 + Math.max(0, merchantCount)));
}
