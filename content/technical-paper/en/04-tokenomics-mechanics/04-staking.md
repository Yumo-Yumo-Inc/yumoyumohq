# Staking mechanics

## 4.6 Staking rail

Staking infrastructure ships with v1 but is **not active at launch**. It activates in a later phase, after the initial price-discovery window completes, so the launch period is not shaped by staking flows. The Vision Paper publishes the staking allocation and the tier table (lock period, weight, indicative APR range). This section describes the mechanism for when it activates.

### Reward model

Staking draws from the Staking Incentives rail (4.17), released over a 5-year horizon. The design fixes the **annual emission pool**, not the APR. The APR a tier yields at any moment is a function of `annual_pool / weighted_staked_supply`: it runs higher while little is staked and normalizes as staked supply grows. This keeps the rail inside its budget regardless of participation, and frames the indicative APRs in the Vision Paper as weights rather than fixed promises.

### Tier structure

A staker chooses a lock period from a fixed set of tiers, each carrying a relative weight. Rewards accrue proportional to that weight. The tier table is part of the published Vision Paper.

### Accrual and claim

Rewards accrue over the lock period and settle through the same epoch and distributor path as user rewards (4.4): the engine computes accrual, the independent verifier checks it (4.17), and the user claims from the distributor. Principal becomes withdrawable after the lock period expires.

### Implementation

Staking uses audited tooling rather than a custom protocol program, consistent with the program model in 4.15. Trustless on-chain staking, when introduced, builds on an audited template.

## 4.7 Launch timing

v1 ships the staking infrastructure dark. It is enabled in a later phase, after the initial price-discovery window. This is published in the Vision Paper.

## 4.8 Operational controls

Reward distributions and tier-table parameter changes are governed under the treasury controls described in 4.9. Changes follow the same multisig + timelock cadence as buy-back-and-burn execution, with announcement preceding the timelock window.
