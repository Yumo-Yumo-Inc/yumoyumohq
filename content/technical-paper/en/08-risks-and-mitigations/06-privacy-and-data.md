# Privacy and data risk

## 8.14 Surface

Yumo Yumo works with two data classes: user data and aggregate data. User data covers receipt content, spending history, and trust signals. Aggregate data covers price and basket-composition signals that enter the B2B data product.

| Surface | Technical impact | Public control principle |
|---|---|---|
| User-data exposure | Identifiable receipt content is targeted | Off-chain content and encrypted storage |
| Re-identification | Aggregate data can match to an individual receipt or user | k-anonymity and publication-group discipline |
| Legal data request | An authority requests specific user data | Published privacy policy and process record |
| Administrative access | The operations team performs data-processing tasks | Task-scoped access and audit trail |

## 8.15 Control model

**Off-chain receipt content.** Receipt line items live in the off-chain ledger (04 §4.16). The on-chain layer carries bINT mint events and Merkle root commitments; content is processed in the data layer.

**Aggregate publication discipline.** The B2B data product follows k-anonymity and publication-group rules (05 §5.8). Publication groups are formed from region, category, and period cohorts with sufficient density.

**Task-scoped access.** Document-processing workers and administrative tools operate with the data scope needed for the relevant task. Retention, access, and deletion processes connect to the privacy policy and operational security process.

**Audit trail.** Administrative access records are retained for external review and internal-control cycles. Legal data requests are processed under the published privacy policy.

## 8.16 Evolution

Data-custody responsibility evolves with progressive localisation and regional-structure decisions. The architectural target stays stable: user receipt content remains off-chain, aggregate data becomes productised, and integrity proof is provided through on-chain commitment.
