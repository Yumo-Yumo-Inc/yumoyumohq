/**
 * Referral milestone processing + notifications.
 * Called from post-process after a receipt is verified, and after email
 * verification. Grants any newly-reached milestones to both sides and writes a
 * notification to each party.
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("referral-activation is a server-only module.");
}

import { getSql } from "@/lib/db/client";
import { grantReferralMilestones, type ReferralMilestoneGrant } from "./referral-bonus";
import type { ReferralMilestone } from "./referral-config";

const MILESTONE_LABEL: Record<ReferralMilestone, string> = {
  first_receipt: "first verified receipt",
  three_in_7d: "3 receipts in the first week",
  retained_30d: "staying active for 30 days",
};

async function notify(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sql: (...args: any[]) => any,
  username: string,
  title: string,
  body: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await sql`
    INSERT INTO user_notifications (username, type, title, body, payload)
    VALUES (
      ${username}, 'referral_milestone', ${title}, ${body}, ${JSON.stringify(payload)}::jsonb
    )
  `.catch(() => {});
}

/**
 * Evaluate + grant the referee's milestone ladder, then notify both parties for
 * each milestone granted by this call.
 *
 * @returns The grants applied by this call (empty if none) — callers can use it
 *   to surface an in-flow "you both earned" message on the result screen.
 */
export async function processReferralMilestones(
  refereeUsername: string,
): Promise<ReferralMilestoneGrant[]> {
  try {
    const grants = await grantReferralMilestones(refereeUsername);
    if (!grants.length) return grants;

    const sql = getSql();
    if (!sql) return grants;

    for (const g of grants) {
      const reason = MILESTONE_LABEL[g.milestone];
      // Referee side
      await notify(
        sql,
        g.refereeUsername,
        "Referral bonus unlocked",
        `You and ${g.referrerUsername} each earned +${g.amount} for your ${reason}.`,
        { milestone: g.milestone, amount: g.amount, role: "referee", counterpart: g.referrerUsername },
      );
      // Referrer side
      await notify(
        sql,
        g.referrerUsername,
        "Referral bonus earned",
        `${g.refereeUsername} reached their ${reason} — you both earned +${g.amount}.`,
        { milestone: g.milestone, amount: g.amount, role: "referrer", counterpart: g.refereeUsername },
      );
    }

    return grants;
  } catch (err) {
    console.warn("[referral-activation] processReferralMilestones failed:", err);
    return [];
  }
}
