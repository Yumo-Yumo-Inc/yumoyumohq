import { describe, it, expect } from "vitest";
import { hashLeaf, buildTree } from "../engine/merkle";
import { leafHashIndependent, rootIndependent } from "../verifier/merkle-independent";

/**
 * Step 7 independence proof: the engine merkle and the verifier's independent
 * merkle must agree on both leaf hashes and the root for the same input. A bug
 * in either path changes the root and the verifier rejects the epoch.
 */
describe("engine vs independent merkle", () => {
  const rows = [
    { walletAddress: "WalletAAA", intAmount: 123.456 },
    { walletAddress: "WalletBBB", intAmount: 1000 },
    { walletAddress: "WalletCCC", intAmount: 0.5 },
    { walletAddress: "WalletDDD", intAmount: 77 },
  ];

  it("agree on per-leaf hash", () => {
    for (const r of rows) {
      expect(hashLeaf(r)).toBe(leafHashIndependent(r.walletAddress, r.intAmount));
    }
  });

  it("agree on the root", () => {
    const engineRoot = buildTree(rows.map(hashLeaf)).root;
    const independentRoot = rootIndependent(rows.map((r) => leafHashIndependent(r.walletAddress, r.intAmount)));
    expect(independentRoot).toBe(engineRoot);
  });

  it("diverge when an amount is tampered (detects a wrong leaf)", () => {
    const engineRoot = buildTree(rows.map(hashLeaf)).root;
    const tampered = rows.map((r, i) => (i === 0 ? { ...r, intAmount: r.intAmount + 1 } : r));
    const tamperedRoot = rootIndependent(tampered.map((r) => leafHashIndependent(r.walletAddress, r.intAmount)));
    expect(tamperedRoot).not.toBe(engineRoot);
  });
});
