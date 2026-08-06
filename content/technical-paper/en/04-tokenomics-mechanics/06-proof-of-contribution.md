# Proof of Contribution rail

## 4.11 What this rail funds

The Proof of Contribution (PoC) rail is the share of INT allocation that rewards engineering, design, governance, and ecosystem activation work. The Vision Paper sets the allocation share. The founding team, full-time hires, contractors, and external contributors all earn through PoC, on the same impact-weighted logic.

PoC puts distributions to the team and external contributors under the same published assessment and vesting process. This design does not by itself guarantee fair distribution; auditability depends on publishing the versioned rubric, distribution records, and vesting contracts.

## 4.12 How distributions are scored

PoC issuance happens in periodic distributions. Each distribution scores recent contributions against a written impact rubric and allocates the period's PoC budget proportionally. The rubric is documented separately and updated as the protocol's surface evolves; current categories include:

- Protocol engineering (smart-contract development, pipeline operation, infrastructure).
- Application engineering (mobile, web, surfaces).
- Research and economic design.
- Security, audit liaison, and operational risk treatment.
- Ecosystem activation (market expansion, partner enablement, community programs).
- Governance work as it materialises.

The relevant distribution record specifies the cliff, vesting duration, and contract address for each contributor. The version of the assessment rubric is included in that record before the distribution is made.

## 4.13 Vesting

All PoC issuance carries vesting; no PoC distribution is immediately liquid. Vesting parameters depend on the contributor's role and the distribution's scope:

| Distribution scope | Cliff | Linear vesting horizon | Custodian |
|---|---|---|---|
| Full-time core engineering | Standard cliff | Multi-year linear | Vesting contract per recipient |
| Specialist contractor (audit, security, design) | Variable, project-bounded | Project-aligned | Vesting contract per engagement |
| Community / governance work | Short or none | Distribution-aligned | Direct issuance or short vesting |

Exact cliff and vesting durations are policy and are documented in each distribution's published record. Vesting contracts are on-chain and inspectable.

## 4.14 The bINT accounting layer

Each verified contribution is recorded as an append-only event in the bINT accounting layer. Epoch settlement sums those events directly and converts the eligible total to INT at the flat 1:1 ratio (4.24); the standard bINT → INT lifecycle (4.4) applies. There is no separate migration event, snapshot, or intermediate conversion step.
