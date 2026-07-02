# Proof of Contribution rail

## 4.11 What this rail funds

The Proof of Contribution (PoC) rail is the share of INT allocation that rewards engineering, design, governance, and ecosystem activation work. The Vision Paper sets the allocation share. The founding team, full-time hires, contractors, and external contributors all earn through PoC, on the same impact-weighted logic.

This is a deliberate structural choice. Separating "team tokens" from "contributor tokens" is the conventional pattern; it gives the team a fixed allocation regardless of impact and creates an asymmetry that depresses long-term token holder trust. The PoC rail closes that asymmetry by routing all non-user-reward issuance through the same earned-by-work mechanism.

## 4.12 How distributions are scored

PoC issuance happens in periodic distributions. Each distribution scores recent contributions against a written impact rubric and allocates the period's PoC budget proportionally. The rubric is documented separately and updated as the protocol's surface evolves; current categories include:

- Protocol engineering (smart-contract development, pipeline operation, infrastructure).
- Application engineering (mobile, web, surfaces).
- Research and economic design.
- Security, audit liaison, and operational risk treatment.
- Ecosystem activation (market expansion, partner enablement, community programs).
- Governance work as it materialises.

Each contributor receives an INT distribution with vesting attached. The vesting schedule is policy; current defaults follow industry-standard cliff-plus-linear shapes for engineering contributions and shorter schedules for project-bounded work.

## 4.13 Vesting

All PoC issuance carries vesting; no PoC distribution is immediately liquid. Vesting parameters depend on the contributor's role and the distribution's scope:

| Distribution scope | Cliff | Linear vesting horizon | Custodian |
|---|---|---|---|
| Full-time core engineering | Standard cliff | Multi-year linear | Vesting contract per recipient |
| Specialist contractor (audit, security, design) | Variable, project-bounded | Project-aligned | Vesting contract per engagement |
| Community / governance work | Short or none | Distribution-aligned | Direct issuance or short vesting |

Exact cliff and vesting durations are policy and are documented in each distribution's published record. Vesting contracts are on-chain and inspectable.

## 4.14 cPoints → bINT migration at TGE

Before the Token Generation Event, contribution credits accrue as cPoints. At TGE, cPoints are deprecated and migrated into bINT at a published conversion ratio. The migration is a one-shot event with a snapshot date. The conversion ratio is part of the published TGE schedule and is set against the closed-beta contribution distribution that exists at snapshot time.

cPoints holders see the migration in their wallet as a one-time bINT mint; from that moment, the standard bINT → INT lifecycle (4.4) applies.
