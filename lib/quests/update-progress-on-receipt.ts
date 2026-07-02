/**
 * V2: Updates daily quest progress across ALL tiers when a receipt is saved.
 *
 * TIER 1 (Receipt):
 *   D3/D4   → distinct category count
 *   D5      → total hidden cost (₺)
 *   D6      → whether hidden cost > 0 (0/1)
 *   D7/D8   → distinct store count
 *   D9      → total receipt count
 *   D10     → upload before 10:00 by receipt time (0/1)
 *   D11     → upload between 18:00-23:00 by receipt time (0/1)
 *   D12     → whether a receipt under 50 TL exists (0/1)
 *   D13     → whether a receipt over 500 TL exists (0/1)
 *   D14     → distinct store count (same as D8)
 *   D16     → whether a receipt with VAT exists (0/1)
 *
 * TIER 2 (Discovery):
 *   DD1     → from a merchant with no prior receipts (0/1)
 *   DD2     → receipt from the least-uploaded category (0/1)
 *   DD5     → discounted product (currently = any receipt)
 *   DD8     → breakfast category (0/1)
 *   DD9     → whether the lowest-value receipt was uploaded (always 1)
 *   DD10    → whether a receipt with 10+ items exists (0/1)
 *
 * TIER 3 (Savings): DS1,DS5,DS6,DS7,DS8 — the receipt-trackable ones
 * TIER 4 (Social):  DC4 — trending category, DC5 — benchmark
 */

import { getSql } from "@/lib/db/client";
import { recordUserCheckIn } from "@/lib/streak/record-check-in";
import { autoCompleteEligibleDailyQuests } from "./auto-complete-daily";
import { ensureDailyQuestsForUser } from "./daily-generator";
import { syncWeeklyQuestProgress } from "./weekly-progress";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: any[] }).rows;
  return [];
}

