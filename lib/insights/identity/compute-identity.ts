/**
 * Spending Identity — computation
 *
 * Pure functions that turn a user's receipt + line-item history into a
 * SpendingIdentity (six traits, deltas, class). Splitting fetch from compute
 * keeps the math deterministic and testable.
 *
 * Each trait is backed by ONE concrete signal:
 *   impulse  → weekend/evening/night spend share   (created_at + extraction time)
 *   hunter   → discounted purchase ratio            (line_items.discount_amount)
 *   explorer → new-merchant rate                    (first-seen per user-merchant)
 *   hedonist → hedonic-category spend share         (category taxonomy)
 *   loyal    → top-2 merchant visit concentration   (merchant_name frequency)
 *   planner  → essentials share + steady basket     (taxonomy + basket variance)
 *
 * When a signal has no supporting data the trait value is null (UI shows an
 * empty state); we never fabricate a number.
 */

import { db } from "@/lib/db/client";
import {
  type SpendingIdentity,
  type Trait,
  type TraitConfidence,
  type TraitKey,
  TRAIT_KEYS,
} from "./identity-types";

// Below this many receipts we cannot honestly read an identity.
const MIN_RECEIPTS_FOR_IDENTITY = 4;
// A window needs at least this many receipts for its trait values to count
// toward a delta.
const MIN_RECEIPTS_FOR_DELTA = 3;
// Default trailing window we score; falls back to the full span when shorter.
const DEFAULT_WINDOW_DAYS = 90;
const DAY_MS = 86_400_000;

export interface ReceiptRow {
  receipt_id: string;
  merchant_name: string | null;
  merchant_city: string | null;
  pricing_total_paid: number | string | null;
  created_at: string;
  extraction_time_value: string | null;
}

/** Most common merchant_city across the user's receipts, returned in its most
 *  frequent raw form (for display). Matching normalizes with lower(btrim(...)).
 *  Returns null when no receipt carries a city. */
function dominantCity(receipts: ReceiptRow[]): string | null {
  const counts = new Map<string, { raw: string; n: number }>();
  for (const r of receipts) {
    const raw = r.merchant_city?.trim();
    if (!raw) continue;
    const norm = raw.toLocaleLowerCase("tr-TR");
    const cur = counts.get(norm);
    if (cur) cur.n += 1;
    else counts.set(norm, { raw, n: 1 });
  }
  let best: { raw: string; n: number } | null = null;
  for (const v of counts.values()) {
    if (!best || v.n > best.n) best = v;
  }
  return best?.raw ?? null;
}

export interface LineItemRow {
  receipt_id: string;
  category_path: string | null;
  line_total_gross: number | string | null;
  discount_amount: number | string | null;
}

const ESSENTIAL_ROOTS = new Set([
  "groceries",
  "grocery",
  "gida",
  "market",
  "supermarket",
  "utilities",
  "transport",
  "fuel",
  "pharmacy",
  "health",
  "home",
]);

const HEDONIC_ROOTS = new Set([
  "cafe",
  "coffee",
  "dessert",
  "snack",
  "bakery",
  "restaurant",
  "restaurants",
  "dining",
  "entertainment",
  "delivery",
  "food_delivery",
  "alcohol",
  "bar",
]);

function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

function categoryRoot(path: string | null): string | null {
  if (!path) return null;
  const root = path.split(/[./>|]/)[0]?.trim().toLowerCase();
  return root && root.length > 0 ? root : null;
}

function hourOf(timeValue: string | null): number | null {
  if (!timeValue) return null;
  const hh = parseInt(timeValue.split(":")[0], 10);
  return Number.isNaN(hh) || hh < 0 || hh > 23 ? null : hh;
}

function isEveningOrNight(hour: number | null): boolean {
  if (hour === null) return false;
  return hour >= 17 || hour < 5;
}

