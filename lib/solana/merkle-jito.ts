/**
 * Jito merkle-distributor tree builder (replaces the external Jito CLI's
 * `create-merkle-tree` step).
 *
 * Implemented from the on-chain verification interface — the distributor's
 * `new_claim` recomputes the root from the leaf and proof, so the tree we build
 * here must hash bytes exactly as that program does or every proof is rejected.
 * The construction is the standard SHA-256 sorted-pair Merkle tree with domain
 * separation:
 *
 *   nodeData = sha256( claimant(32) || u64le(amountUnlocked) || u64le(amountLocked) )
 *   leaf     = sha256( 0x00 || nodeData )
 *   parent   = sha256( 0x01 || min(l,r) || max(l,r) )      // sorted pair
 *   odd node at a level is paired with itself.
 *
 * The `sorted-pair` and `duplicate-last` choices were pinned empirically against
 * two known-good CLI-produced trees (see __tests__/merkle-jito.test.ts): the
 * unsorted variant produces a different root, so it is not a free choice.
 *
 * This is a clean-room reimplementation of a standard algorithm from the
 * program's byte interface, not a port of the GPL-licensed jito sources
 * (cf. docs/chain-ops.md, lib/solana/distributor.ts).
 */

import { createHash } from "crypto";
import { PublicKey } from "@solana/web3.js";

const LEAF_PREFIX = Buffer.from([0]);
const INTERMEDIATE_PREFIX = Buffer.from([1]);

function sha256(...parts: Buffer[]): Buffer {
  const h = createHash("sha256");
  for (const p of parts) h.update(p);
  return h.digest();
}

function u64le(value: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(value);
  return b;
}

export interface DistributorLeafInput {
  claimant: PublicKey | string;
  amountUnlocked: bigint;
  amountLocked: bigint;
}

interface DistributorTreeNode {
  claimant: string;
  amountUnlocked: bigint;
  amountLocked: bigint;
  /** 32-byte hex sibling hashes, root-ward order. */
  proof: string[];
  index: number;
}

export interface DistributorTree {
  rootHex: string;
  root: number[];
  maxNumNodes: number;
  maxTotalClaim: bigint;
  nodes: DistributorTreeNode[];
}

function leafDataHash(claimant: PublicKey, amountUnlocked: bigint, amountLocked: bigint): Buffer {
  return sha256(Buffer.from(claimant.toBytes()), u64le(amountUnlocked), u64le(amountLocked));
}

function hashLeaf(nodeData: Buffer): Buffer {
  return sha256(LEAF_PREFIX, nodeData);
}

function hashPair(a: Buffer, b: Buffer): Buffer {
  // Sorted pair: smaller hash on the left (matches the on-chain proof folding).
  return Buffer.compare(a, b) <= 0
    ? sha256(INTERMEDIATE_PREFIX, a, b)
    : sha256(INTERMEDIATE_PREFIX, b, a);
}

/**
 * Build the full distributor tree: root, and a per-leaf proof. Leaf order is
 * the input order (callers must feed leaves in a deterministic order, e.g. the
 * DB's leaf_index ASC, so the tree is reproducible).
 */
export function buildDistributorTree(leaves: DistributorLeafInput[]): DistributorTree {
  if (leaves.length === 0) throw new Error("Cannot build a distributor tree with no leaves.");

  const claimants = leaves.map((l) =>
    typeof l.claimant === "string" ? new PublicKey(l.claimant) : l.claimant,
  );
  const leafHashes = leaves.map((l, i) => hashLeaf(leafDataHash(claimants[i], l.amountUnlocked, l.amountLocked)));

  // Bottom-up build; carry each original leaf's collected sibling hashes.
  const proofs: Buffer[][] = leaves.map(() => []);
  let level = leafHashes.slice();
  // groups[i] = original leaf indices flowing through node i at the current level.
  let groups: number[][] = leaves.map((_, i) => [i]);

  while (level.length > 1) {
    const next: Buffer[] = [];
    const nextGroups: number[][] = [];
    for (let i = 0; i < level.length; i += 2) {
      const l = level[i];
      const hasRight = i + 1 < level.length;
      const r = hasRight ? level[i + 1] : level[i]; // duplicate last if odd
      const lGroup = groups[i];
      const rGroup = hasRight ? groups[i + 1] : groups[i];

      for (const oi of lGroup) proofs[oi].push(r);
      if (hasRight) for (const oi of rGroup) proofs[oi].push(l);

      next.push(hashPair(l, r));
      nextGroups.push(hasRight ? [...lGroup, ...rGroup] : [...lGroup]);
    }
    level = next;
    groups = nextGroups;
  }

  const root = level[0];
  const maxTotalClaim = leaves.reduce((acc, l) => acc + l.amountUnlocked + l.amountLocked, BigInt(0));

  return {
    rootHex: root.toString("hex"),
    root: Array.from(root),
    maxNumNodes: leaves.length,
    maxTotalClaim,
    nodes: leaves.map((l, i) => ({
      claimant: claimants[i].toBase58(),
      amountUnlocked: l.amountUnlocked,
      amountLocked: l.amountLocked,
      proof: proofs[i].map((h) => h.toString("hex")),
      index: i,
    })),
  };
}

/**
 * Serialize to the Jito CLI tree JSON shape so scripts/ingest-distributor-tree.ts
 * consumes it unchanged (claimant as 32-byte array, proof as 32-byte arrays,
 * amounts under the *_staker keys the ingester already sums).
 */
export function toTreeJson(tree: DistributorTree): Record<string, unknown> {
  const hexToBytes = (h: string): number[] => {
    const out: number[] = [];
    for (let i = 0; i < h.length; i += 2) out.push(parseInt(h.slice(i, i + 2), 16));
    return out;
  };
  // Amounts as strings: base units can exceed 2^53, and the ingester reads them
  // via BigInt(String(v)). The root/proof math above is already exact (BigInt),
  // so this only keeps the cross-check JSON lossless.
  return {
    merkle_root: tree.root,
    max_num_nodes: tree.maxNumNodes,
    max_total_claim: tree.maxTotalClaim.toString(),
    tree_nodes: tree.nodes.map((n) => ({
      claimant: Array.from(new PublicKey(n.claimant).toBytes()),
      proof: n.proof.map(hexToBytes),
      total_unlocked_staker: n.amountUnlocked.toString(),
      total_locked_staker: n.amountLocked.toString(),
      total_unlocked_searcher: 0,
      total_locked_searcher: 0,
      total_unlocked_validator: 0,
      total_locked_validator: 0,
    })),
  };
}
