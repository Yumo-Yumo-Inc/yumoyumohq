import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { listReferralsForReferrer } from "@/lib/referral/referral-storage";

export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referrals = await listReferralsForReferrer(username);

    const items = referrals.map((r: any) => ({
      refereeUsername: r.referee_username,
      displayName: r.display_name || r.referee_username,
      avatarUrl: r.avatar_url || null,
      status: r.status,
      verifiedReceipts: r.referee_verified_receipt_count,
      totalEarnedPoints: Math.round(Number(r.total_earned_points ?? 0)),
      lastReceiptAt: r.last_receipt_at ?? null,
      activatedAt: r.activated_at,
      bonusExpiresAt: r.bonus_expires_at,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ referrals: items, total: items.length });
  } catch (err) {
    console.error("[api/referral/list] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
