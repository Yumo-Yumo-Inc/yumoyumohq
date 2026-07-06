/**
 * Server-side minting of the proof-of-expense SBT (Token-2022 NonTransferable).
 *
 * Infrastructure only for now: no user-facing route calls this yet. Ops can
 * batch-mint via scripts/chain/mint-sbt.ts. Uniqueness (one SBT per account)
 * is enforced off-chain here by checking the holder's ATA balance first
 * (decision 2026-06-28: SBT uniqueness handled off-chain).
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import { chainConfig } from "@/config/chain";

export interface MintSbtResult {
  minted: boolean;
  signature?: string;
  reason?: "already_holds_sbt";
  ata: string;
}

/** Mint one SBT to `wallet` unless it already holds one. */
export async function mintSbtTo(
  connection: Connection,
  authority: Keypair,
  wallet: PublicKey,
): Promise<MintSbtResult> {
  const mintAddress = chainConfig.sbtMint();
  if (!mintAddress) throw new Error("SBT_MINT_ADDRESS is not configured.");
  const mint = new PublicKey(mintAddress);

  const ata = getAssociatedTokenAddressSync(mint, wallet, false, TOKEN_2022_PROGRAM_ID);
  try {
    const account = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    if (account.amount > BigInt(0)) {
      return { minted: false, reason: "already_holds_sbt", ata: ata.toBase58() };
    }
  } catch {
    // ATA does not exist yet — created below.
  }

  const created = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    mint,
    wallet,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  const signature = await mintTo(
    connection,
    authority,
    mint,
    created.address,
    authority,
    BigInt(1),
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  return { minted: true, signature, ata: created.address.toBase58() };
}
