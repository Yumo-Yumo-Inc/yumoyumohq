/**
 * User Behavior Analyzer
 *
 * Derives a behavioral profile from a user's receipt history and upserts it
 * into `user_behavior_profile`. This is the data source for personalization:
 * insight ranking, recommendation scoring, and archetype evolution.
 *
 * Principles:
 *   - Pure aggregation over observed data. No cross-user comparison.
 *   - Deterministic: same receipts → same profile.
 *   - Self-healing: re-running updates stale fields and adds new ones.
 */

import { db } from "@/lib/db/client";

export interface UserBehaviorProfileInput {
  username: string;
}

export interface UserBehaviorProfileResult {
  username: string;
  preferredCategories: string[];
  preferredMerchants: string[];
  avgBasketSize: number | null;
  avgReceiptFrequencyDays: number | null;
  shoppingDayOfWeek: number | null; // 0=Sunday
  shoppingTimeOfDay: "morning" | "afternoon" | "evening" | "night" | null;
  priceSensitivityScore: number;
  brandLoyaltyScore: number;
  impulseScore: number;
  healthConsciousScore: number;
  planningScore: number;
  topCategoryPath: string | null;
  topCategoryShare: number | null;
  firstReceiptAt: Date | null;
  lastReceiptAt: Date | null;
  totalReceipts: number;
  totalSpendLifetime: number;
  behaviorArchetype: string | null;
}

interface ReceiptRow {
  receipt_id: string;
  pricing_total_paid: number;
  merchant_name: string;
  created_at: string;
  extraction_time_value: string | null;
}

interface LineItemRow {
  category_path: string | null;
  brand: string | null;
  line_total_gross: number | null;
}

