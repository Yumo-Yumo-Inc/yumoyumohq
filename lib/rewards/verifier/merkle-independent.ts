/**
 * INDEPENDENT merkle implementation for Step 7.
 *
 * Deliberately does NOT import lib/rewards/engine/merkle — it reimplements the
 * same canonical spec (leaf = keccak256(`${wallet}|${baseUnits}`); node =
 * keccak256(sorted pair); leaves sorted ascending; odd node carried up) with a
 * recursive structure. If the engine and this path disagree on the root, Step 7
 * fails. Duplication here is intentional (security), not an oversight.
 */

import { keccak256 } from "js-sha3";
import { INT_DECIMALS } from "@/config/tokenomics";

function baseUnits(intAmount: number): string {
  return BigInt(Math.round(intAmount * 10 ** INT_DECIMALS)).toString();
}

function bytesOf(hex: string): Uint8Array {
  const a = new Uint8Array(hex.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return a;
}

export function leafHashIndependent(walletAddress: string, intAmount: number): string {
  return keccak256(`${walletAddress}|${baseUnits(intAmount)}`);
}

function pair(a: string, b: string): string {
  const first = a <= b ? a : b;
  const second = a <= b ? b : a;
  const combined = new Uint8Array(64);
  combined.set(bytesOf(first), 0);
  combined.set(bytesOf(second), 32);
  return keccak256(combined);
}

function fold(level: string[]): string {
  if (level.length === 1) return level[0];
  const parents: string[] = [];
  for (let i = 0; i < level.length; i += 2) {
    parents.push(i + 1 < level.length ? pair(level[i], level[i + 1]) : level[i]);
  }
  return fold(parents);
}

/** Root from leaf hashes (sorts internally, recursive fold). */
export function rootIndependent(leafHashes: string[]): string {
  if (leafHashes.length === 0) return "";
  return fold([...leafHashes].sort());
}
