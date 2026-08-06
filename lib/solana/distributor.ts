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
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { sha256 } from "js-sha256";
import { JITO_DISTRIBUTOR_PROGRAM_ID } from "@/config/chain";

const DISTRIBUTOR_PROGRAM = new PublicKey(JITO_DISTRIBUTOR_PROGRAM_ID);

/** Anchor instruction discriminator: first 8 bytes of sha256("global:<name>"). */
function anchorDiscriminator(name: string): Uint8Array {
  return Uint8Array.from(sha256.array(`global:${name}`)).slice(0, 8);
}

function deriveClaimStatusPda(claimant: PublicKey, distributor: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ClaimStatus"), claimant.toBytes(), distributor.toBytes()],
    DISTRIBUTOR_PROGRAM,
  )[0];
}

/** Distributor PDA: seeds ["MerkleDistributor", mint, version_le] (per-version). */
function deriveDistributorPda(mint: PublicKey, version: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("MerkleDistributor"), mint.toBytes(), u64Le(version)],
    DISTRIBUTOR_PROGRAM,
  );
}

function u64Le(value: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigUint64(0, value, true);
  return buf;
}

function i64Le(value: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigInt64(0, value, true);
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
function buildNewClaimInstruction(params: NewClaimParams): TransactionInstruction {
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

/**
 * Full claim instruction set: the distributor program requires the claimant's
 * token account to already exist (AccountNotInitialized otherwise — caught in
 * the devnet rehearsal), so an idempotent ATA-create is prepended. The
 * claimant pays for and signs both.
 */
export function buildClaimInstructions(params: NewClaimParams): TransactionInstruction[] {
  const claimantAta = getAssociatedTokenAddressSync(params.mint, params.claimant);
  return [
    createAssociatedTokenAccountIdempotentInstruction(
      params.claimant,
      claimantAta,
      params.claimant,
      params.mint,
    ),
    buildNewClaimInstruction(params),
  ];
}

interface NewDistributorParams {
  mint: PublicKey;
  admin: PublicKey;
  /** Existing token account of `mint` that clawbacks always return to. */
  clawbackReceiver: PublicKey;
  version: bigint;
  /** 32-byte root (hex, no 0x) from buildDistributorTree(). */
  rootHex: string;
  maxTotalClaim: bigint;
  maxNumNodes: bigint;
  startVestingTs: bigint;
  endVestingTs: bigint;
  clawbackStartTs: bigint;
}

/**
 * Build the `new_distributor` instruction (replaces the Jito CLI's
 * `new-distributor`). The distributor PDA and its vault ATA are created by the
 * program; `admin` signs and pays. Written from the on-chain arg/account layout.
 */
export function buildNewDistributorInstruction(
  params: NewDistributorParams,
): { instruction: TransactionInstruction; distributor: PublicKey; vault: PublicKey } {
  const { mint, admin, clawbackReceiver, version } = params;
  const [distributor] = deriveDistributorPda(mint, version);
  const vault = getAssociatedTokenAddressSync(mint, distributor, true);

  const clean = params.rootHex.replace(/^0x/, "");
  if (clean.length !== 64) throw new Error(`root must be 32 bytes (64 hex chars), got ${clean.length}`);
  const root = new Uint8Array(32);
  for (let i = 0; i < 32; i++) root[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);

  // Args: version u64, root [u8;32], max_total_claim u64, max_num_nodes u64,
  //       start_vesting_ts i64, end_vesting_ts i64, clawback_start_ts i64.
  const data = new Uint8Array(8 + 8 + 32 + 8 + 8 + 8 + 8 + 8);
  let o = 0;
  data.set(anchorDiscriminator("new_distributor"), o); o += 8;
  data.set(u64Le(version), o); o += 8;
  data.set(root, o); o += 32;
  data.set(u64Le(params.maxTotalClaim), o); o += 8;
  data.set(u64Le(params.maxNumNodes), o); o += 8;
  data.set(i64Le(params.startVestingTs), o); o += 8;
  data.set(i64Le(params.endVestingTs), o); o += 8;
  data.set(i64Le(params.clawbackStartTs), o); o += 8;

  const instruction = new TransactionInstruction({
    programId: DISTRIBUTOR_PROGRAM,
    keys: [
      { pubkey: distributor, isSigner: false, isWritable: true },
      { pubkey: clawbackReceiver, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: admin, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
  return { instruction, distributor, vault };
}

;
