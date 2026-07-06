/**
 * Single source of truth for on-chain addresses and program ids.
 * All values come from env so mainnet/devnet instances can differ per deploy.
 * Empty string means "not provisioned yet" — callers must handle that state
 * (features ship dark until the address exists).
 */

/**
 * Jito merkle-distributor program. Mainnet uses Jito's deployed instance;
 * devnet has no official deployment, so rehearsals deploy a byte-identical
 * dump under their own id and override via env (docs/devnet-rehearsal doc).
 */
export const JITO_DISTRIBUTOR_PROGRAM_ID =
  process.env.NEXT_PUBLIC_DISTRIBUTOR_PROGRAM_ID?.trim() ||
  "mERKcfxMC5SqJn4Ld4BUris3WKZZ1ojjWJ3A3J5CKxv";

/** SPL Memo v2 program. */
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TySNcWxMyWCqXgDLGmfcHr";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export const chainConfig = {
  /** INT mint (SPL Token classic, decimals=6). */
  intMint: () => env("INT_MINT_ADDRESS"),
  /** Proof-of-expense SBT mint (Token-2022 NonTransferable). */
  sbtMint: () => env("SBT_MINT_ADDRESS"),
  /** Jito distributor instance for weekly reward epochs. */
  rewardsDistributor: () => env("REWARDS_DISTRIBUTOR_ADDRESS"),
  /** Separate Jito distributor instance for airdrop campaigns (all unlocked). */
  airdropDistributor: () => env("AIRDROP_DISTRIBUTOR_ADDRESS"),
  /** Squads v4 multisigs, one per role. */
  squads: {
    root: () => env("SQUADS_ROOT_MULTISIG"),
    treasury: () => env("SQUADS_TREASURY_MULTISIG"),
    clawback: () => env("SQUADS_CLAWBACK_MULTISIG"),
  },
} as const;
