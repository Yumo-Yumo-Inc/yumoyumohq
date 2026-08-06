# Smart-Contract Surface

## 4.15 Program model

v1 runs on audited, widely-used programs rather than custom protocol code. No bespoke on-chain program is deployed for the reward layer; each on-chain function maps to a deployed, externally reviewed program.

| Function | Program | Authority model |
|---|---|---|
| INT issuance and burn | SPL Token | Mint authority closed after genesis; burn under multisig |
| Reward distribution and claim | Audited merkle distributor | Per-epoch root; root-set authority is multisig |
| Treasury and authorities | Squads multisig | Separated root / treasury / clawback approvals |
| Proof-of-expense SBT | Token-2022 (NonTransferable) | Backend mint, one per wallet |
| Transparency commitments | Memo program | Epoch root and dataset hash written on-chain |

bINT is an off-chain accounting unit. It is not an on-chain token; its balances live in the operations layer. INT claims derived from eligible bINT balances settle through the distributor.

## 4.16 What goes on-chain

The on-chain layer carries INT token events, the per-epoch distribution root, treasury authority changes, and transparency commitments. The off-chain layer carries the reward engine (contribution → amount → root), receipt content, trust signals, and behavior history.

The published reward dataset is written to permanent storage; its hash and the epoch root are committed on-chain. External parties can recompute their own balance from the published data and check it against the on-chain root, while receipt content stays in the off-chain data layer.

## 4.17 Settlement integrity

Before a distribution root is signed, an independent verifier recomputes it from the same source ledger and checks the cumulative allocation invariants (4.18). A root that does not match the recomputation, or that would breach an allocation ceiling, does not proceed to signing. Root signing and treasury movements require multi-approval through the Squads multisig.

This separation keeps reward computation, independent verification, and fund movement in distinct hands: a single compromised server cannot move funds on its own.

## 4.18 Audit posture

The on-chain surface relies on third-party open-source programs; the versions, program addresses, and relevant audit links are published. Review scope, report links, and a security-reporting channel for the off-chain reward engine and verifier must be published before launch.
