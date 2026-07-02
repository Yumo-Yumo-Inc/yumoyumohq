# 03 — Trust Layer

The trust layer is the quality and integrity layer between verified receipts and reward accounting. A receipt that leaves the pipeline first enters one of the public decision bands based on receipt quality, user behavior, and repeated-abuse signals.

The public contract of the layer is which decision categories exist and how they affect the reward ledger. Signal weights, thresholds, decay half-lives, daily ceilings, and the full set of anti-abuse signals are managed in the internal operations layer.

## 3.0 Public Decision Surface

| Output | Meaning |
|---|---|
| Full accept | The receipt enters the reward ledger with the normal coefficient |
| Reduced accept | The receipt is valid, but quality or behavior signals reduce the reward coefficient |
| Review | The receipt or user behavior enters manual decisioning |
| Reject | The receipt enters rejected record state |

This surface gives users understandable feedback while defense parameters stay in the internal operations layer.
