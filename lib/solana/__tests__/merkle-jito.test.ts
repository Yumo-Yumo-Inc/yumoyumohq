/**
 * Byte-exact validation of the Jito distributor tree builder against two
 * known-good trees produced by the external Jito CLI during the 2026-07 devnet
 * rehearsal (epoch 1: single leaf; airdrop campaign 1: two leaves with proofs).
 *
 * If either root or any proof diverges, the on-chain `new_claim` would reject
 * the proof — so this is the gate that lets us drop the CLI dependency.
 *
 * Run: node --experimental-strip-types --test lib/solana/__tests__/merkle-jito.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PublicKey } from "@solana/web3.js";
import { buildDistributorTree } from "../merkle-jito";

interface Fixture {
  root: number[];
  nodes: { claimant: number[]; unlocked: string; locked: string; proof: string[] }[];
}

// Compact fixtures extracted from outputs/{epoch-1,airdrop-1}-tree.json (CLI output).
const EPOCH1: Fixture = {
  root: [100, 176, 45, 64, 8, 115, 43, 222, 20, 16, 72, 154, 241, 125, 136, 78, 32, 20, 174, 150, 75, 88, 215, 239, 252, 15, 246, 197, 67, 219, 147, 148],
  nodes: [
    { claimant: [68, 63, 239, 61, 0, 202, 129, 36, 204, 237, 149, 27, 49, 200, 229, 245, 69, 17, 216, 176, 206, 129, 151, 173, 133, 133, 168, 24, 37, 198, 149, 149], unlocked: "116640000", locked: "0", proof: [] },
  ],
};

const AIRDROP1: Fixture = {
  root: [236, 77, 233, 13, 40, 81, 250, 0, 37, 129, 132, 252, 51, 151, 20, 228, 181, 0, 186, 86, 18, 29, 240, 122, 112, 250, 159, 78, 152, 124, 135, 83],
  nodes: [
    { claimant: [15, 116, 200, 36, 93, 23, 246, 72, 208, 161, 216, 213, 146, 93, 25, 121, 26, 85, 136, 128, 130, 58, 197, 158, 226, 38, 70, 132, 168, 48, 120, 15], unlocked: "21719146000000", locked: "0", proof: ["2c1d7efdd896f575a5ef609605c2163d0601665ab12843b2e3710ed2fcde6dca"] },
    { claimant: [68, 63, 239, 61, 0, 202, 129, 36, 204, 237, 149, 27, 49, 200, 229, 245, 69, 17, 216, 176, 206, 129, 151, 173, 133, 133, 168, 24, 37, 198, 149, 149], unlocked: "128280853000000", locked: "0", proof: ["b2fc41b3019d8f8d7c0fd1ae5784b06740d9e5ebda259c334929e77246dd60e9"] },
  ],
};

function check(name: string, fx: Fixture): void {
  const tree = buildDistributorTree(
    fx.nodes.map((n) => ({
      claimant: new PublicKey(Uint8Array.from(n.claimant)),
      amountUnlocked: BigInt(n.unlocked),
      amountLocked: BigInt(n.locked),
    })),
  );
  assert.deepEqual(tree.root, fx.root, `${name}: root mismatch`);
  fx.nodes.forEach((n, i) => {
    assert.deepEqual(tree.nodes[i].proof, n.proof, `${name}: proof mismatch at leaf ${i}`);
  });
}

test("distributor tree reproduces the CLI epoch-1 tree (1 leaf)", () => {
  check("epoch-1", EPOCH1);
});

test("distributor tree reproduces the CLI airdrop-1 tree (2 leaves, sorted-pair proofs)", () => {
  check("airdrop-1", AIRDROP1);
});
