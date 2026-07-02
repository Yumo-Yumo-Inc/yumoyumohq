# Security boundaries

## 1.7 Security boundaries

Yumo Yumo's security model separates which layer holds which data and which authority. The public document describes authority and data boundaries in an auditable way.

| Boundary | Holds | Authority separation |
|---|---|---|
| User device | Wallet signature, selected receipt file, local preprocessing | User signing stays device-side |
| Application services | Session, upload orchestration, pipeline jobs, status events | Application services carry session and pipeline authority |
| Data plane | Pseudonymous receipt records, derived observations, reward ledger | Data plane carries record and ledger integrity |
| On-chain layer | Token state, staking/treasury authorities, cryptographic commitments | On-chain layer carries token and commitment state |
| Operational control plane | Monitoring, quotas, incident response | Operational control plane manages defense parameters |

In this model, user data, reward accounting, and on-chain authority live in separate layers. Cross-boundary transitions happen through typed events and auditable records; signing procedures, emergency playbooks, and threshold values are managed in private operational documentation.
