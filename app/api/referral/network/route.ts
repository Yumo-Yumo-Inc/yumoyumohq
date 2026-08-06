import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getReferralNetworkForUser } from "@/lib/referral/referral-storage";

/** An invitee is "active" when their last verified receipt is this recent. */
const ACTIVE_WINDOW_DAYS = 14;

/**
 * Referral network view for the "My Network" tab and the rewards summary card:
 * per-invitee stats (join date, receipts, active days, milestones, what they
 * earned me), friend-gated spending-identity class, plus totals and the
 * network origin (who invited me).
 */
export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitees, earnedTotal, origin } = await getReferralNetworkForUser(username);
    const activeCutoff = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const items = invitees.map((r) => {
      const milestones = {
        firstReceipt: !!r.m1_first_receipt_at,
        threeInSevenDays: !!r.m2_three_in_7d_at,
        retained30d: !!r.m3_retained_30d_at,
      };
      return {
        username: r.referee_username,
        displayName: r.display_name || r.referee_username,
        avatarUrl: r.avatar_url || null,
        joinedAt: r.created_at,
        receipts: Number(r.verified_count ?? 0),
        activeDays: Number(r.active_days ?? 0),
        lastReceiptAt: r.last_receipt_at ?? null,
        isActive: !!r.last_receipt_at && new Date(r.last_receipt_at).getTime() >= activeCutoff,
        milestones,
        completed: milestones.firstReceipt && milestones.threeInSevenDays && milestones.retained30d,
        earnedByMe: Math.round(Number(r.earned_by_me ?? 0)),
        isFriend: !!r.is_friend,
        archetype:
          r.is_friend && r.identity_primary
            ? { primary: r.identity_primary, secondary: r.identity_secondary }
            : null,
      };
    });

    return NextResponse.json({
      invitees: items,
      summary: {
        invited: items.length,
        active: items.filter((i) => i.isActive).length,
        completed: items.filter((i) => i.completed).length,
        earnedTotal: Math.round(earnedTotal),
      },
      origin,
    });
  } catch (err) {
    console.error("[api/referral/network] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
