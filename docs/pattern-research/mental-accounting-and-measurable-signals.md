# Mental Accounting and Measurable Signals

People already sort money into mental buckets. Patterns makes those buckets visible from receipts so users can see where the buckets leak.

## Mental accounting on the page

We group spend into buckets the user can recognize — essentials, routines, comfort, social, identity, quiet leaks — derived from categories and line-item shape. The page shows:

- How each bucket shares the month
- Which buckets are growing
- Where promo or late-day baskets pull money across buckets

We describe leakage as movement between buckets, not as failure.

## Measurable signals (M1–M6)

These are the core observation metrics we want the feature store to support:

| ID | Signal | Plain reading |
|---|---|---|
| M1 | Mental-account balance | Share of spend across user-recognizable buckets |
| M2 | Promo dependence | Share of spend on discounted lines |
| M3 | Impulse index | Late-night / weekend / off-routine spend weight |
| M4 | Repeat score | Concentration in top merchants and categories |
| M5 | Price-perception drift | Unit-price trend on repeated canonical products |
| M6 | Basket diversity | Category variety inside baskets (entropy-style) |

Exact formulas and thresholds stay in the internal operations layer. The product contract is: each signal maps to a visible observation and an optional soft action.

## Promo radar

When receipts carry discount lines we can show:

- Promo share of baskets over time
- Categories that appear most often with discounts
- What the basket looks like in non-promo weeks

Copy stays neutral: “In non-promo weeks, this category ran higher than your recent average,” not “you lose money when sales end.”

## Merchant concentration

A simple concentration score (HHI-style) tells us whether spend clusters in a few chains. High concentration is useful for loyalty and substitution insights. We present it as “most of your spend sits with these merchants,” with room for alternatives — never as addiction language.

## Market-basket co-occurrence

Inside a single receipt, co-occurring items can surface lifestyle routines (“when coffee appears, pastry often appears”). We use this for curiosity cards and soft goals, not for upselling third-party products.

## Framing rules

- Prefer gain-framed, factual language over loss-framed scare copy
- Hedonic adaptation cards ask “does this still feel worth it?” instead of accusing
- Demographic fields never become stereotype captions in the UI
- If a signal cannot be computed this week, the card stays empty
