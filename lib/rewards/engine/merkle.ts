/**
 * Canonical merkle tree for reward epochs (engine side).
 *
 * Spec (shared with the independent verifier, lib/rewards/verifier):
 *   leaf  = keccak256( utf8(`${walletAddress}|${amountBaseUnits}`) )
 *   node  = keccak256( concat(sort([left, right])) )   // commutative / sorted pair
 *   tree  = leaves sorted ascending by hash; odd node carried up unchanged.
 *
 * The verifier reimplements this spec separately (recursive) so the two paths
 * must agree on the root — a divergence in either is caught (Step 7).
 *
 * Hashes are lowercase hex, no 0x prefix, 32 bytes (64 chars).
 */

import { keccak256 } from "js-sha3";
import { INT_DECIMALS } from "@/config/tokenomics";

export type LeafInput = { walletAddress: string; intAmount: number };

/** INT (whole, possibly fractional after soft-cap) → base-unit string. */
export function toBaseUnits(intAmount: number): string {
  return BigInt(Math.round(intAmount * 10 ** INT_DECIMALS)).toString();
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** keccak256 of a leaf's canonical string. */
export function hashLeaf(input: LeafInput): string {
  return keccak256(`${input.walletAddress}|${toBaseUnits(input.intAmount)}`);
}

/** keccak256 of two child hashes, sorted (commutative). */
export function hashPair(a: string, b: string): string {
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  const buf = new Uint8Array(64);
  buf.set(hexToBytes(lo), 0);
  buf.set(hexToBytes(hi), 32);
  return keccak256(buf);
}

/** Build the tree from leaf hashes; returns root + bottom-up layers (sorted leaves). */
export function buildTree(leafHashes: string[]): { root: string; layers: string[][] } {
  if (leafHashes.length === 0) return { root: "", layers: [[]] };
  const layers: string[][] = [[...leafHashes].sort()];
  while (layers[layers.length - 1].length > 1) {
    const cur = layers[layers.length - 1];
    const next: string[] = [];
    for (let i = 0; i < cur.length; i += 2) {
      next.push(i + 1 < cur.length ? hashPair(cur[i], cur[i + 1]) : cur[i]);
    }
    layers.push(next);
  }
  return { root: layers[layers.length - 1][0], layers };
}

/** Merkle proof (sibling path) for a leaf hash; verify with sorted-pair folding. */
export function getProof(layers: string[][], leafHash: string): string[] {
  let index = layers[0].indexOf(leafHash);
  if (index < 0) throw new Error("leaf not found in tree");
  const proof: string[] = [];
  for (let level = 0; level < layers.length - 1; level++) {
    const cur = layers[level];
    const pairIndex = index ^ 1;
    if (pairIndex < cur.length) proof.push(cur[pairIndex]); // else carried up, no sibling
    index = Math.floor(index / 2);
  }
  return proof;
}

/** Fold a proof back to a root (used in tests / claim verification). */
export function rootFromProof(leafHash: string, proof: string[]): string {
  return proof.reduce((acc, sibling) => hashPair(acc, sibling), leafHash);
}
