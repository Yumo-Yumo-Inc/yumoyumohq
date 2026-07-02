# Component inventory

## 1.2 Component inventory

This inventory lists protocol component responsibilities and the contracts they expose.

| Component | Responsibility | Public contract |
|---|---|---|
| Client application | Receipt capture, wallet signature, user preview | User signing happens device-side; uploads start from explicit user action |
| API surface | Identity, upload orchestration, pipeline start, status queries | Stable REST/SDK surface; stage statuses and error categories |
| Receipt processing pipeline | Convert image/PDF input into a structured receipt record | Typed intermediate outputs, validation state, canonical product and merchant references |
| Trust layer | Produce reward eligibility from receipt and user signals | Public bands, decision categories, and calibration managed in internal operations |
| Ledger and reward accounting | Hold bINT/ePoints events as an immutable accounting stream | Append-only event model, auditable settlement records |
| Data-product layer | Produce anonymized aggregates from receipt observations | Personal-data separation, k-thresholds, versioned aggregate outputs |
| On-chain programs | Token state, staking, treasury routing, and cryptographic commitments | Auditable program interfaces and published program addresses |
| Operational control plane | Monitoring, quotas, provider routing, incident response | Public status summary; runbooks, thresholds, and routing details remain private |

This separation matters for security: the public document makes the architecture auditable while infrastructure combinations, thresholds, and response steps are managed in internal operations.
