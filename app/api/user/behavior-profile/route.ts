/**
 * GET /api/user/behavior-profile
 *
 * Returns the current user's behavior profile derived from their receipt
 * history. If no profile exists yet, triggers an analysis on demand.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { analyzeAndStoreUserBehavior } from "@/lib/insights/user-behavior-analyzer";

interface ProfileRow {
  username: string;
  preferred_categories: string[] | null;
  preferred_merchants: string[] | null;
  avg_basket_size: number | null;
  avg_receipt_frequency: string | null;
  shopping_day_of_week: number | null;
  shopping_time_of_day: string | null;
  price_sensitivity_score: number;
  brand_loyalty_score: number;
  impulse_score: number;
  health_conscious_score: number;
  planning_score: number;
  top_category_path: string | null;
  top_category_share: number | null;
  first_receipt_at: string | null;
  last_receipt_at: string | null;
  total_receipts: number;
  total_spend_lifetime: number;
  behavior_archetype: string | null;
  updated_at: string;
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Try to fetch existing profile
    const { rows } = await db.query<ProfileRow>(
      `
        SELECT
          username, preferred_categories, preferred_merchants, avg_basket_size,
          avg_receipt_frequency, shopping_day_of_week, shopping_time_of_day,
          price_sensitivity_score, brand_loyalty_score, impulse_score,
          health_conscious_score, planning_score, top_category_path, top_category_share,
          first_receipt_at, last_receipt_at, total_receipts, total_spend_lifetime,
          behavior_archetype, updated_at
        FROM user_behavior_profile
        WHERE username = $1
      `,
      [username]
    );

    // 2. If no profile or stale (> 7 days), analyze on demand
    const existing = rows[0];
    const needsRefresh =
      !existing ||
      new Date(existing.updated_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (needsRefresh) {
      try {
        const fresh = await analyzeAndStoreUserBehavior(username);
        return NextResponse.json({ profile: fresh, refreshed: true });
      } catch (analyzeErr) {
        console.warn("[api/user/behavior-profile] on-demand analyze failed:", analyzeErr);
        // Fall through to return existing if available
      }
    }

    if (!existing) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        username: existing.username,
        preferredCategories: existing.preferred_categories ?? [],
        preferredMerchants: existing.preferred_merchants ?? [],
        avgBasketSize: existing.avg_basket_size,
        avgReceiptFrequencyDays: existing.avg_receipt_frequency
          ? parseFloat(existing.avg_receipt_frequency)
          : null,
        shoppingDayOfWeek: existing.shopping_day_of_week,
        shoppingTimeOfDay: existing.shopping_time_of_day,
        priceSensitivityScore: existing.price_sensitivity_score,
        brandLoyaltyScore: existing.brand_loyalty_score,
        impulseScore: existing.impulse_score,
        healthConsciousScore: existing.health_conscious_score,
        planningScore: existing.planning_score,
        topCategoryPath: existing.top_category_path,
        topCategoryShare: existing.top_category_share,
        firstReceiptAt: existing.first_receipt_at,
        lastReceiptAt: existing.last_receipt_at,
        totalReceipts: existing.total_receipts,
        totalSpendLifetime: existing.total_spend_lifetime,
        behaviorArchetype: existing.behavior_archetype,
        updatedAt: existing.updated_at,
      },
      refreshed: false,
    });
  } catch (error) {
    console.error("[api/user/behavior-profile] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load behavior profile" },
      { status: 500 }
    );
  }
}
