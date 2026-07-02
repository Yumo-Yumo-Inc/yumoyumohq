# User-reward emission

## 4.3 How rewards flow into bINT

The user-reward pool is governed by the allocation table in 4.17. Inside that pool, daily emission is metered by a curve that takes monthly active usage as its primary input. The curve has three properties worth naming:

- **Stepwise growth toward a peak.** As MAU grows through defined bands, the daily emission pool expands in steps rather than continuously. This avoids cliff effects when activity oscillates near a threshold.
- **Bounded peak.** The daily pool grows stepwise to a peak band, then holds. After peak, additional MAU raises per-user contribution density. The band values are calibrated in production and not published.
- **Long horizon.** The user-reward rail is sized to last a 15-year horizon. The reward share of supply (64.35 billion INT, see 4.17) is the budget; the curve is the meter.

The stepwise function — the MAU bands, the daily-pool values per band, and the transition behaviour — is documented in 4.19. Band boundaries are re-tuned as observed activity evolves.

## 4.4 The bINT → INT conversion lifecycle

bINT accrues off-chain when a receipt clears the trust layer (03). It settles to INT through a periodic (weekly) epoch rather than a per-user on-chain conversion call. The lifecycle:

```
accrue  →  hold  →  settle (epoch)  →  claim  →  INT in user wallet
```

- **Accrue.** Per-receipt, in the off-chain accounting layer. The amount is set by the trust band, the user's daily ceiling, and the current emission step.
- **Hold.** bINT stays in the accounting layer through a minimum holding window before it is eligible for settlement. The window gives the trust layer (03) time to respond to anomalous patterns before any INT is distributed.
- **Settle.** Each epoch, eligible bINT converts to INT at a flat 1:1 ratio (4.24). The engine builds a distribution list, an independent verifier checks it (4.17), and the resulting root is published to the audited distributor.
- **Claim.** The user claims their INT directly from the distributor into a standard SPL wallet, transferable. Treasury holds the INT until claimed; there is no separate vesting step.

When an epoch's total eligible reward exceeds the global emission ceiling, every participant's amount is scaled down by the same factor (soft-cap pro-rata, 4.24). The holding-window length and the global ceiling value are managed in the operations layer and are not published.

## 4.5 Daily ceiling, in tokenomics terms

The effective daily bINT ceiling is the product of a base ceiling, a level multiplier (03 §3.6), and the user's current health (03 §3.5). The current MVP implementation uses per-level tables (4.22); the target architecture uses a formula-based ceiling (4.23). The multiplier and health values are user-specific and live in the trust layer.

This decomposition matters because it lets the protocol re-tune any of the three factors while preserving tokenomics. A market expansion can raise the base; a level system rebalance can shift the multiplier; an abuse wave can compress the health distribution.