function hourBucket(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mode(values: number[]): number | null {
  if (values.length === 0) return null;
  const freq = new Map<number, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  for (const [val, count] of freq) {
    if (count > bestCount) {
      bestCount = count;
      best = val;
    }
  }
  return best;
}

function dedupeStrings(arr: (string | null)[]): string[] {
  return [...new Set(arr.filter((s): s is string => typeof s === "string" && s.length > 0))];
}

async function fetchUserReceipts(username: string): Promise<ReceiptRow[]> {
  const { rows } = await db.query<ReceiptRow>(
    `
SELECT receipt_id, pricing_total_paid, merchant_name, created_at, extraction_time_value
FROM receipts
WHERE username = $1
  AND status IN ('completed', 'verified', 'scanned')
ORDER BY created_at ASC
`,
    [username]
  );
  return rows;
}

async function fetchUserLineItems(username: string): Promise<LineItemRow[]> {
  const { rows } = await db.query<LineItemRow>(
    `
SELECT rli.category_path, rli.brand, rli.line_total_gross
FROM receipt_line_items rli
JOIN receipts r ON r.receipt_id = rli.receipt_id
WHERE r.username = $1
`,
    [username]
  );
  return rows;
}

function computeArchetype(scores: {
  impulse: number;
  planning: number;
  priceSensitivity: number;
  brandLoyalty: number;
  healthConscious: number;
}): string | null {
  // Simple rule-based archetype assignment.
  // Future: could be a small ML model or clustering.
  if (scores.impulse > 70 && scores.planning < 30) return "impulsive_explorer";
  if (scores.planning > 70 && scores.impulse < 30) return "methodical_planner";
  if (scores.brandLoyalty > 70 && scores.priceSensitivity < 40) return "brand_loyalist";
  if (scores.priceSensitivity > 70 && scores.brandLoyalty < 40) return "price_hunter";
  if (scores.healthConscious > 70) return "health_seeker";
  if (scores.impulse > 60 && scores.planning > 60) return "balanced_adaptive";
  return "casual_shopper";
}

export async function analyzeUserBehavior(
  input: UserBehaviorProfileInput
): Promise<UserBehaviorProfileResult> {
  const { username } = input;

  const receipts = await fetchUserReceipts(username);
  const lineItems = await fetchUserLineItems(username);

  if (receipts.length === 0) {
    return {
      username,
      preferredCategories: [],
      preferredMerchants: [],
      avgBasketSize: null,
      avgReceiptFrequencyDays: null,
      shoppingDayOfWeek: null,
      shoppingTimeOfDay: null,
      priceSensitivityScore: 50,
      brandLoyaltyScore: 50,
      impulseScore: 50,
      healthConsciousScore: 50,
      planningScore: 50,
      topCategoryPath: null,
      topCategoryShare: null,
      firstReceiptAt: null,
      lastReceiptAt: null,
      totalReceipts: 0,
      totalSpendLifetime: 0,
      behaviorArchetype: null,
    };
  }

  // === Basic aggregates ===
  const totals = receipts.map((r) => Number(r.pricing_total_paid) || 0);
  const totalSpend = totals.reduce((a, b) => a + b, 0);
  const avgBasket = totalSpend / receipts.length;

  const firstAt = new Date(receipts[0].created_at);
  const lastAt = new Date(receipts[receipts.length - 1].created_at);
  const spanDays = Math.max(1, (lastAt.getTime() - firstAt.getTime()) / 86400000);
  const avgFrequency = spanDays / receipts.length;

  // === Temporal patterns ===
  const daysOfWeek = receipts
    .map((r) => new Date(r.created_at).getDay())
    .filter((d) => !Number.isNaN(d));
  const shoppingDay = mode(daysOfWeek);

  const hours = receipts
    .map((r) => {
      const t = r.extraction_time_value;
      if (!t) return null;
      const hh = parseInt(t.split(":")[0], 10);
      return Number.isNaN(hh) ? null : hh;
    })
    .filter((h): h is number => h !== null);
  const shoppingTime = hours.length > 0 ? hourBucket(median(hours)) : null;

  // === Category composition ===
  const categorySpend = new Map<string, number>();
  let totalLineSpend = 0;
  for (const item of lineItems) {
    const cat = item.category_path;
    if (!cat) continue;
    const amt = Number(item.line_total_gross) || 0;
    categorySpend.set(cat, (categorySpend.get(cat) ?? 0) + amt);
    totalLineSpend += amt;
  }

  let topCategory: string | null = null;
  let topShare = 0;
  if (totalLineSpend > 0) {
    for (const [cat, spend] of categorySpend) {
      const share = spend / totalLineSpend;
      if (share > topShare) {
        topShare = share;
        topCategory = cat;
      }
    }
  }

  // === Preferred categories & merchants ===
  const sortedCategories = Array.from(categorySpend.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  const merchantFreq = new Map<string, number>();
  for (const r of receipts) {
    const m = r.merchant_name;
    if (!m) continue;
    merchantFreq.set(m, (merchantFreq.get(m) ?? 0) + 1);
  }
  const sortedMerchants = Array.from(merchantFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([m]) => m);

  // === Behavioral scores (0-100) ===

  // Price sensitivity: high basket variance = price sensitive
  const basketVariance =
    totals.length > 1
      ? Math.sqrt(
          totals.reduce((sum, t) => sum + Math.pow(t - avgBasket, 2), 0) / totals.length
        )
      : 0;
  const cv = avgBasket > 0 ? basketVariance / avgBasket : 0;
  // Higher CV → more price sensitive (they hunt for deals, basket swings)
  const priceSensitivityScore = Math.round(Math.min(100, Math.max(0, cv * 200)));

  // Brand loyalty: % of line items with a known brand
  const brandedItems = lineItems.filter((li) => li.brand && li.brand.length > 0).length;
  const brandLoyaltyScore =
    lineItems.length > 0 ? Math.round((brandedItems / lineItems.length) * 100) : 50;

  // Impulse score: high frequency + low basket = more impulsive
  // Also: high wants-category share (approximated by non-grocery categories)
  const groceryLike = new Set(["groceries", "grocery", "gida", "market", "supermarket"]);
  const wantsSpend = Array.from(categorySpend.entries()).reduce((sum, [cat, spend]) => {
    const root = cat.split(".")[0].toLowerCase();
    return groceryLike.has(root) ? sum : sum + spend;
  }, 0);
  const wantsRatio = totalLineSpend > 0 ? wantsSpend / totalLineSpend : 0;
  const freqScore = Math.min(100, (1 / Math.max(avgFrequency, 1)) * 20); // daily = high impulse
  const basketScore = Math.max(0, 100 - avgBasket / 10); // small basket = high impulse
  const impulseScore = Math.round((freqScore * 0.3 + basketScore * 0.3 + wantsRatio * 100 * 0.4));

  // Health conscious: presence of health-related categories
  const healthCats = new Set(["health", "organic", "vegan", "gluten_free", "sugar_free"]);
  const healthSpend = Array.from(categorySpend.entries()).reduce((sum, [cat, spend]) => {
    return healthCats.has(cat.split(".")[0].toLowerCase()) ? sum + spend : sum;
  }, 0);
  const healthRatio = totalLineSpend > 0 ? healthSpend / totalLineSpend : 0;
  const healthConsciousScore = Math.round(Math.min(100, healthRatio * 300 + 10));

  // Planning score: opposite of impulse + consistent frequency
  const planningScore = Math.max(0, Math.min(100, 100 - impulseScore + (avgFrequency < 3 ? 20 : 0)));

  const behaviorArchetype = computeArchetype({
    impulse: impulseScore,
    planning: planningScore,
    priceSensitivity: priceSensitivityScore,
    brandLoyalty: brandLoyaltyScore,
    healthConscious: healthConsciousScore,
  });

  return {
    username,
    preferredCategories: sortedCategories,
    preferredMerchants: sortedMerchants,
    avgBasketSize: Math.round(avgBasket * 100) / 100,
    avgReceiptFrequencyDays: Math.round(avgFrequency * 10) / 10,
    shoppingDayOfWeek: shoppingDay,
    shoppingTimeOfDay: shoppingTime,
    priceSensitivityScore,
    brandLoyaltyScore,
    impulseScore,
    healthConsciousScore,
    planningScore,
    topCategoryPath: topCategory,
    topCategoryShare: totalLineSpend > 0 ? Math.round(topShare * 1000) / 1000 : null,
    firstReceiptAt: firstAt,
    lastReceiptAt: lastAt,
    totalReceipts: receipts.length,
    totalSpendLifetime: Math.round(totalSpend * 100) / 100,
    behaviorArchetype,
  };
}

export async function upsertUserBehaviorProfile(
  result: UserBehaviorProfileResult
): Promise<void> {
  await db.query(
    `
INSERT INTO user_behavior_profile (
  username, preferred_categories, preferred_merchants, avg_basket_size,
  avg_receipt_frequency, shopping_day_of_week, shopping_time_of_day,
  price_sensitivity_score, brand_loyalty_score, impulse_score,
  health_conscious_score, planning_score, top_category_path, top_category_share,
  first_receipt_at, last_receipt_at, total_receipts, total_spend_lifetime,
  behavior_archetype, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
ON CONFLICT (username) DO UPDATE SET
  preferred_categories = EXCLUDED.preferred_categories,
  preferred_merchants = EXCLUDED.preferred_merchants,
  avg_basket_size = EXCLUDED.avg_basket_size,
  avg_receipt_frequency = EXCLUDED.avg_receipt_frequency,
  shopping_day_of_week = EXCLUDED.shopping_day_of_week,
  shopping_time_of_day = EXCLUDED.shopping_time_of_day,
  price_sensitivity_score = EXCLUDED.price_sensitivity_score,
  brand_loyalty_score = EXCLUDED.brand_loyalty_score,
  impulse_score = EXCLUDED.impulse_score,
  health_conscious_score = EXCLUDED.health_conscious_score,
  planning_score = EXCLUDED.planning_score,
  top_category_path = EXCLUDED.top_category_path,
  top_category_share = EXCLUDED.top_category_share,
  first_receipt_at = EXCLUDED.first_receipt_at,
  last_receipt_at = EXCLUDED.last_receipt_at,
  total_receipts = EXCLUDED.total_receipts,
  total_spend_lifetime = EXCLUDED.total_spend_lifetime,
  behavior_archetype = EXCLUDED.behavior_archetype,
  updated_at = NOW()
`,
    [
      result.username,
      result.preferredCategories,
      result.preferredMerchants,
      result.avgBasketSize,
      result.avgReceiptFrequencyDays !== null
        ? `${Math.round(result.avgReceiptFrequencyDays)} days`
        : null,
      result.shoppingDayOfWeek,
      result.shoppingTimeOfDay,
      result.priceSensitivityScore,
      result.brandLoyaltyScore,
      result.impulseScore,
      result.healthConsciousScore,
      result.planningScore,
      result.topCategoryPath,
      result.topCategoryShare,
      result.firstReceiptAt,
      result.lastReceiptAt,
      result.totalReceipts,
      result.totalSpendLifetime,
      result.behaviorArchetype,
    ]
  );
}

/**
 * Convenience: analyze + upsert in one call.
 */
export async function analyzeAndStoreUserBehavior(username: string): Promise<UserBehaviorProfileResult> {
  const result = await analyzeUserBehavior({ username });
  await upsertUserBehaviorProfile(result);
  return result;
}
