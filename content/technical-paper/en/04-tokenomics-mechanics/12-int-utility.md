# INT utility

## 4.27 Utility surface

INT carries six functions inside the Yumo Yumo protocol. The reward function has its settlement and claim infrastructure built with activation pending; the others are planned and activate as the protocol surface matures.

| Function | Status | Description |
|---|---|---|
| **Reward asset** | Infrastructure complete, activation pending | Verified contributions currently accrue in the bINT accounting layer (4.14). The settlement and claim path for the bINT → INT conversion lifecycle (4.4) is built; on-chain INT distribution activates with the Token Generation Event |
| **Staking asset** | Planned | If staking is enabled, holders may lock INT into tier-weighted staking pools (4.6) |
| **Buy-back-and-burn** | If policy is enabled | The treasury may buy and burn INT under a published policy (4.9) |
| **Data report burn** | Planned | Businesses accessing aggregated community data reports must burn a designated amount of INT per report (4.30) |
| **Governance signal** | Planned | INT-weighted signaling for decisions over data-product priorities, treasury allocations, and ecosystem grants |
| **Bonded API access** | Planned | API consumers of the anonymized data product may be required to bond INT against their access keys |

## 4.28 Treasury revenue policy

INT does not promise yield, appreciation, or price support. If revenue arises from a data product or another activity, allocating it to the treasury, operations, staking incentives, or buy-back-and-burn can occur only under a published policy and after the required legal review.

Any revenue allocation or staking incentive is published with its amount, period, authorised decision-maker, and on-chain record. This section does not commit to future revenue, burns, or staking payments.

## 4.29 Potential revenue sources

Potential sources of revenue subject to treasury policy include:

- **Anonymized data sales.** k-anonymized, aggregated receipt-level data sold to FMCG brands, retailers, research firms, and developers through tiered API access.
- **Affiliate and referral revenue.** Price-comparison click-throughs to retailer or coupon partners (planned).
- **Premium subscription.** Advanced personal analytics and goal automation features (planned).

Revenue generation details and anonymization architecture are described in 05 Data Schema and API.

## 4.30 Data report burn

The planned data-report access model may require INT to be burned for specified report types. If this model is enabled, the burn is recorded on-chain and its report type and amount are published.

A burn reduces circulating INT; it does not guarantee an outcome for token price, value, or demand. A burn amount per report takes effect only once the applicable treasury policy and product pricing are published.
