/**
 * GET /api/goals/trust
 * Returns the authenticated user's receipt trust score and per-check breakdown.
 *
 * Trust score = user_profiles.honor (0–100), updated by quality-honor-scoring pipeline.
 * Checks = derived from the user's last 5 receipts: has_merchant, has_date, has_time,
 *           has_total, verified_merchant, ocr_quality (proxied from receipt_quality.tier).
 */
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface TrustCheck {
  key: string;
  label: string;
  pass: boolean;
  warn: boolean;
}

export interface TrustResponse {
  score: number;          // 0-100
  tier: string;           // S/A/B/C/D/E/F/G
  checks: TrustCheck[];
  receiptCount: number;   // receipts analysed in last 30 days
  weeklyDelta: number;    // honor change this week
}

export async function GET() {
  // SECURITY: use the app's custom session (cookie-backed, signed) instead of
  // NextAuth's getServerSession. Old NextAuth JWTs (signed before the
  // CredentialsProvider stub was removed) would otherwise still validate
  // against the unchanged NEXTAUTH_SECRET and let an attacker impersonate any
  // username. See the internal security audit (finding C-1).
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Each SQL block is wrapped in its own try/catch so a single missing
  // table/column doesn't take the whole endpoint down with a 500. We log the
  // failed step name + full error (stack included) so Vercel runtime logs
  // pinpoint the failing query.
  const logStep = (step: string, err: unknown) => {
    const e = err as { message?: string; stack?: string; code?: string };
    console.error(`[goals/trust] step=${step} failed:`, {
      message: e?.message,
      code: e?.code,
      stack: e?.stack,
    });
  };

  try {
    // 1. Honor score from user_profiles
    let honor = 50;
    try {
      const profileRows = await sql`
        SELECT COALESCE(honor, 50) AS honor
        FROM user_profiles
        WHERE username = ${username}
        LIMIT 1
      `;
      honor = profileRows.length > 0
        ? Math.max(0, Math.min(100, Number((profileRows[0] as any).honor) || 50))
        : 50;
    } catch (err) {
      logStep("user_profiles", err);
    }

    // 2. Trust tier from user_trust_scores
    let tier = "G";
    try {
      const trustRows = await sql`
        SELECT COALESCE(tier, 'G') AS tier
        FROM user_trust_scores
        WHERE username = ${username}
        LIMIT 1
      `;
      tier = trustRows.length > 0 ? String((trustRows[0] as any).tier ?? "G") : "G";
    } catch (err) {
      logStep("user_trust_scores", err);
    }

    // 3. Last 5 approved receipts — derive per-check signals
    let recentRows: any[] = [];
    try {
      recentRows = (await sql`
        SELECT
          r.merchant_name,
          r.extraction_date_value   AS date,
          r.extraction_time_value   AS time,
          r.pricing_total_paid      AS total_paid,
          r.merchant_place_id,
          rq.tier AS quality_tier
        FROM receipts r
        LEFT JOIN receipt_quality rq ON rq.receipt_id = r.receipt_id
        WHERE r.username = ${username}
          AND r.status IN ('verified', 'analyzed', 'pending')
        ORDER BY r.created_at DESC
        LIMIT 5
      `) as any[];
    } catch (err) {
      logStep("receipts_join_quality", err);
    }

    // Compute check averages across last 5 receipts
    const count = (recentRows as any[]).length;
    let hasMerchant = 0, hasDate = 0, hasTime = 0, hasTotal = 0, hasVerified = 0, hasGoodOcr = 0;

    for (const row of recentRows as any[]) {
      if (row.merchant_name && row.merchant_name.trim() && row.merchant_name !== "Unknown Merchant") hasMerchant++;
      if (row.date) hasDate++;
      if (row.time) hasTime++;
      if ((row.total_paid ?? 0) > 0) hasTotal++;
      if (row.merchant_place_id) hasVerified++;
      // Good OCR proxy: quality_tier is S, A, or B
      if (row.quality_tier && ["S", "A", "B"].includes(row.quality_tier)) hasGoodOcr++;
    }

    const ratio = (n: number) => count > 0 ? n / count : 0;
    const PASS_THRESHOLD = 0.6; // >60% of recent receipts have this signal
    const WARN_THRESHOLD = 0.3;

    const checks: TrustCheck[] = [
      {
        key: "image_quality",
        label: "Net görüntü",
        pass: ratio(hasGoodOcr) >= PASS_THRESHOLD,
        warn: ratio(hasGoodOcr) >= WARN_THRESHOLD && ratio(hasGoodOcr) < PASS_THRESHOLD,
      },
      {
        key: "date_time",
        label: "Tarih & saat",
        pass: ratio(hasDate) >= PASS_THRESHOLD && ratio(hasTime) >= PASS_THRESHOLD,
        warn: ratio(hasDate) >= WARN_THRESHOLD,
      },
      {
        key: "total",
        label: "Toplam tutar",
        pass: ratio(hasTotal) >= PASS_THRESHOLD,
        warn: ratio(hasTotal) >= WARN_THRESHOLD && ratio(hasTotal) < PASS_THRESHOLD,
      },
      {
        key: "merchant",
        label: "İşyeri adı",
        pass: ratio(hasMerchant) >= PASS_THRESHOLD,
        warn: ratio(hasMerchant) >= WARN_THRESHOLD && ratio(hasMerchant) < PASS_THRESHOLD,
      },
      {
        key: "verified_merchant",
        label: "Onaylı işyeri",
        pass: ratio(hasVerified) >= PASS_THRESHOLD,
        warn: ratio(hasVerified) >= WARN_THRESHOLD && ratio(hasVerified) < PASS_THRESHOLD,
      },
      {
        key: "ocr_confidence",
        label: "OCR güveni",
        pass: ratio(hasGoodOcr) >= PASS_THRESHOLD,
        warn: ratio(hasGoodOcr) >= WARN_THRESHOLD && ratio(hasGoodOcr) < PASS_THRESHOLD,
      },
    ];

    // 4. Receipt count last 30 days
    let receiptCount = 0;
    try {
      const countRows = await sql`
        SELECT COUNT(*) AS cnt
        FROM receipts
        WHERE username = ${username}
          AND status IN ('verified', 'analyzed', 'pending')
          AND created_at >= NOW() - INTERVAL '30 days'
      `;
      receiptCount = Number((countRows[0] as any)?.cnt ?? 0);
    } catch (err) {
      logStep("receipts_count_30d", err);
    }

    // 5. Weekly honor delta from history
    let weeklyDelta = 0;
    try {
      const historyRows = await sql`
        SELECT COALESCE(SUM(new_score - previous_score), 0) AS delta
        FROM user_trust_score_history
        WHERE username = ${username}
          AND created_at >= NOW() - INTERVAL '7 days'
      `;
      weeklyDelta = Number((historyRows[0] as any)?.delta ?? 0);
    } catch (err) {
      logStep("user_trust_score_history", err);
    }

    return NextResponse.json({
      score: honor,
      tier,
      checks,
      receiptCount,
      weeklyDelta,
    } satisfies TrustResponse);
  } catch (err) {
    // Outer catch only fires if something outside the wrapped SQL blocks throws
    // (e.g. JSON serialisation, unexpected runtime error).
    const e = err as { message?: string; stack?: string };
    console.error("[goals/trust] Unhandled error:", {
      message: e?.message,
      stack: e?.stack,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
