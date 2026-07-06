/**
 * Thin client for the Jito merkle-distributor's `new_claim` instruction.
 *
 * Written from the on-chain interface (Anchor account/arg layout), not from
 * the GPL-licensed jito-foundation/distributor sources (docs/chain-ops.md).
 * The proof served here comes from the ingested distributor tree
 * (scripts/ingest-distributor-tree.ts) — never from our transparency tree.
 */

import { PublicKey, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { sha256 } from "js-sha256";
import { JITO_DISTRIBUTOR_PROGRAM_ID } from "@/config/chain";

export const DISTRIBUTOR_PROGRAM = new PublicKey(JITO_DISTRIBUTOR_PROGRAM_ID);

/** Anchor instruction discriminator: first 8 bytes of sha256("global:<name>"). */
function anchorDiscriminator(name: string): Uint8Array {
  return Uint8Array.from(sha256.array(`global:${name}`)).slice(0, 8);
}

export function deriveClaimStatusPda(claimant: PublicKey, distributor: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ClaimStatus"), claimant.toBytes(), distributor.toBytes()],
    DISTRIBUTOR_PROGRAM,
  )[0];
}

function u64Le(value: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigUint64(0, value, true);
  return buf;
}

export interface NewClaimParams {
  distributor: PublicKey;
  claimant: PublicKey;
  mint: PublicKey;
  amountUnlocked: bigint;
  amountLocked: bigint;
  /** 32-byte hex strings from the ingested Jito tree. */
  proofHex: string[];
}

/** Build the `new_claim` instruction (claimant signs and pays). */
export function buildNewClaimInstruction(params: NewClaimParams): TransactionInstruction {
  const { distributor, claimant, mint, amountUnlocked, amountLocked, proofHex } = params;
  const claimStatus = deriveClaimStatusPda(claimant, distributor);
  const vault = getAssociatedTokenAddressSync(mint, distributor, true);
  const claimantAta = getAssociatedTokenAddressSync(mint, claimant);

  const proofBytes = proofHex.map((h) => {
    const clean = h.replace(/^0x/, "");
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
  });

  // Args: amount_unlocked u64, amount_locked u64, proof Vec<[u8;32]>.
  const data = new Uint8Array(8 + 8 + 8 + 4 + proofBytes.length * 32);
  data.set(anchorDiscriminator("new_claim"), 0);
  data.set(u64Le(amountUnlocked), 8);
  data.set(u64Le(amountLocked), 16);
  new DataView(data.buffer).setUint32(24, proofBytes.length, true);
  proofBytes.forEach((p, i) => data.set(p, 28 + i * 32));

  return new TransactionInstruction({
    programId: DISTRIBUTOR_PROGRAM,
    keys: [
      { pubkey: distributor, isSigner: false, isWritable: true },
      { pubkey: claimStatus, isSigner: false, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: claimantAta, isSigner: false, isWritable: true },
      { pubkey: claimant, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export { ASSOCIATED_TOKEN_PROGRAM_ID };
