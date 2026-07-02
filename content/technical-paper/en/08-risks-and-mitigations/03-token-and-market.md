# Token and market risk

## 8.5 Surface

INT is an SPL token traded on public markets. Market risk is read through three technical surfaces:

| Surface | Technical impact | Public control principle |
|---|---|---|
| Price volatility | USD value of user rewards and staking changes | Emission formulas are published in token units |
| Unlock pressure | Release of locked supply affects circulating supply | Vesting profiles map to public schedules |
| Liquidity | Secondary-market depth determines trade impact | Treasury and BBB mechanics connect to the public economic model |

## 8.6 Control model

**Peak-based emission curve.** The daily user-reward pool follows the peak-based formula defined in 04 §4.3. MAU growth changes per-user contribution density through that formula.

**Revenue-linked burn.** B2B data-product revenue creates the economic source for INT buy-back and burn through the BBB rail (4.9). Burn capacity scales with data-product revenue.

**Vesting and staking.** PoC distributions follow multi-year vesting schedules (4.13). Staking pools and lock durations make long-horizon holding economically legible (4.6).

**Liquidity management.** Initial liquidity conditions after the Token Generation Event are managed as part of the launch plan. Treasury movement maps to the authority and record model in 04 §4.10.

## 8.7 Evolution

As treasury authority migrates to foundation governance, BBB execution, staking parameters, and liquidity operations mature under the same public authority-migration model. The technical paper gives the mechanism formula and authority flow as the stable reference.
