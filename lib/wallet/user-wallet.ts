/**
 * Account-level reward wallet storage. SERVER-ONLY.
 *
 * The reward wallet is a property of the user account (users.wallet_address),
 * set once via /api/wallet/link. Receipts and reward epochs read it, so uploads
 * no longer depend on a live wallet connection in the current browser tab.
 */

import { getSql, warmUpConnection } from "@/lib/db/client";

export interface UserWallet {
  walletAddress: string | null;
  walletVerified: boolean;
  walletLinkedAt: string | null;
}

/** Read the account wallet for a user. Null-safe; returns empty state on error. */
export async function getUserWallet(username: string): Promise<UserWallet> {
  const empty: UserWallet = { walletAddress: null, walletVerified: false, walletLinkedAt: null };
  const sql = getSql();
  if (!sql) return empty;
  try {
    await warmUpConnection();
    const rows = await sql`
      SELECT wallet_address, wallet_verified, wallet_linked_at
      FROM users WHERE username = ${username} LIMIT 1
    `;
    const r = (rows as any[])[0];
    if (!r) return empty;
    return {
      walletAddress: r.wallet_address ?? null,
      walletVerified: Boolean(r.wallet_verified),
      walletLinkedAt: r.wallet_linked_at ? new Date(r.wallet_linked_at).toISOString() : null,
    };
  } catch {
    return empty;
  }
}

/** Just the address, or null. Convenience for the receipt-save/epoch fallback. */
export async function getUserWalletAddress(username: string): Promise<string | null> {
  return (await getUserWallet(username)).walletAddress;
}

/**
 * Store the account wallet. `verified` reflects whether an ownership signature
 * was checked. A verified link is never silently downgraded to unverified by a
 * later paste of the same address.
 */
export async function setUserWallet(
  username: string,
  walletAddress: string,
  verified: boolean
): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await warmUpConnection();
    await sql`
      UPDATE users
      SET wallet_address = ${walletAddress},
          wallet_verified = CASE
            WHEN ${verified} THEN true
            WHEN users.wallet_address = ${walletAddress} THEN users.wallet_verified
            ELSE false
          END,
          wallet_linked_at = now()
      WHERE username = ${username}
    `;
    return true;
  } catch {
    return false;
  }
}
