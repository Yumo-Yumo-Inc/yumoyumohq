/**
 * INSERT queries for receipts
 * SERVER-ONLY: Do not import in client components
 */

import { sql, warmUpConnection } from "@/lib/db/client";
import type { ReceiptAnalysis } from "../../types";
import { saveReceipt as saveReceiptFile } from "../../storage";
import { isDatabaseAvailable, withRetry } from "../connection";
import { receiptToDbColumns } from "../mappers/to-db";
import { persistReceiptProofFields } from "../persist-proof-fields";
import { saveBreakdownItems } from "../parallel/breakdown-items";
import { saveFlagsReasons } from "../parallel/flags-reasons";
import { saveOcrLines } from "../parallel/ocr-lines";
import { getReceiptById } from "./select";
import { isFaz2Enabled } from "@/config/oracle-phases";

/** Fire-and-forget trigger for Faz2 post-process worker (Oracle plan). Runs only when ORACLE_FAZ2_ENABLED=true. */
async function runPostProcessInProcess(receiptId: string): Promise<void> {
  try {
    const { runPostProcess } = await import("@/lib/receipt/post-process/run-post-process");
    const result = await runPostProcess(receiptId);
    if (!result.ok) {
      console.warn(
        `[storage-db] in-process post-process failed for ${receiptId}: ${result.error || result.state}`
      );
    } else {
      console.log(`[storage-db] in-process post-process completed for ${receiptId}: ${result.state}`);
    }
  } catch (err: any) {
    console.warn("[storage-db] in-process post-process exception:", err?.message || err);
  }
}

function getVercelProtectionBypassSecret(): string | null {
  return process.env.VERCEL_AUTOMATION_BYPASS_SECRET || process.env.VERCEL_PROTECTION_BYPASS || null;
}

