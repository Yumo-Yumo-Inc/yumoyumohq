/**
 * POST /api/receipt/correct
 * User submits the correct value for one receipt field (Faz 3 edit flow).
 * Narrow by design — it cannot touch reward/server-only fields. Reward fields
 * (total/vat) and the +10% bonus are admin-gated; this only queues them.
 */
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { submitCorrection } from "@/lib/receipt/corrections/apply-correction";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { receiptId, field, newValue } = body as {
      receiptId?: string;
      field?: string;
      newValue?: string;
    };

    if (!receiptId || typeof receiptId !== "string" || receiptId.trim() === "") {
      return NextResponse.json({ error: "receiptId is required" }, { status: 400 });
    }
    if (!field || typeof field !== "string") {
      return NextResponse.json({ error: "field is required" }, { status: 400 });
    }
    if (typeof newValue !== "string") {
      return NextResponse.json({ error: "newValue is required" }, { status: 400 });
    }

    const result = await submitCorrection({
      receiptId: receiptId.trim(),
      username,
      field,
      newValue,
    });

    if (!result.ok) {
      const status =
        result.code === "not_found" ? 404 :
        result.code === "duplicate" ? 409 :
        result.code === "db" ? 503 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      id: result.correctionId,
      status: result.status,
      affectsReward: result.affectsReward,
      appliedImmediately: result.appliedImmediately,
    });
  } catch (error: any) {
    console.error("[api/receipt/correct] POST error:", error);
    return NextResponse.json({ error: "Failed to submit correction" }, { status: 500 });
  }
}
