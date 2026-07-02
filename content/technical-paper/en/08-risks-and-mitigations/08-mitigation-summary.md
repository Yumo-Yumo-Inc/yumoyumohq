# Risk classification

## 8.20 Public risk classes

This page classifies the risk section at a glance. The matrix shows the risk class disclosed in the public technical paper, the protocol area affected, and the public control principle.

| Risk class | Affected area | Public control principle | Link |
|---|---|---|---|
| Regulatory data processing | User data, B2B data product | Data minimisation and aggregate publication discipline | §8.2 |
| Regulatory token classification | INT distribution, staking, BBB | Utility and contribution-oriented economic mechanics | §8.2, 04 |
| Market volatility | User rewards, staking, liquidity | Formula-based emission and public vesting | §8.5, 04 |
| Smart-contract security | Token mint/burn, staking, treasury | Versioned deployment, independent review, authority separation | §8.8, 04 |
| Pipeline quality | OCR, LLM, rules layer, canonical record | Schema validation and provider-agnostic adapter | §8.11, 02 |
| Pipeline abuse | Fake, duplicate, or manipulated receipt | Trust-layer feedback and decision state | §8.11, 03 |
| Privacy and aggregate data | Receipt content, user history, B2B data | Off-chain content, k-anonymity, task-scoped access | §8.14, 05 |
| Operational authority | Treasury, program authorities, incident handling | Multi-approval class, auditable trail, staged governance | §8.17, 00 |
| External-service continuity | Document processing, data plane, chain access | Queue state and user-visible processing state | §8.17, 02 |

## 8.21 Publication scope

This classification collects the technical risk surfaces shared in the public document. Alert rules, thresholds, provider ordering, signing arrangement, and incident-response steps are managed in the internal operations layer.

---

## Cross-references

- Operational model evolution → 00 §0.2.
- Pipeline structure → 02 Receipt Pipeline.
- Trust layer detail → 03 Trust Layer.
- Tokenomics mechanics → 04 Tokenomics Mechanics.
- Data layers and B2B product → 05 §5.7, §5.8.
- Glossary entries → 09 Glossary.
