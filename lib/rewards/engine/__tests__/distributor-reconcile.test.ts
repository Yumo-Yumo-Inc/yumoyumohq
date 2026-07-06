import { describe, it, expect } from "vitest";
import { Keypair } from "@solana/web3.js";
import { parseTreeNodes, treeRootHex } from "../../../../scripts/ingest-distributor-tree";
import { intAmountToBaseUnits, sumBaseUnits } from "@/lib/solana/amounts";
import { toBaseUnits } from "../merkle";

const walletA = Keypair.generate().publicKey;
const walletB = Keypair.generate().publicKey;

describe("Jito tree parsing (ingest-distributor-tree)", () => {
  it("parses flat amount fields with base58 claimants and hex proofs", () => {
    const tree = {
      merkle_root: "AB".repeat(32),
      tree_nodes: [
        {
          claimant: walletA.toBase58(),
          amount_unlocked: "1500000",
          amount_locked: "0",
          proof: ["cd".repeat(32)],
        },
      ],
    };
    const nodes = parseTreeNodes(tree);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].claimant).toBe(walletA.toBase58());
    expect(nodes[0].amountUnlocked).toBe(1_500_000n);
    expect(nodes[0].amountLocked).toBe(0n);
    expect(nodes[0].proof).toEqual(["cd".repeat(32)]);
    expect(treeRootHex(tree)).toBe("ab".repeat(32));
  });

  it("parses byte-array claimants/roots and category-split amounts", () => {
    const tree = {
      merkle_root: Array.from({ length: 32 }, (_, i) => i),
      tree_nodes: [
        {
          claimant: Array.from(walletB.toBytes()),
          total_unlocked_staker: "1000000",
          total_unlocked_searcher: "500000",
          total_unlocked_validator: 0,
          total_locked_staker: "0",
          proof: [Array.from({ length: 32 }, () => 255)],
        },
      ],
    };
    const nodes = parseTreeNodes(tree);
    expect(nodes[0].claimant).toBe(walletB.toBase58());
    expect(nodes[0].amountUnlocked).toBe(1_500_000n);
    expect(nodes[0].proof).toEqual(["ff".repeat(32)]);
    expect(treeRootHex(tree)).toBe(
      Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, "0")).join(""),
    );
  });

  it("rejects a tree without nodes", () => {
    expect(() => parseTreeNodes({ merkle_root: "00".repeat(32), tree_nodes: [] })).toThrow();
  });
});

describe("base-unit reconciliation (CSV export ↔ engine leaves)", () => {
  it("intAmountToBaseUnits matches the engine's toBaseUnits per leaf", () => {
    for (const amount of ["0", "1", "12.5", "0.000001", "1234567.891234"]) {
      expect(intAmountToBaseUnits(amount).toString()).toBe(toBaseUnits(Number(amount)));
    }
  });

  it("sums totals beyond Number-safe range without loss", () => {
    // 99B INT in base units = 9.9e16 > Number.MAX_SAFE_INTEGER (9.007e15).
    const chunk = intAmountToBaseUnits("33000000000"); // 33B INT
    const total = sumBaseUnits([chunk, chunk, chunk]);
    expect(total.toString()).toBe("99000000000000000");
  });
});
