# Receipt Intelligence Data Model

Patterns only works if the receipt pipeline leaves us a clean, queryable history. This note records how we think about the data layer that feeds identity, radar, and insight cards.

## What we store for behavior

We separate raw documents from derived features:

- **Receipt records** — merchant, timestamp, totals, line items, document type, verification status.
- **Canonical products and merchants** — stable IDs after matching abbreviations, pack sizes, and chain labels.
- **Behavior feature store** — per-user aggregates: time-of-day shares, category mix, promo share, repeat merchants, basket diversity.
- **Insight scores** — versioned scores with confidence and evidence pointers back to receipts.
- **Cohort benchmarks** — only when enough anonymized peers exist; otherwise empty.
- **Feedback events** — “feels like me”, dismiss, action taken.

We keep single-user records, aggregate tables, and on-chain summaries in separate layers.

## Matching discipline

Canonical matching collapses surface forms into stable references. We use deterministic and fuzzy matching over product and merchant text. Operational thresholds stay private; the public contract is:

- Match when confidence is high enough to write a stable ID.
- Leave unmatched lines visible as raw text rather than forcing a wrong canonical.
- Prefer empty over wrong when the receipt is thin.

## Signals we can compute in SQL

From verified receipts we can already derive:

- Basket size and category mix by week / month
- Promo vs non-promo spend share
- Hour-of-day and weekday / weekend profiles
- Top merchants by spend concentration
- Unit-price trends for repeated canonical products
- Cross-item co-occurrence inside the same receipt

These are observation signals. Personality language comes later, and only when the observation layer is dense enough.

## Confidence inputs

A useful confidence score blends:

- Number of supporting receipts in the window
- Share of lines that resolved to canonical IDs
- Time coverage (do we have evenings, weekends, pay-cycle days?)
- Stability across rolling windows

If any of those are weak, the Patterns UI shows less, not more.

## Empty-data contract

- No peer percentile without a real cohort.
- No “typical for your city” claim without enough local users.
- No invented time patterns when `extraction.time` is missing on most receipts.
- Location features use city / district text we already store; we do not invent distance without coordinates.

## Why this model matters

The Patterns page is only as honest as the feature store. We would rather ship a short page with three solid observations than a dense page of guessed psychology.
