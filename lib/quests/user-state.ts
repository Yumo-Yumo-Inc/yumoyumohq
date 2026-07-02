/**
 * User state for quest generation: 7d avg hidden cost, recent merchants, categories.
 */

import { getSql } from "@/lib/db/client";

const DAYS_7 = 7;
const RECENT_RECEIPTS_N = 50;

export interface UserStateResult {
  user7dAvgHiddenCost: number;
  userRecentMerchants: string[];
  userRecentCategories: string[];
}

export async function getUserState(username: string): Promise<UserStateResult> {
  const sql = getSql();
  if (!sql) {
    return {
      user7dAvgHiddenCost: 0,
      userRecentMerchants: [],
      userRecentCategories: [],
    };
  }

  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - DAYS_7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const [avgRow, recentRows] = await Promise.all([
      sql`
        SELECT COALESCE(AVG(r.hidden_cost_core), 0)::float as avg_hidden
        FROM receipts r
        WHERE r.username = ${username}
          AND (r.status = 'analyzed' OR r.status = 'verified')
          AND r.created_at >= ${cutoffStr}::date
      `.then((r) => (Array.isArray(r) ? r[0] : null)),
      sql`
        SELECT r.merchant_name, r.merchant_category
        FROM receipts r
        WHERE r.username = ${username}
          AND (r.status = 'analyzed' OR r.status = 'verified')
        ORDER BY r.created_at DESC
        LIMIT ${RECENT_RECEIPTS_N}
      `,
    ]);

    const avgHidden = (avgRow as { avg_hidden?: number } | null)?.avg_hidden ?? 0;
    const merchants = new Set<string>();
    const categories = new Set<string>();
    for (const row of (recentRows as { merchant_name?: string; merchant_category?: string }[])) {
      if (row.merchant_name?.trim()) merchants.add(row.merchant_name.trim());
      if (row.merchant_category?.trim()) categories.add(row.merchant_category.trim());
    }

    return {
      user7dAvgHiddenCost: avgHidden,
      userRecentMerchants: Array.from(merchants),
      userRecentCategories: Array.from(categories),
    };
  } catch (err) {
    console.warn("[quests/user-state] getUserState failed:", err);
    return {
      user7dAvgHiddenCost: 0,
      userRecentMerchants: [],
      userRecentCategories: [],
    };
  }
}
