# Risk model

This section defines the risk classes disclosed in Yumo Yumo's public technical paper, the protocol surface each class touches, and the public control principle attached to it. The aim is to show the technical reader where the risk appears in the system design and where the relevant mechanism is specified.

Internal runbooks, alert logic, signer arrangement, provider ordering, thresholds, and incident-response steps remain in the operations layer. The public text gives the architectural posture, the data-minimisation principle, authority separation, and the user-visible state model.

## 8.0 Risk classes

| Class | Protocol surface | Public control principle |
|---|---|---|
| Regulatory | Data processing, token classification, tax, and regional registration | Data minimisation, aggregate publication policy, jurisdiction-specific legal process |
| Token and market | Emission, vesting, staking, BBB, and secondary-market liquidity | Formula-based supply flow, public vesting, revenue-linked burn |
| Smart contract | Program authorities, token mint/burn, staking, and treasury movement | Versioned deployment, independent review, authority separation |
| Product and pipeline | Document reading, structured extraction, rules layer, and record write | Schema validation, provider-agnostic adapters, state visibility |
| Privacy and data | Receipt content, user history, aggregate data product | Off-chain content, k-anonymity, task-scoped access |
| Operational | Authority custody, external-service continuity, network liveness, and incident handling | Multi-approval class, auditable trail, staged governance |

§8.2-§8.19 describe each risk class through technical impact and public control model. §8.20-§8.21 summarises those classes in one table. Control principles belong in the technical paper; implementation details live in security operations documentation.

---

## Cross-references

- Operational model and progressive localisation → 00 §0.2.
- Pipeline state model → 02 §2.9.
- Trust layer signal set → 03 Trust Layer.
- Treasury governance and authority migration → 04 §4.10.
- Data-product privacy model → 05 §5.8.
- Glossary entries: MiCA, k-anonymity, health score → 09 Glossary.
