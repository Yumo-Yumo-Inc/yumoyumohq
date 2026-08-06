# Behavioral Observation Layer

We treat the Patterns page as a mirror of real spending, not a category dashboard. Receipt line items give us merchant, time, basket, brand, and promo signals that bank feeds usually flatten. Our job is to turn those signals into readable habits without inventing certainty.

## How we structure every insight

We keep three layers in order:

1. **Observation** — what the receipts show (counts, shares, timing, repeats).
2. **Interpretation** — a cautious reading of why that may be happening.
3. **Action** — one small next step the user can take.

We never open with a diagnosis. We open with evidence.

## Evidence tiers

Every insight we ship carries an internal evidence label:

| Tier | Meaning | User-facing behavior |
|---|---|---|
| Evidence-backed | Directly supported by the user's receipt history | Full insight + comparison |
| Derived heuristic | Grounded in a known behavioral mechanism, scored from our data | Insight with soft language |
| Heuristic | Product hypothesis that still needs validation | Shown only with low confidence or held back |

When confidence is low, we show an empty or explanatory state. We do not fill gaps with fabricated peers, fake percentiles, or placeholder psychology.

## Confidence display rules

We compute a confidence score from coverage (how many receipts support the claim), recency, and signal stability. Display policy:

- High confidence → full insight card
- Medium confidence → insight with a “limited data” note
- Low confidence → hide the claim; keep the observation surface empty

Exact calibration stays in the internal operations layer.

## Insight families we prioritize

- **Spending DNA** — six grounded traits derived from receipt observations (impulsive, hunter, explorer, hedonist, loyal, planner).
- **Reward-loop map** — repeating short-reward purchases, shown as a habit map rather than a biological claim.
- **Convenience drift** — rising share of ready-made / delivery / convenience baskets.
- **Promo sensitivity** — how often discounts appear in the basket and what happens when they stop.
- **Identity spends** — symbolic or lifestyle-heavy categories that recur.
- **Quiet leaks** — small, high-frequency items that accumulate.
- **Future-self framing** — forward-looking comparisons without shame.

## Copy rules

- Lead with what we saw: “On 14 of your last 20 grocery trips, evening baskets were larger.”
- Soften interpretation: “That often lines up with end-of-day convenience.”
- Offer one action: “Set a soft evening grocery limit for this week.”
- Avoid clinical labels, personality diagnoses, and superiority language.
- Prefer Turkish/English product copy that names the habit plainly — never vague filler words.

## What we measure on the page

- Narrative completion rate (did the user finish the insight story?)
- Self-recognition rate (did the user mark “this feels like me”?)
- Action take rate (soft goal set, limit set, or card dismissed with reason)
- Empty-state honesty (share of cards correctly withheld for thin data)

## Product stance

We are building a behavioral observation layer on top of Proof of Expense. Categories answer “where did the money go?” Patterns answers “what habit is showing up in the receipts?” Both stay grounded in real documents.
