/**
 * Fire-and-forget line-item extraction after sync pipeline completes.
 * Patches receipt_data when done and re-enqueues post-process for positive top-up.
 */

import { getSql } from "@/lib/db/client";
import { isFaz2Enabled } from "@/config/oracle-phases";
import { parseFullReceiptWithGPT } from "@/app/api/receipt/analyze/services/gpt-full-receipt-service";
import type { ReceiptContext } from "@/app/api/receipt/analyze/types";

async function enqueuePostProcessForReceipt(receiptId: string): Promise<void> {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const internalSecret = process.env.INTERNAL_SECRET;
  if (!internalSecret) return;

  const bypassSecret =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET || process.env.VERCEL_PROTECTION_BYPASS;

  await fetch(`${base}/api/internal/post-process?receiptId=${encodeURIComponent(receiptId)}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${internalSecret}`,
      ...(bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {}),
    },
  }).catch(() => undefined);
}

async function patchReceiptWithLineItems(
  receiptId: string,
  gptResult: Awaited<ReturnType<typeof parseFullReceiptWithGPT>>
): Promise<void> {
  if (!gptResult?.lineItems?.length) return;

  const sql = getSql();
  if (!sql) return;

  await sql`
    UPDATE receipts
    SET
      receipt_data = jsonb_set(
        jsonb_set(
          COALESCE(receipt_data, '{}'::jsonb),
          '{geminiLineItems}',
          ${JSON.stringify(gptResult.lineItems)}::jsonb,
          true
        ),
        '{gptFullReceiptResult}',
        ${JSON.stringify(gptResult)}::jsonb,
        true
      ),
      post_process_state = CASE
        WHEN post_process_state IN ('verified', 'rewarded_other', 'processing') THEN 'pending'
        ELSE COALESCE(post_process_state, 'pending')
      END,
      updated_at = now()
    WHERE receipt_id = ${receiptId}
  `;
}

/**
 * Schedule TR line-item GPT extraction without blocking the analyze response.
 */
export function scheduleBackgroundLineItems(context: ReceiptContext): void {
  const ctxAny = context as any;
  const receiptId = context.receiptId?.trim();
  const fullText = context.fullText?.trim() ?? "";
  const country = (
    ctxAny.visionCountryCandidate ||
    context.detectedCountry ||
    context.userCountry ||
    ""
  )
    .toString()
    .toUpperCase()
    .slice(0, 2);

  const hasLineItems =
    Array.isArray(ctxAny.geminiLineItems) && (ctxAny.geminiLineItems as unknown[]).length > 0;

  if (!receiptId || !fullText || country !== "TR" || hasLineItems) return;

  console.log(`[background-line-items] Scheduled for ${receiptId} (non-blocking)`);

  void (async () => {
    try {
      const result = await parseFullReceiptWithGPT(fullText, {
        countryCode: country,
        preferHighAccuracy: true,
      });

      if (!result?.lineItems?.length) {
        console.log(`[background-line-items] No line items for ${receiptId}`);
        return;
      }

      await patchReceiptWithLineItems(receiptId, result);
      console.log(
        `[background-line-items] Patched ${receiptId} with ${result.lineItems.length} line item(s)`
      );

      if (isFaz2Enabled()) {
        await enqueuePostProcessForReceipt(receiptId);
        console.log(`[background-line-items] Re-enqueued post-process for ${receiptId}`);
      }
    } catch (error) {
      console.warn(
        `[background-line-items] Failed for ${receiptId}:`,
        error instanceof Error ? error.message : error
      );
    }
  })();
}
