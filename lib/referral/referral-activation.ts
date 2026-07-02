/**
 * Referral activation logic.
 * Called from post-process after a receipt is verified.
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("referral-activation is a server-only module.");
}

import { incrementRefereeReceiptCount } from "./referral-storage";

/**
 * After a receipt becomes verified, check whether the referee's referral
 * relationship should be activated (email verified + N verified receipts).
 *
 * @returns Object with `activated` flag and the referrer username (if just activated).
 */
export async function checkAndActivateReferral(
  refereeUsername: string,
): Promise<{ activated: boolean; referrerUsername: string | null }> {
  try {
    const result = await incrementRefereeReceiptCount(refereeUsername);
    if (result.activated && result.relationship) {
      return { activated: true, referrerUsername: result.relationship.referrer_username };
    }
    return { activated: false, referrerUsername: null };
  } catch (err) {
    console.warn("[referral-activation] checkAndActivateReferral failed:", err);
    return { activated: false, referrerUsername: null };
  }
}
