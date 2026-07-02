# Conversion ratio and circulating supply

## 4.24 bINT → INT conversion ratio

bINT settles to INT at a flat **1:1** ratio. Each unit of contribution carries the same conversion value across the emission horizon, independent of when it was earned.

A flat ratio keeps the conversion value predictable and removes any timing advantage between earlier and later contribution. Because each bINT draws exactly one INT, the User Rewards rail (64.35 billion INT, 4.17) absorbs more contribution before the cap is reached than a higher early ratio would.

Settlement is off-chain (4.4): the engine converts eligible bINT each epoch and the user claims the resulting INT from the audited distributor. When the epoch's total eligible reward exceeds the global emission ceiling, every participant is scaled down by the same pro-rata factor, so the reward rate softens evenly for all rather than cutting off the last contributors. Both the ceiling value and the scaling computation are calibrated in the operations layer and are not published.

## 4.25 Hold window and settlement controls

bINT enters a minimum holding period before it is eligible for settlement. The hold window gives the trust layer (03) time to detect and respond to anomalous patterns before any INT is distributed.

A cumulative ceiling bounds the total INT the contribution layer can ever distribute (the User Rewards rail, 4.17); the independent verifier (4.17) enforces this invariant each epoch. These parameters are managed in the operations layer and are calibrated to balance user experience with protocol safety.

## 4.26 Circulating supply model

Circulating INT grows from three primary inflows: User Rewards settlement, Liquidity unlocks, and periodic Airdrop distributions (4.18). It shrinks through buy-back-and-burn (4.9) and corporate data-access burns.

The table below projects circulating supply under three MAU growth scenarios. These are modeling projections, not commitments.

| Year | Low MAU scenario | Base MAU scenario | High MAU scenario |
|---:|---:|---:|---:|
| TGE | 1,000,000,000 | 1,000,000,000 | 1,000,000,000 |
| 1 | 3,500,000,000 | 5,200,000,000 | 7,400,000,000 |
| 2 | 5,100,000,000 | 8,800,000,000 | 14,000,000,000 |
| 3 | 7,000,000,000 | 13,200,000,000 | 21,500,000,000 |
| 5 | 11,500,000,000 | 22,500,000,000 | 36,000,000,000 |
| 10 | 24,000,000,000 | 42,000,000,000 | 58,000,000,000 |
| 15 | 38,000,000,000 | 60,000,000,000 | 72,000,000,000 |

### Assumptions

- **TGE float** is initial liquidity (1,000,000,000), matching the estimate in 4.21. Airdrop distributions enter circulation later as periodic participation-based events (4.18), not at TGE.
- **Low MAU:** MAU stays in the 0–10K band for the first two years, reaching 100K by year 5.
- **Base MAU:** MAU reaches 100K in year 1, 1M by year 3, 5M by year 5.
- **High MAU:** MAU reaches 1M in year 1 and sustains 5M+ from year 3.
- All scenarios assume the buy-back-and-burn mechanism is active from year 2 onward, removing a percentage of circulating supply annually. The burn rate is a function of data-product revenue and treasury policy.
- Staking is not active at launch (4.6); the model does not count staking locks as a circulation sink during v1.

These projections illustrate the relationship between adoption velocity and supply expansion. Actual circulating supply depends on settlement behavior, burn execution, and user growth patterns that cannot be predicted with certainty.
