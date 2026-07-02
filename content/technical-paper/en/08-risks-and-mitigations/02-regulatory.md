# Regulatory risk

## 8.2 Surface

Yumo Yumo operates across data product, user contribution, and token economy surfaces, so several regulatory frameworks touch the protocol:

| Framework | Technical surface | Public control principle |
|---|---|---|
| KVKK | User identity, receipt content, and processor inventory in Turkey | Data minimisation and legal-process record |
| GDPR | EU / EEA user data and aggregate data product | User-rights processes and aggregate publication discipline |
| MiCA | INT classification as a crypto-asset in the EU | Regional registration and legal counsel |
| US token classification | INT utility-token design and distribution model | Contribution-linked emission, public vesting, and utility posture |
| Tax classification | User rewards, corporate revenue, VAT / sales tax | Region-specific accounting and reporting process |

These frameworks can assign different compliance duties to the same technical mechanism in different regions. The technical paper defines the architectural surface that can carry those duties.

## 8.3 Control model

**Data minimisation.** Receipt content is held in the off-chain data layer (04 §4.16). The on-chain layer carries bINT mint events, INT settlements, and digest commitments. Integrity proof is produced while user spending history stays out of public chain data.

**Aggregate publication policy.** The B2B data product follows k-anonymity and aggregate publication rules (05 §5.8). Published data produces region / period / category level signals rather than individual receipt exposure.

**Corporate structure.** Yumo Yumo Inc. is a Delaware corporation (00 §0.1). Regional registration, representation, and service-provider relationships proceed with legal counsel and the product rollout plan.

**Token-classification posture.** INT's economic design is built around utility and contribution mechanics: emission is tied to measured contribution (4.3), staking rewards come from public pools (4.6), and BBB is funded by operating revenue (4.9).

## 8.4 Evolution

As progressive localisation advances, compliance responsibilities attach to the authority-migration plan (00 §0.2, 04 §4.10). Corporate structure, data custody, and token-service roles are designed to move across regional structures under the same architecture.