function isWeekend(iso: string): boolean {
  const d = new Date(iso).getDay();
  return d === 0 || d === 6;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function score(share: number): number {
  return Math.round(clamp01(share) * 100);
}

interface TraitDraft {
  value: number | null;
  confidence: TraitConfidence;
  evidence: Trait["evidence"];
}

/**
 * Compute the six trait drafts for a single window. `firstSeen` maps each
 * merchant to the timestamp of its first-ever visit (computed over the full
 * history, not just this window) so the explorer trait knows what is "new".
 */
function computeTraits(
  receipts: ReceiptRow[],
  itemsByReceipt: Map<string, LineItemRow[]>,
  firstSeen: Map<string, number>,
  windowStartMs: number,
): Record<TraitKey, TraitDraft> {
  const totalReceipts = receipts.length;

  // --- spend + line aggregates ---
  let totalPaid = 0;
  let weekendNightPaid = 0;
  let receiptsWithTime = 0;

  let totalItems = 0;
  let discountedItems = 0;
  let totalLineSpend = 0;
  let discountedSpend = 0;
  let hedonicSpend = 0;
  let essentialSpend = 0;

  const merchantVisitCount = new Map<string, number>();
  const baskets: number[] = [];

  for (const r of receipts) {
    const paid = num(r.pricing_total_paid);
    totalPaid += paid;
    baskets.push(paid);

    const hour = hourOf(r.extraction_time_value);
    if (hour !== null) receiptsWithTime += 1;
    if (isWeekend(r.created_at) || isEveningOrNight(hour)) weekendNightPaid += paid;

    const merchant = r.merchant_name?.trim();
    if (merchant) merchantVisitCount.set(merchant, (merchantVisitCount.get(merchant) ?? 0) + 1);

    for (const item of itemsByReceipt.get(r.receipt_id) ?? []) {
      const gross = num(item.line_total_gross);
      totalItems += 1;
      totalLineSpend += gross;
      if (num(item.discount_amount) > 0) {
        discountedItems += 1;
        discountedSpend += gross;
      }
      const root = categoryRoot(item.category_path);
      if (root && HEDONIC_ROOTS.has(root)) hedonicSpend += gross;
      if (root && ESSENTIAL_ROOTS.has(root)) essentialSpend += gross;
    }
  }

  const merchantVisits = [...merchantVisitCount.values()].reduce((a, b) => a + b, 0);
  const distinctMerchants = merchantVisitCount.size;

  // --- impulse: weekend/evening-night share of spend ---
  const impulse: TraitDraft = (() => {
    if (totalPaid <= 0) return { value: null, confidence: "none", evidence: {} };
    const share = clamp01(weekendNightPaid / totalPaid);
    const timeCoverage = totalReceipts > 0 ? receiptsWithTime / totalReceipts : 0;
    return {
      value: score(share),
      confidence: timeCoverage < 0.3 ? "low" : "high",
      evidence: {
        impulse: { weekendNightShare: share, receiptsWithTime, totalReceipts },
      },
    };
  })();

  // --- hunter: discounted item ratio ---
  const hunter: TraitDraft = (() => {
    if (totalItems <= 0) return { value: null, confidence: "none", evidence: {} };
    const ratio = clamp01(discountedItems / totalItems);
    return {
      value: score(ratio),
      confidence: totalItems < 10 ? "low" : "high",
      evidence: {
        hunter: {
          discountedItems,
          totalItems,
          discountedSpendShare: totalLineSpend > 0 ? clamp01(discountedSpend / totalLineSpend) : 0,
        },
      },
    };
  })();

  // --- explorer: share of visits to merchants first seen inside the window ---
  const explorer: TraitDraft = (() => {
    if (merchantVisits <= 0) return { value: null, confidence: "none", evidence: {} };
    let newMerchantVisits = 0;
    const newMerchants = new Set<string>();
    for (const r of receipts) {
      const merchant = r.merchant_name?.trim();
      if (!merchant) continue;
      const fs = firstSeen.get(merchant);
      if (fs !== undefined && fs >= windowStartMs) {
        newMerchantVisits += 1;
        newMerchants.add(merchant);
      }
    }
    const share = clamp01(newMerchantVisits / merchantVisits);
    return {
      value: score(share),
      confidence: merchantVisits < 5 ? "low" : "high",
      evidence: {
        explorer: { newMerchants: newMerchants.size, merchantVisits },
      },
    };
  })();

  // --- hedonist: hedonic-category spend share ---
  const hedonist: TraitDraft = (() => {
    if (totalLineSpend <= 0) return { value: null, confidence: "none", evidence: {} };
    const share = clamp01(hedonicSpend / totalLineSpend);
    return {
      value: score(share),
      confidence: totalItems < 10 ? "low" : "high",
      evidence: { hedonist: { hedonicShare: share } },
    };
  })();

  // --- loyal: top-2 merchant visit concentration ---
  const loyal: TraitDraft = (() => {
    if (merchantVisits <= 0) return { value: null, confidence: "none", evidence: {} };
    const sorted = [...merchantVisitCount.entries()].sort((a, b) => b[1] - a[1]);
    const top2 = sorted.slice(0, 2).reduce((sum, [, c]) => sum + c, 0);
    const share = clamp01(top2 / merchantVisits);
    const topShare = sorted.length > 0 ? clamp01(sorted[0][1] / merchantVisits) : 0;
    return {
      value: score(share),
      confidence: merchantVisits < 5 ? "low" : "high",
      evidence: {
        loyal: {
          topMerchantName: sorted[0]?.[0] ?? null,
          topMerchantShare: topShare,
          distinctMerchants,
        },
      },
    };
  })();

  // --- planner: essentials share + steady basket size ---
  const planner: TraitDraft = (() => {
    if (totalLineSpend <= 0 && baskets.length < 2) {
      return { value: null, confidence: "none", evidence: {} };
    }
    const essentialShare = totalLineSpend > 0 ? clamp01(essentialSpend / totalLineSpend) : 0;
    let basketCv: number | null = null;
    if (baskets.length >= 2) {
      const mean = baskets.reduce((a, b) => a + b, 0) / baskets.length;
      if (mean > 0) {
        const variance = baskets.reduce((s, v) => s + (v - mean) ** 2, 0) / baskets.length;
        basketCv = Math.sqrt(variance) / mean;
      }
    }
    // High essentials + low basket swing → planned. Cap CV contribution at 1.
    const steadiness = basketCv === null ? 0.5 : 1 - clamp01(basketCv);
    const value = Math.round((essentialShare * 0.6 + steadiness * 0.4) * 100);
    return {
      value,
      confidence: totalReceipts < 5 ? "low" : "high",
      evidence: { planner: { essentialShare, basketCv } },
    };
  })();

  return { impulse, hunter, explorer, hedonist, loyal, planner };
}

export type IdentityRange = "30d" | "90d" | "all";

function rangeToDays(range: IdentityRange): number {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return Number.POSITIVE_INFINITY; // "all" → full span
}

/**
 * Build the full identity from already-fetched rows. Pure and deterministic.
 *
 * @param now epoch ms used as the window anchor (pass an explicit value so the
 *            result is reproducible; the route stamps the wall clock).
 * @param requestedDays trailing window length; the full span is used when this
 *            exceeds the available history (so "all" passes Infinity).
 */
export function buildIdentity(
  allReceipts: ReceiptRow[],
  allItems: LineItemRow[],
  now: number,
  requestedDays: number = DEFAULT_WINDOW_DAYS,
): SpendingIdentity {
  // Sort ascending by time so first-seen is straightforward.
  const sorted = [...allReceipts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const firstSeen = new Map<string, number>();
  for (const r of sorted) {
    const merchant = r.merchant_name?.trim();
    if (!merchant) continue;
    const t = new Date(r.created_at).getTime();
    if (!firstSeen.has(merchant)) firstSeen.set(merchant, t);
  }

  const itemsByReceipt = new Map<string, LineItemRow[]>();
  for (const item of allItems) {
    const arr = itemsByReceipt.get(item.receipt_id);
    if (arr) arr.push(item);
    else itemsByReceipt.set(item.receipt_id, [item]);
  }

  // Window: trailing requestedDays, capped at the full span (so "all" and
  // sparse histories both resolve to the data we actually have).
  const earliest = sorted.length > 0 ? new Date(sorted[0].created_at).getTime() : now;
  const spanDays = Math.max(1, (now - earliest) / DAY_MS);
  const windowDays = Math.min(requestedDays, Math.ceil(spanDays));
  const windowStart = now - windowDays * DAY_MS;
  const prevWindowStart = windowStart - windowDays * DAY_MS;

  const inWindow = (r: ReceiptRow) => new Date(r.created_at).getTime() >= windowStart;
  const inPrevWindow = (r: ReceiptRow) => {
    const t = new Date(r.created_at).getTime();
    return t >= prevWindowStart && t < windowStart;
  };

  const current = sorted.filter(inWindow);
  const previous = sorted.filter(inPrevWindow);

  const currentDrafts = computeTraits(current, itemsByReceipt, firstSeen, windowStart);
  const prevDrafts =
    previous.length >= MIN_RECEIPTS_FOR_DELTA
      ? computeTraits(previous, itemsByReceipt, firstSeen, prevWindowStart)
      : null;

  const traits: Trait[] = TRAIT_KEYS.map((key) => {
    const d = currentDrafts[key];
    const prev = prevDrafts?.[key];
    const delta =
      d.value !== null && prev && prev.value !== null ? d.value - prev.value : null;
    return { key, value: d.value, delta, confidence: d.confidence, evidence: d.evidence };
  });

  const insufficientData = current.length < MIN_RECEIPTS_FOR_IDENTITY;

  // Class = the two strongest non-null traits.
  const ranked = traits
    .filter((t): t is Trait & { value: number } => t.value !== null && t.value > 0)
    .sort((a, b) => b.value - a.value);
  const classKeys: SpendingIdentity["classKeys"] =
    !insufficientData && ranked.length >= 2 ? [ranked[0].key, ranked[1].key] : null;

  return {
    computedAt: null,
    homeCity: dominantCity(sorted),
    receiptCount: current.length,
    windowDays,
    classKeys,
    traits,
    insufficientData,
  };
}

const COMPLETED_STATUSES = ["completed", "verified", "scanned"];

async function fetchReceipts(username: string): Promise<ReceiptRow[]> {
  const { rows } = await db.query<ReceiptRow>(
    `
SELECT receipt_id, merchant_name, merchant_city, pricing_total_paid, created_at, extraction_time_value
FROM receipts
WHERE username = $1
  AND status = ANY($2)
  AND (expense_type = 'personal' OR expense_type IS NULL)
ORDER BY created_at ASC
`,
    [username, COMPLETED_STATUSES],
  );
  return rows;
}

async function fetchLineItems(username: string): Promise<LineItemRow[]> {
  const { rows } = await db.query<LineItemRow>(
    `
SELECT rli.receipt_id, rli.category_path, rli.line_total_gross, rli.discount_amount
FROM receipt_line_items rli
JOIN receipts r ON r.receipt_id = rli.receipt_id
WHERE r.username = $1
  AND r.status = ANY($2)
  AND (r.expense_type = 'personal' OR r.expense_type IS NULL)
`,
    [username, COMPLETED_STATUSES],
  );
  return rows;
}

/**
 * Persist the derived class + trait values onto user_behavior_profile so the
 * tribe layer can aggregate cohorts. Best-effort: if the row or the identity
 * columns do not exist yet (migration 097 not applied), this silently no-ops —
 * it must never break the identity endpoint.
 */
async function persistIdentityClass(username: string, identity: SpendingIdentity): Promise<void> {
  if (identity.insufficientData || !identity.classKeys) return;
  const traitMap: Record<string, number | null> = {};
  for (const t of identity.traits) traitMap[t.key] = t.value;
  try {
    // Upsert (not UPDATE): most users have no behavior-profile row yet, so an
    // UPDATE would silently no-op and their class would never persist — keeping
    // the tribe empty. ON CONFLICT creates the row with sensible column defaults.
    await db.query(
      `
INSERT INTO user_behavior_profile (username, identity_primary, identity_secondary, identity_traits, identity_computed_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
  identity_primary = EXCLUDED.identity_primary,
  identity_secondary = EXCLUDED.identity_secondary,
  identity_traits = EXCLUDED.identity_traits,
  identity_computed_at = NOW()
`,
      [username, identity.classKeys[0], identity.classKeys[1], JSON.stringify(traitMap)],
    );
  } catch (err) {
    console.warn("[identity] persist skipped:", (err as Error).message);
  }
}

/**
 * Fetch a user's history and compute their spending identity for the given
 * range. Stamps computedAt with the wall clock. The class is persisted only for
 * the canonical 90d window, so the tribe cohort stays stable regardless of which
 * range the user is viewing.
 */
export async function getSpendingIdentity(
  username: string,
  range: IdentityRange = "90d",
): Promise<SpendingIdentity> {
  const [receipts, items] = await Promise.all([
    fetchReceipts(username),
    fetchLineItems(username),
  ]);
  const identity = buildIdentity(receipts, items, Date.now(), rangeToDays(range));
  identity.computedAt = new Date().toISOString();
  if (range === "90d") await persistIdentityClass(username, identity);
  return identity;
}
