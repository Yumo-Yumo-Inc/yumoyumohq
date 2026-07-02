# Environments

## 1.6 Environments

Yumo Yumo defines environments by data scope and economic effect, not by network labels. The purpose of this page is to describe protocol maturity boundaries, not to explain chain-specific terminology.

| Environment | Data scope | Economic effect | Use |
|---|---|---|---|
| Local and test | Fixtures, synthetic receipts | None | Development, automated tests, model experiments |
| Staging | Synthetic data and explicit opt-in test data | None | Release validation, migration rehearsal, quality control |
| Controlled production | Real user data | Limited reward and authority scope | Early growth, country/segment rollout, observed scaling |
| Full production | Real user data | Published protocol rules | Broad usage and regular settlement |

The transition from controlled production to full production is driven by economic limits, data-processing scope, and authority model. Operational caps and transition criteria are managed in the internal operations layer.
