/**
 * Consumer premium entitlement (stub — launch-disabled).
 *
 * Premium is an off-chain, non-transferable, fiat entitlement (karar §11.4):
 * NOT an NFT, NOT an INT sink. It gates the smart-agent chat only; every other
 * section is reachable on the free path. Premium is an accelerator, never an
 * earning multiplier — booster/level math stays off-chain in the reward engine.
 *
 * v1 ships dark (FLAGS.premium=false). The real flow (payment provider + smart
 * agent gate) is added at launch. For now this is just the check shape.
 */

import { FLAGS } from "@/config/feature-flags";

/** True only when the feature is live AND the user holds an unexpired premium entitlement. */
export function isPremium(userType: string | null | undefined, expiresAt?: Date | string | null): boolean {
  if (!FLAGS.premium) return false;
  if (userType !== "premium") return false;
  if (expiresAt == null) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

/** Smart-agent chat is the only premium-exclusive surface (karar §11.4). */
export function canUseSmartAgent(userType: string | null | undefined, expiresAt?: Date | string | null): boolean {
  return isPremium(userType, expiresAt);
}
