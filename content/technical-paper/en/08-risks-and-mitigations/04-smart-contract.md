# Smart-contract risk

## 8.8 Surface

Smart-contract risk comes from on-chain state transitions such as token mint/burn, staking, treasury routing, vesting, and settlement commitments. Program error, authority misconfiguration, or unexpected network behavior can affect user balances, circulating supply, or treasury state.

## 8.9 Control model

| Risk surface | Public control principle |
|---|---|
| Program error | Independent review, test coverage, versioned deployment |
| Authority concentration | Multi-approval class, delayed execution, authority separation |
| Settlement inconsistency | Off-chain ledger commitments and replayable event model |
| Treasury-driven market impact | Rule-based execution and public trail for completed events |

The on-chain authority model is described in 04 §4.10. The signing tool, signer set, threshold, delay window, emergency order, and response steps are managed in the internal operations layer.

## 8.10 Evolution

The chain runtime is an external settlement layer. Transaction ordering, fee market, compute limit, and network liveness are handled through pre-deployment review, post-deployment monitoring, and versioned update discipline.
