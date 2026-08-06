# Spending Triggers and Context Map

Spending habits sit inside time, place, promo, and social context. This note maps the context signals we can read from receipts and how we use them on Patterns.

## Habit loop we care about

We read each repeating purchase as a simple loop:

- **Trigger** — time of day, weekday, payday window, promo, merchant type
- **Routine** — the basket that follows
- **Reward** — short comfort, convenience, social time, or identity signal

We show the loop as an observed cycle. We do not claim to measure dopamine, stress hormones, or clinical addiction stages.

## Trigger dimensions we can observe

From receipt metadata and user profile fields we already collect:

| Dimension | Example signal |
|---|---|
| Time | Late-evening baskets, weekend spikes |
| Calendar | Payday week vs end-of-month |
| Merchant | Same café chain every weekday morning |
| Promo | Discount lines present on the receipt |
| Basket shape | Ready-made share rising vs cooking staples |
| Social proxy | Restaurant / group-meal clusters on weekends |
| Location text | City / district on merchant records |

We do not claim weather, GPS radius, or biometric mood unless those inputs exist in production.

## Turkey-facing context

In high-inflation settings we expect two coexisting habits:

- **Trading down** — cheaper substitutes, private label, smaller packs
- **Micro-luxuries** — small comfort purchases that keep a sense of control

Patterns should surface both without moralizing. A rising share of small comfort items next to grocery trading-down is a readable habit, not a character flaw.

## Demographic lenses (internal only)

Age, city, and household stage can shape cohort benchmarks. We may use them for anonymized comparison when cohorts are large enough. We do not put stereotype sentences in the UI (“people like you always…”).

## Product uses

- Heatmaps for hour × weekday intensity
- “Payday window” vs “end-of-month” comparison cards
- Promo-on vs promo-off basket comparisons
- Habit-loop cards that name the trigger and the routine in plain language
- Soft limits timed to the user's own high-intensity windows

## Guardrails

- Missing timestamps → time-based axes marked low confidence or hidden
- Missing location coordinates → no “nearby” or km claims; city / district only
- Thin history → show the raw observation count instead of a dramatic story
