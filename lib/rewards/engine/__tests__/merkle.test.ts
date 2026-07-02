import { describe, it, expect } from "vitest";
import { hashLeaf, buildTree, getProof, rootFromProof } from "../merkle";

const leaves = [
  { walletAddress: "Wa", intAmount: 100 },
  { walletAddress: "Wb", intAmount: 200 },
  { walletAddress: "Wc", intAmount: 300 },
  { walletAddress: "Wd", intAmount: 400 },
  { walletAddress: "We", intAmount: 500 }, // odd count → carry-up path
];

describe("engine merkle", () => {
  it("produces a stable 32-byte hex root", () => {
    const { root } = buildTree(leaves.map(hashLeaf));
    expect(root).toMatch(/^[0-9a-f]{64}$/);
  });

  it("round-trips every leaf proof back to the root", () => {
    const { root, layers } = buildTree(leaves.map(hashLeaf));
    for (const leaf of leaves) {
      const lh = hashLeaf(leaf);
      const proof = getProof(layers, lh);
      expect(rootFromProof(lh, proof)).toBe(root);
    }
  });

  it("is deterministic regardless of input order", () => {
    const a = buildTree(leaves.map(hashLeaf)).root;
    const b = buildTree([...leaves].reverse().map(hashLeaf)).root;
    expect(a).toBe(b);
  });
});
