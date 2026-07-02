/**
 * Faz 3: User confirm merchant – add OCR name as pattern for a canonical merchant.
 * POST body: { receiptId?: string, merchantId: string, ocrMerchantName?: string }
 * If receiptId is provided, receipt's merchant_name is used as pattern and receipt.merchant_id is updated.
 * Otherwise ocrMerchantName is required.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getReceiptById } from "@/lib/receipt/db/queries/select";
import { addMerchantPattern } from "@/lib/receipt/merchant-matching";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { receiptId?: string; merchantId?: string; ocrMerchantName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { receiptId, merchantId, ocrMerchantName } = body;
  if (!merchantId || typeof merchantId !== "string" || !merchantId.trim()) {
    return NextResponse.json(
      { error: "merchantId is required" },
      { status: 400 }
    );
  }

  let patternName: string;
  if (receiptId) {
    const receipt = await getReceiptById(receiptId.trim(), username, false);
    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found or access denied" },
        { status: 404 }
      );
    }
    patternName =
      receipt.merchant?.name ||
      (receipt as any).receiptData?.merchant?.name ||
      "";
    if (!patternName.trim()) {
      return NextResponse.json(
        { error: "Receipt has no merchant name to use as pattern" },
        { status: 400 }
      );
    }
  } else {
    if (!ocrMerchantName || typeof ocrMerchantName !== "string") {
      return NextResponse.json(
        { error: "ocrMerchantName is required when receiptId is not provided" },
        { status: 400 }
      );
    }
    patternName = ocrMerchantName.trim();
  }

  try {
    const { added } = await addMerchantPattern(merchantId.trim(), patternName);
    if (receiptId) {
      await db.query(
        "UPDATE receipts SET merchant_id = $1, updated_at = CURRENT_TIMESTAMP WHERE receipt_id = $2 AND username = $3",
        [merchantId.trim(), receiptId.trim(), username]
      );
    }
    return NextResponse.json({
      success: true,
      added,
      receiptUpdated: !!receiptId,
    });
  } catch (e) {
    console.error("[confirm-merchant]", e);
    return NextResponse.json(
      { error: "Failed to add pattern or update receipt" },
      { status: 500 }
    );
  }
}