export async function updateDailyQuestProgressOnReceiptSaved(username: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  try {
    await recordUserCheckIn(username, { runQuestSideEffects: true }).catch((err) => {
      console.warn("[quests] recordUserCheckIn on receipt failed:", err);
    });

    const todayStr = new Date().toISOString().slice(0, 10);

    // Ensure quests exist
    const seasonRow = await sql`
      SELECT season_number FROM seasons WHERE status = 'active' ORDER BY start_at DESC LIMIT 1
    `;
    const seasonNumber = (toRows(seasonRow)[0] as any)?.season_number ?? 1;
    await ensureDailyQuestsForUser(username, todayStr, seasonNumber);

    // ── Gather all metrics in parallel ────────────────────
    const [
      categoryRow, merchantRow, hiddenSumRow, hiddenAnyRow, receiptCountRow,
      morningRow, eveningRow, cheapRow, expensiveRow,
      vatRow, lineItemRow,
      newMerchantRow, receiptTotalRow,
    ] = await Promise.all([
      // D3/D4: distinct categories
      sql`SELECT COUNT(DISTINCT LOWER(TRIM(merchant_category)))::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND TRIM(COALESCE(merchant_category,''))!=''`.then(r => toRows(r)[0]),
      // D7/D8/D14: distinct merchants
      sql`SELECT COUNT(DISTINCT LOWER(TRIM(merchant_name)))::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND TRIM(COALESCE(merchant_name,''))!=''`.then(r => toRows(r)[0]),
      // D5: sum hidden cost
      sql`SELECT COALESCE(SUM(hidden_cost_core),0)::float AS total FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date`.then(r => toRows(r)[0]),
      // D6: any hidden cost receipt
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND COALESCE(hidden_cost_core,0)>0`.then(r => toRows(r)[0]),
      // D9: total receipt count
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date`.then(r => toRows(r)[0]),
      // D10: morning receipt (before 10:00 on the receipt)
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND receipt_data->>'time' IS NOT NULL
          AND substring(receipt_data->>'time' from 1 for 2) ~ '^[0-9]+$'
          AND CAST(substring(receipt_data->>'time' from 1 for 2) AS int) < 10`.then(r => toRows(r)[0]),
      // D11: evening receipt (18:00-23:00 on the receipt)
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND receipt_data->>'time' IS NOT NULL
          AND substring(receipt_data->>'time' from 1 for 2) ~ '^[0-9]+$'
          AND CAST(substring(receipt_data->>'time' from 1 for 2) AS int) BETWEEN 18 AND 23`.then(r => toRows(r)[0]),
      // D12: receipt < 50 TL
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND COALESCE(pricing_total_paid,0) < 50 AND COALESCE(pricing_total_paid,0) > 0`.then(r => toRows(r)[0]),
      // D13: receipt > 500 TL
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND COALESCE(pricing_total_paid,0) > 500`.then(r => toRows(r)[0]),
      // D16: VAT receipt
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND COALESCE(pricing_total_paid,0) > 0`.then(r => toRows(r)[0]), // simplified: all receipts have VAT in Turkey
      // DD10: receipt with 10+ line items
      sql`SELECT COUNT(DISTINCT r.id)::int AS cnt FROM receipts r
          WHERE r.username=${username} AND (r.created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND (SELECT COUNT(*) FROM receipt_line_items WHERE receipt_id=r.id) >= 10`.then(r => toRows(r)[0]).catch(() => ({ cnt: 0 })),
      // DD1: new merchant (never uploaded before today)
      sql`SELECT COUNT(*)::int AS cnt FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date
          AND LOWER(TRIM(merchant_name)) NOT IN (
            SELECT DISTINCT LOWER(TRIM(merchant_name)) FROM receipts
            WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date < ${todayStr}::date
            AND TRIM(COALESCE(merchant_name,''))!=''
          )`.then(r => toRows(r)[0]).catch(() => ({ cnt: 0 })),
      // For DS6/DS8: today's total spend
      sql`SELECT COALESCE(SUM(pricing_total_paid),0)::float AS total FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date=${todayStr}::date`.then(r => toRows(r)[0]),
    ]);

    // ── Build progress map ────────────────────────────────
    const categoryCount = Math.min(Number(categoryRow?.cnt ?? 0), 999);
    const merchantCount = Math.min(Number(merchantRow?.cnt ?? 0), 999);
    const hiddenSum     = Math.min(Math.round(Number(hiddenSumRow?.total ?? 0)), 99999);
    const hiddenAny     = Math.min(Number(hiddenAnyRow?.cnt ?? 0), 1);
    const receiptCount  = Math.min(Number(receiptCountRow?.cnt ?? 0), 999);

    const progressMap: Record<string, number> = {
      // Tier 1
      D3: categoryCount, D4: categoryCount,
      D5: hiddenSum, D6: hiddenAny,
      D7: merchantCount, D8: merchantCount, D14: merchantCount,
      D9: receiptCount,
      D10: Math.min(Number(morningRow?.cnt ?? 0), 1),
      D11: Math.min(Number(eveningRow?.cnt ?? 0), 1),
      D12: Math.min(Number(cheapRow?.cnt ?? 0), 1),
      D13: Math.min(Number(expensiveRow?.cnt ?? 0), 1),
      D16: Math.min(Number(vatRow?.cnt ?? 0), 1),
      // Tier 2
      DD1: Math.min(Number(newMerchantRow?.cnt ?? 0), 1),
      DD2: receiptCount > 0 ? 1 : 0, // simplified
      DD3: 0, // requires price comparison feature
      DD4: Math.min(Number(newMerchantRow?.cnt ?? 0), 1), // similar to DD1
      DD5: receiptCount > 0 ? 1 : 0, // simplified
      DD6: 0, // requires price comparison
      DD7: receiptCount > 0 ? 1 : 0, // simplified: any non-chain
      DD8: categoryCount > 0 ? 1 : 0, // simplified
      DD9: receiptCount > 0 ? 1 : 0,
      DD10: Math.min(Number(lineItemRow?.cnt ?? 0), 1),
      // Tier 3 (receipt-trackable)
      DS1: hiddenSum, // compared to dynamic target
      DS5: receiptCount > 0 ? 1 : 0, // simplified
      DS6: Math.round(Number(receiptTotalRow?.total ?? 0)), // today's total spend
      DS7: receiptCount > 0 ? 1 : 0, // simplified
      DS8: Number(receiptTotalRow?.total ?? 0) > 100 && hiddenSum < (Number(receiptTotalRow?.total ?? 0) * 0.05) ? 1 : 0,
      // Tier 4
      DC4: receiptCount > 0 ? 1 : 0, // simplified: uploaded today
      DC5: receiptCount, // benchmark comparison
    };

    // ── Update active quests ──────────────────────────────
    const allTypes = Object.keys(progressMap);
    const questRows = await sql`
      SELECT uq.id, uq.target, uq.season_number, qt.type,
             qt.reward_bint, qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND qt.type = ANY(${allTypes})
        AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
        AND uq.status != 'completed'
    `;
    const quests = toRows(questRows) as {
      id: number; target: number; season_number: number; type: string;
      reward_bint: number; reward_season_xp: number;
    }[];

    for (const q of quests) {
      const rawProgress = progressMap[q.type];
      if (rawProgress === undefined) continue;
      const target = Number(q.target) || 1;
      const progress = Math.min(rawProgress, target);

      await sql`
        UPDATE user_quests SET progress=${progress}, updated_at=now() WHERE id=${q.id}
      `;
    }

    // ── Auto-complete & weekly sync ───────────────────────
    const autoDaily = await autoCompleteEligibleDailyQuests(username, todayStr);
    const autoWeekly = await syncWeeklyQuestProgress(username, todayStr);

    if (quests.length > 0) {
      console.log("[quests] V2 progress update:", {
        username, today: todayStr,
        updatedQuests: quests.length,
        autoDaily, autoWeekly,
      });
    }
  } catch (err) {
    console.warn("[quests] updateDailyQuestProgressOnReceiptSaved failed:", err);
  }
}
