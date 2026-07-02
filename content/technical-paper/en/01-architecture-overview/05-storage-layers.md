# Storage layers

## 1.4 Storage layers

The storage model separates data by purpose and privacy class. The public document describes which data lives in which layer.

| Layer | Content | Placement | Retention principle | Privacy class |
|---|---|---|---|---|
| Hot record layer | Receipt records, line items, stage events | Application database | Active product window | Pseudonymous |
| Analytics layer | Normalized observations and quality metrics | Separate analytics partition | Policy-defined rolling window | Pseudonymous or anonymous |
| Object layer | Encrypted receipt input and processing derivatives | Encrypted object store | Data-minimization policy | May contain personal data |
| Anonymous aggregate layer | Aggregate output for the B2B data product | Separate aggregate store | Versioned publication window | Not linkable back to user |
| On-chain summary | Token event, settlement commitment, program state | Public chain | Permanent | Token and commitment data |

Two rules are invariant: raw receipt content is processed in the off-chain data layer; the anonymous aggregate layer uses user-separated keys. Retention periods and physical provider selection are operational policy.
