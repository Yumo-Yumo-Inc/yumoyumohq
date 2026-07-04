/**
 * Auto-link utility receipts to the bills section.
 *
 * Whatever channel a document arrives from (scan flow or the bills channel),
 * if the pipeline classified it as a paid core utility bill (electricity /
 * water / gas — isCoreUtilityBill), it must appear in the user's bills section:
 *   - match an existing active service provider by name (pg_trgm similarity),
 *     otherwise create one with the category derived from the bill text
 *   - stamp the receipt with matched_service_provider_id and
 *     receipt_kind='digital_bill' so provider bill history picks it up
 *   - refresh the provider's last_paid_at / expected_amount from the bill
 *
 * Decision: memory/decisions/2026-07-04-odeme-kaniti-taban-odul-ve-kalem-tamamlama.md
 */

import { getSql } from "@/lib/db/client";
import { isCoreUtilityBill } from "@/lib/receipt/vision-post-rules";

const PROVIDER_MATCH_MIN_SIMILARITY = 0.4;

/** Derive the service provider category from bill text signals. */
export function utilityCategoryFromText(text: string): "electricity" | "water" | "gas" | "other" {
  if (/ELEKTR[İI]K|ELECTRICITY|\bkWh\b/i.test(text)) return "electricity";
  if (/DO[GĞ]AL\s*GAZ|DO[GĞ]ALGAZ|NATURAL\s*GAS/i.test(text)) return "gas";
  if (/SU\s*(T[ÜU]KET[İI]M|FATURA)|[İI][ÇC]ME\s*SUYU|ATIK\s*SU|WATER\s*(BILL|SUPPLY|USAGE)/i.test(text)) {
    return "water";
  }
  return "other";
}

function paymentDayFromDate(date: string | null): number {
  const match = (date ?? "").match(/^\d{4}-\d{2}-(\d{2})$/);
  if (!match) return 1;
  const day = Number(match[1]);
  return day >= 1 && day <= 31 ? day : 1;
}

/**
 * Fire-and-forget from post-process. Reads the receipt row itself; no-ops for
 * anything that is not a core utility bill or is already provider-linked.
 */
export async function autoLinkUtilityReceipt(receiptId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  try {
    const rows = (await sql`
      SELECT
        username,
        merchant_name,
        document_type,
        vision_markdown,
        pricing_total_paid::float AS total_paid,
        extraction_date_value,
        matched_service_provider_id,
        receipt_kind
      FROM receipts
      WHERE receipt_id = ${receiptId}
      LIMIT 1
    `) as Array<{
      username: string | null;
      merchant_name: string | null;
      document_type: string | null;
      vision_markdown: string | null;
      total_paid: number | null;
      extraction_date_value: string | null;
      matched_service_provider_id: number | null;
      receipt_kind: string | null;
    }>;

    const row = rows[0];
    if (!row?.username) return;
    if ((row.document_type ?? "") !== "utility_bill") return;

    const text = [row.vision_markdown ?? "", row.merchant_name ?? ""].join("\n");
    if (!isCoreUtilityBill(row.vision_markdown, row.merchant_name, null)) return;

    let providerId = row.matched_service_provider_id;

    if (providerId == null) {
      const merchantName = (row.merchant_name ?? "").trim();
      if (!merchantName) return;

      const matches = (await sql`
        SELECT id, similarity(name, ${merchantName}) AS score
        FROM service_providers
        WHERE username = ${row.username}
          AND is_active = TRUE
          AND similarity(name, ${merchantName}) >= ${PROVIDER_MATCH_MIN_SIMILARITY}
        ORDER BY score DESC
        LIMIT 1
      `) as Array<{ id: number; score: number }>;

      if (matches.length > 0) {
        providerId = matches[0].id;
      } else {
        const category = utilityCategoryFromText(text);
        const created = (await sql`
          INSERT INTO service_providers (username, category, name, payment_day)
          VALUES (
            ${row.username},
            ${category},
            ${merchantName.slice(0, 80)},
            ${paymentDayFromDate(row.extraction_date_value)}
          )
          RETURNING id
        `) as Array<{ id: number }>;
        providerId = created[0]?.id ?? null;
        if (providerId != null) {
          console.log(
            `[auto-link] Created service provider #${providerId} (${category}) for ${row.username} from receipt ${receiptId}`
          );
        }
      }
    }

    if (providerId == null) return;

    await sql`
      UPDATE receipts
      SET
        matched_service_provider_id = ${providerId},
        matched_provider_confidence = COALESCE(matched_provider_confidence, 0.9),
        receipt_kind = 'digital_bill',
        updated_at = now()
      WHERE receipt_id = ${receiptId}
    `;

    await sql`
      UPDATE service_providers
      SET
        last_paid_at = COALESCE(${row.extraction_date_value}::date, last_paid_at),
        expected_amount = COALESCE(${row.total_paid}, expected_amount),
        updated_at = now()
      WHERE id = ${providerId}
        AND username = ${row.username}
    `;

    console.log(`[auto-link] Receipt ${receiptId} linked to service provider #${providerId}`);
  } catch (e) {
    console.warn("[auto-link] utility receipt linking failed (non-blocking):", e);
  }
}