function enqueuePostProcess(receiptId: string): void {
  if (!isFaz2Enabled()) return;

  // Local development: avoid network roundtrip fragility, run worker in-process.
  if (process.env.NODE_ENV === "development") {
    queueMicrotask(() => {
      void runPostProcessInProcess(receiptId);
    });
    return;
  }

  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${base}/api/internal/post-process?receiptId=${encodeURIComponent(receiptId)}`;
  const internalSecret = process.env.INTERNAL_SECRET;
  const bypassSecret = getVercelProtectionBypassSecret();

  if (!internalSecret || (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production" && !bypassSecret)) {
    queueMicrotask(() => {
      void runPostProcessInProcess(receiptId);
    });
    return;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${internalSecret}`,
    ...(bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {}),
  };

  fetch(url, {
    method: "POST",
    cache: "no-store",
    headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText || "request failed"}`.trim());
      }
    })
    .catch((err) => {
      console.warn("[storage-db] enqueuePostProcess failed, falling back to in-process:", err?.message);
      void runPostProcessInProcess(receiptId);
    });
}

/**
 * Insert receipt into database
 * Handles duplicate hash error by returning existing receipt
 */
export async function insertReceipt(
  receipt: ReceiptAnalysis,
  options?: { skipPostProcess?: boolean; deferSecondaryWrites?: boolean }
): Promise<ReceiptAnalysis> {
  if (!isDatabaseAvailable() || !sql) {
    console.log("[storage-db] Database not available, using file storage");
    return saveReceiptFile(receipt);
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    console.log("[storage-db] Saving receipt to database:", {
      receiptId: receipt.receiptId,
      username: receipt.username,
      merchant: receipt.merchant?.name,
      status: receipt.status
    });

    // Map receipt to database columns
    const columns = receiptToDbColumns(receipt);
    if (options?.deferSecondaryWrites) {
      columns.visionJson = null;
    }

    // Insert or update receipt
    const upsertStartedAt = Date.now();
    await dbSql`
      INSERT INTO receipts (
        receipt_id, status, username, merchant_name, merchant_legal_name, merchant_id, merchant_place_id, merchant_category, merchant_country,
        extraction_date_value, extraction_time_value, extraction_date_confidence, extraction_total_value, extraction_total_confidence,
        extraction_vat_value, extraction_vat_confidence, extraction_vat_rate,
        pricing_total_paid, pricing_vat_amount, pricing_paid_ex_tax, pricing_vat_rate,
        pricing_import_system_rate, pricing_retail_hidden_rate, pricing_currency, pricing_symbol,
        hidden_cost_reference_price, hidden_cost_core, hidden_cost_breakdown_import_system, hidden_cost_breakdown_retail_hidden,
        reward_conversion_rate, reward_raw, reward_final, reward_token,
        flags_needs_llm, flags_rejected, flags_gate_confidence, flags_doc_type,
        ocr_raw_text, wallet_address, receipt_data, vision_json, created_at, updated_at,
        proof_type, is_rewarded, reward_tier, risk_score, evidence, source, receipt_hash,
        image_phash, content_hash,
        post_process_state, post_process_retry_count, slot_type, rewarded,
        merchant_address, branch_info, merchant_city, merchant_district, merchant_neighborhood, merchant_street,
        expense_type, vision_markdown,
        card_last4, pos_provider, tax_office, tax_number, payment_method, payment_proven, receipt_no
      ) VALUES (
        ${columns.receiptId}, ${columns.status}, ${columns.username}, ${columns.merchantName}, ${columns.merchantLegalName}, ${columns.merchantId},
        ${columns.merchantPlaceId}, ${columns.merchantCategory}, ${columns.merchantCountry},
        ${columns.extractionDateValue}, ${columns.extractionTimeValue}, ${columns.extractionDateConfidence}, ${columns.extractionTotalValue}, ${columns.extractionTotalConfidence},
        ${columns.extractionVatValue}, ${columns.extractionVatConfidence}, ${columns.extractionVatRate},
        ${columns.pricingTotalPaid}, ${columns.pricingVatAmount}, ${columns.pricingPaidExTax}, ${columns.pricingVatRate},
        ${columns.pricingImportSystemRate}, ${columns.pricingRetailHiddenRate}, ${columns.pricingCurrency}, ${columns.pricingSymbol},
        ${columns.hiddenCostReferencePrice}, ${columns.hiddenCostCore}, ${columns.hiddenCostBreakdownImportSystem}, ${columns.hiddenCostBreakdownRetailHidden},
        ${columns.rewardConversionRate}, ${columns.rewardRaw}, ${columns.rewardFinal}, ${columns.rewardToken},
        ${columns.flagsNeedsLlm}, ${columns.flagsRejected}, ${columns.flagsGateConfidence}, ${columns.flagsDocType},
        ${columns.ocrRawText}, ${columns.walletAddress}, ${columns.receiptData}::jsonb,
        ${columns.visionJson}::jsonb,
        ${columns.createdAt}, ${columns.updatedAt},
        ${columns.proofType}, ${columns.isRewarded}, ${columns.rewardTier}, ${columns.riskScore}, 
        ${columns.evidence}::jsonb, ${columns.source}::jsonb, ${columns.receiptHash},
        ${columns.imagePhash}, ${columns.contentHash},
        ${columns.postProcessState}, ${columns.postProcessRetryCount}, ${columns.slotType}, ${columns.rewarded},
        ${columns.merchantAddress}, ${columns.branchInfo}, ${columns.merchantCity},
        ${columns.merchantDistrict}, ${columns.merchantNeighborhood}, ${columns.merchantStreet},
        ${columns.expenseType}, ${columns.visionMarkdown},
        ${columns.cardLast4}, ${columns.posProvider}, ${columns.taxOffice}, ${columns.taxNumber},
        ${columns.paymentMethod}, ${columns.paymentProven}, ${columns.receiptNo}
      )
      ON CONFLICT (receipt_id)
      DO UPDATE SET
        status = CASE
          WHEN receipts.status IN ('analyzed', 'saved', 'verified', 'rejected', 'pending')
          THEN receipts.status
          ELSE EXCLUDED.status
        END,
        username = EXCLUDED.username,
        merchant_name = EXCLUDED.merchant_name,
        merchant_legal_name = COALESCE(EXCLUDED.merchant_legal_name, receipts.merchant_legal_name),
        merchant_id = EXCLUDED.merchant_id,
        merchant_place_id = EXCLUDED.merchant_place_id,
        merchant_category = EXCLUDED.merchant_category,
        merchant_country = EXCLUDED.merchant_country,
        extraction_date_value = EXCLUDED.extraction_date_value,
        extraction_time_value = EXCLUDED.extraction_time_value,
        extraction_date_confidence = EXCLUDED.extraction_date_confidence,
        extraction_total_value = EXCLUDED.extraction_total_value,
        extraction_total_confidence = EXCLUDED.extraction_total_confidence,
        extraction_vat_value = EXCLUDED.extraction_vat_value,
        extraction_vat_confidence = EXCLUDED.extraction_vat_confidence,
        extraction_vat_rate = EXCLUDED.extraction_vat_rate,
        pricing_total_paid = EXCLUDED.pricing_total_paid,
        pricing_vat_amount = EXCLUDED.pricing_vat_amount,
        pricing_paid_ex_tax = EXCLUDED.pricing_paid_ex_tax,
        pricing_vat_rate = EXCLUDED.pricing_vat_rate,
        pricing_import_system_rate = EXCLUDED.pricing_import_system_rate,
        pricing_retail_hidden_rate = EXCLUDED.pricing_retail_hidden_rate,
        pricing_currency = EXCLUDED.pricing_currency,
        pricing_symbol = EXCLUDED.pricing_symbol,
        hidden_cost_reference_price = EXCLUDED.hidden_cost_reference_price,
        hidden_cost_core = EXCLUDED.hidden_cost_core,
        hidden_cost_breakdown_import_system = EXCLUDED.hidden_cost_breakdown_import_system,
        hidden_cost_breakdown_retail_hidden = EXCLUDED.hidden_cost_breakdown_retail_hidden,
        reward_conversion_rate = EXCLUDED.reward_conversion_rate,
        reward_raw = EXCLUDED.reward_raw,
        reward_final = EXCLUDED.reward_final,
        reward_token = EXCLUDED.reward_token,
        flags_needs_llm = EXCLUDED.flags_needs_llm,
        flags_rejected = EXCLUDED.flags_rejected,
        flags_gate_confidence = EXCLUDED.flags_gate_confidence,
        flags_doc_type = EXCLUDED.flags_doc_type,
        ocr_raw_text = EXCLUDED.ocr_raw_text,
        wallet_address = EXCLUDED.wallet_address,
        -- Keep receipt_data.status in sync with the preserved top-level status column.
        -- Without this, receipt_data gets overwritten with a newer status (e.g. "analyzed")
        -- while the top-level column stays "pending", causing the JS filter in the admin
        -- pending-receipts API to silently discard the row.
        receipt_data = jsonb_set(
          EXCLUDED.receipt_data,
          '{status}',
          to_jsonb(CASE
            WHEN receipts.status IN ('analyzed', 'saved', 'verified', 'rejected', 'pending')
            THEN receipts.status
            ELSE EXCLUDED.status
          END)
        ),
        vision_json = EXCLUDED.vision_json,
        updated_at = EXCLUDED.updated_at,
        proof_type = EXCLUDED.proof_type,
        is_rewarded = EXCLUDED.is_rewarded,
        reward_tier = EXCLUDED.reward_tier,
        risk_score = EXCLUDED.risk_score,
        evidence = EXCLUDED.evidence,
        source = EXCLUDED.source,
        receipt_hash = EXCLUDED.receipt_hash,
        image_phash = EXCLUDED.image_phash,
        content_hash = EXCLUDED.content_hash,
        post_process_state = EXCLUDED.post_process_state,
        post_process_retry_count = EXCLUDED.post_process_retry_count,
        slot_type = EXCLUDED.slot_type,
        rewarded = EXCLUDED.rewarded,
        merchant_address = COALESCE(EXCLUDED.merchant_address, receipts.merchant_address),
        branch_info = COALESCE(EXCLUDED.branch_info, receipts.branch_info),
        merchant_city = COALESCE(EXCLUDED.merchant_city, receipts.merchant_city),
        merchant_district = COALESCE(EXCLUDED.merchant_district, receipts.merchant_district),
        merchant_neighborhood = COALESCE(EXCLUDED.merchant_neighborhood, receipts.merchant_neighborhood),
        merchant_street = COALESCE(EXCLUDED.merchant_street, receipts.merchant_street),
        expense_type = EXCLUDED.expense_type,
        vision_markdown = COALESCE(EXCLUDED.vision_markdown, receipts.vision_markdown),
        card_last4 = COALESCE(EXCLUDED.card_last4, receipts.card_last4),
        pos_provider = COALESCE(EXCLUDED.pos_provider, receipts.pos_provider),
        tax_office = COALESCE(EXCLUDED.tax_office, receipts.tax_office),
        tax_number = COALESCE(EXCLUDED.tax_number, receipts.tax_number),
        payment_method = COALESCE(EXCLUDED.payment_method, receipts.payment_method),
        payment_proven = COALESCE(EXCLUDED.payment_proven, receipts.payment_proven),
        receipt_no = COALESCE(EXCLUDED.receipt_no, receipts.receipt_no)
    `;
    console.log(
      `[storage-db] receipts upsert completed in ${Date.now() - upsertStartedAt}ms for ${receipt.receiptId}`
    );

    try {
      await persistReceiptProofFields(receipt);
    } catch (proofErr: any) {
      console.warn(
        `[storage-db] persistReceiptProofFields failed for ${receipt.receiptId}:`,
        proofErr?.message
      );
    }

    // Save breakdown items, flags reasons, and OCR lines in parallel
    const parallelOps: Promise<any>[] = [];

    if (columns.breakdownItems.length > 0) {
      parallelOps.push(saveBreakdownItems(receipt.receiptId, columns.breakdownItems));
    }

    if (columns.flagsReasons.length > 0) {
      parallelOps.push(saveFlagsReasons(receipt.receiptId, columns.flagsReasons));
    }

    if (columns.ocrLines.length > 0) {
      parallelOps.push(saveOcrLines(receipt.receiptId, columns.ocrLines));
    }

    // Execute all parallel operations
    if (parallelOps.length > 0) {
      const secondaryStartedAt = Date.now();
      if (!options?.deferSecondaryWrites) {
        await Promise.all(parallelOps);
        console.log(
          `[storage-db] secondary table writes completed in ${Date.now() - secondaryStartedAt}ms for ${receipt.receiptId}`
        );
      }
    }

    // Oracle: store Vision JSON for Faz2 post-process; then enqueue worker
    let visionJsonToStore: unknown = receipt.visionRawJson;
    if (visionJsonToStore == null) {
      try {
        const pendingRows = await dbSql`
          SELECT vision_json FROM receipt_vision_pending WHERE receipt_id = ${receipt.receiptId} LIMIT 1
        `;
        if (pendingRows.length > 0 && (pendingRows[0] as { vision_json: unknown }).vision_json != null) {
          visionJsonToStore = (pendingRows[0] as { vision_json: unknown }).vision_json;
        }
      } catch {
        /* receipt_vision_pending may not exist */
      }
    }
    if (visionJsonToStore != null) {
      try {
        const visionStartedAt = Date.now();
        if (!options?.deferSecondaryWrites) {
          await dbSql`
            INSERT INTO receipt_vision_raw (receipt_id, vision_json)
            VALUES (${receipt.receiptId}, ${JSON.stringify(visionJsonToStore)}::jsonb)
            ON CONFLICT (receipt_id) DO UPDATE SET vision_json = EXCLUDED.vision_json
          `;
          try {
            await dbSql`DELETE FROM receipt_vision_pending WHERE receipt_id = ${receipt.receiptId}`;
          } catch {
            /* ignore */
          }
          console.log(
            `[storage-db] vision raw persistence completed in ${Date.now() - visionStartedAt}ms for ${receipt.receiptId}`
          );
        }
      } catch (visionErr: any) {
        console.warn("[storage-db] receipt_vision_raw insert skipped (table may not exist yet):", visionErr?.message);
      }
    }

    // Oracle: enqueue post-process so receipt_line_items / rewards fill (Faz2 worker).
    // Include "scanned": analyze route autoSaveScanned uses that status before the user taps Save.
    if (
      !options?.skipPostProcess &&
      isFaz2Enabled() &&
      (receipt.status === "analyzed" ||
        receipt.status === "verified" ||
        receipt.status === "scanned")
    ) {
      // Guard: don't re-enqueue if post-process is already running or already finished.
      // Without this, the analyze-route flow (which already enqueued via
      // autoSaveScanned + the in-route runPostProcess fire-and-forget) collides
      // with the client's POST /api/receipts (verified) and we end up running
      // the heavy line-item / hidden-cost / TÜİK pipeline 2-3 times per receipt.
      let alreadyHandled = false;
      try {
        const stateRows = await dbSql`
          SELECT post_process_state
          FROM receipts
          WHERE receipt_id = ${receipt.receiptId}
          LIMIT 1
        `;
        const stateRow = stateRows[0] as { post_process_state: string | null } | undefined;
        const state = stateRow?.post_process_state ?? null;
        if (state && state !== "pending" && state !== "failed") {
          // Terminal: 'verified', 'rewarded_other', 'validation_rejected', 'processing'
          alreadyHandled = true;
          console.log(
            `[storage-db] ⏭ Skipping enqueuePostProcess for ${receipt.receiptId}: state=${state}`
          );
        }
      } catch (stateErr: any) {
        // Non-fatal: fall through to enqueue.
        console.warn(
          "[storage-db] post-process state check failed, enqueueing anyway:",
          stateErr?.message
        );
      }
      if (!alreadyHandled) {
        enqueuePostProcess(receipt.receiptId);
      }
    }

    console.log("[storage-db] Receipt saved to database successfully:", receipt.receiptId);
    return receipt;
  } catch (error: any) {
    // Unique-constraint race guard. Two concurrent uploads of the same receipt can
    // both pass the read-then-write duplicate checks; the DB unique indexes are the
    // final authority. Catch both:
    //   - idx_receipts_hash_unique          → exact same file (receipt_hash)
    //   - idx_receipts_content_hash_unique  → same content, different photo (content_hash)
    // In either case the row already exists, so return the existing receipt instead
    // of double-inserting (which would grant a second reward).
    const isFileHashConflict =
      error?.code === '23505' && error?.constraint === 'idx_receipts_hash_unique';
    const isContentHashConflict =
      error?.code === '23505' && error?.constraint === 'idx_receipts_content_hash_unique';

    if (isFileHashConflict || isContentHashConflict) {
      const conflictKind = isContentHashConflict ? 'content' : 'file';
      console.error(`[storage-db] Duplicate receipt detected (${conflictKind} hash race):`, {
        receiptId: receipt.receiptId,
        receiptHash: receipt.receiptHash?.substring(0, 16) + '...',
        contentHash: receipt.contentHash?.substring(0, 16) + '...',
        constraint: error?.constraint,
        message: error.message,
      });

      // Try to find the existing receipt that owns the conflicting hash.
      try {
        const existingReceipt = isContentHashConflict
          ? await dbSql`
              SELECT receipt_id, username, merchant_name, created_at
              FROM receipts
              WHERE content_hash = ${receipt.contentHash}
                AND status IN ('verified', 'saved', 'analyzed')
              LIMIT 1
            `
          : await dbSql`
              SELECT receipt_id, username, merchant_name, created_at
              FROM receipts
              WHERE receipt_hash = ${receipt.receiptHash}
              LIMIT 1
            `;

        if (existingReceipt.length > 0) {
          const existing = existingReceipt[0];
          console.log("[storage-db] ⚠️ Duplicate receipt found:", {
            existingReceiptId: existing.receipt_id,
            existingUsername: existing.username,
            merchantName: existing.merchant_name,
            createdAt: existing.created_at,
            conflictKind,
          });

          // Return the existing receipt instead of throwing error.
          // IMPORTANT: use existing.username (owner of the duplicate), not receipt.username (current uploader).
          // getReceiptById filters by username, so querying with the wrong user returns null.
          const existingReceiptData = await getReceiptById(existing.receipt_id, existing.username, false);
          if (existingReceiptData) {
            return existingReceiptData;
          }
          // Last-resort: try without username filter (admin path)
          const existingReceiptDataNoFilter = await getReceiptById(existing.receipt_id, undefined, false);
          if (existingReceiptDataNoFilter) {
            return existingReceiptDataNoFilter;
          }
          throw new Error(`Duplicate receipt detected but could not retrieve existing receipt.`);
        }
      } catch (lookupError) {
        console.error("[storage-db] Failed to lookup existing receipt:", lookupError);
      }

      throw new Error(`Duplicate receipt detected. This receipt has already been uploaded.`);
    }

    console.error("[storage-db] Failed to save receipt to database:", error);
    throw error;
  }
}

export async function persistReceiptSecondaryArtifacts(receipt: ReceiptAnalysis): Promise<void> {
  if (!isDatabaseAvailable() || !sql) {
    return;
  }

  const dbSql = sql;
  await warmUpConnection();

  const columns = receiptToDbColumns(receipt);
  const parallelOps: Promise<unknown>[] = [];

  if (columns.breakdownItems.length > 0) {
    parallelOps.push(saveBreakdownItems(receipt.receiptId, columns.breakdownItems));
  }

  if (columns.flagsReasons.length > 0) {
    parallelOps.push(saveFlagsReasons(receipt.receiptId, columns.flagsReasons));
  }

  if (columns.ocrLines.length > 0) {
    parallelOps.push(saveOcrLines(receipt.receiptId, columns.ocrLines));
  }

  if (parallelOps.length > 0) {
    const secondaryStartedAt = Date.now();
    await Promise.all(parallelOps);
    console.log(
      `[storage-db] deferred secondary table writes completed in ${Date.now() - secondaryStartedAt}ms for ${receipt.receiptId}`
    );
  }

  let visionJsonToStore: unknown = receipt.visionRawJson;
  if (visionJsonToStore == null) {
    try {
      const pendingRows = await dbSql`
        SELECT vision_json FROM receipt_vision_pending WHERE receipt_id = ${receipt.receiptId} LIMIT 1
      `;
      if (pendingRows.length > 0 && (pendingRows[0] as { vision_json: unknown }).vision_json != null) {
        visionJsonToStore = (pendingRows[0] as { vision_json: unknown }).vision_json;
      }
    } catch {
      /* receipt_vision_pending may not exist */
    }
  }

  if (visionJsonToStore != null) {
    try {
      const visionStartedAt = Date.now();
      await dbSql`
        INSERT INTO receipt_vision_raw (receipt_id, vision_json)
        VALUES (${receipt.receiptId}, ${JSON.stringify(visionJsonToStore)}::jsonb)
        ON CONFLICT (receipt_id) DO UPDATE SET vision_json = EXCLUDED.vision_json
      `;
      try {
        await dbSql`DELETE FROM receipt_vision_pending WHERE receipt_id = ${receipt.receiptId}`;
      } catch {
        /* ignore */
      }
      console.log(
        `[storage-db] deferred vision raw persistence completed in ${Date.now() - visionStartedAt}ms for ${receipt.receiptId}`
      );
    } catch (visionErr: any) {
      console.warn("[storage-db] deferred receipt_vision_raw insert skipped:", visionErr?.message);
    }
  }
}
