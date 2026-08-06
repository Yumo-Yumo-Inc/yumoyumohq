# Anonymised aggregate and the B2B data product

## 5.8 Anonymised aggregate and the B2B data product

This is the surface that will produce the B2B data product. The transformation rules below govern any aggregate publication; the commercial product and its API (5.11) are planned future work.

### Transformation rules

Going from `receipts + line_items + price observations` to anonymised aggregate is a **one-way, destructive** transformation:

1. **Replace user_id and wallet_address.** Use a session-scoped hash separated from user identifiers.
2. **Coarsen geography.** City-level granularity only; coordinates are dropped if they were ever recorded.
3. **Coarsen time.** Daily bucket for high-frequency indices; weekly bucket for category-level reporting; monthly for demographic cohorts.
4. **Enforce k-anonymity.** Every record released must belong to a cell with at least a contractually-defined minimum number of distinct contributors on the quasi-identifier fields (`city`, `merchant_class`, `time_bucket`, `category_path`). Cells below the threshold are suppressed or coarsened until they pass.
5. **Add calibrated differential-privacy noise** to count-based outputs.
6. **Build aggregate scope from verified PoE.** Order-page receipts and other pending-verification records stay in the memory layer.

### Planned products

| Product | Granularity | Refresh | Indicative price |
|---|---|---|---|
| **TR Inflation Pulse** | Category × region × week | Daily | $X / mo (subscription) |
| **Basket Panel** | Canonical product × city × week | Daily | $Y / mo |
| **Merchant Benchmarks** | Chain × category × month | Weekly | $Z / mo |
| **Custom Cohort Query** | API per-query, k-anonymity threshold enforced | On demand | $Q / query |

Prices and exact granularities are placeholder; the production catalogue will be finalised before commercial launch.

### Sample B2B response (planned shape)

```json
// GET /inflation-pulse?region=istanbul&category=food.dairy&from=2026-05-01&to=2026-05-17
{
  "region": "istanbul",
  "category": "food.dairy",
  "series": [
    { "week_start": "2026-05-04", "index": 100.0, "n_observations": "<n>", "n_distinct_contributors": "<n>" },
    { "week_start": "2026-05-11", "index": 101.7, "n_observations": "<n>", "n_distinct_contributors": "<n>" }
  ],
  "k_anonymity_floor_met": true,
  "methodology_version": "1.0.0"
}
```

Every B2B response carries `n_distinct_contributors` so the buyer can audit that the k-anonymity floor was met. Cells that would have fallen below the floor are returned as `suppressed: true` with no values. The specific threshold value is managed in the internal operations layer.

### Out-of-scope fields

- Any field tied to a single user.
- Any record below the k-anonymity threshold for the queried cell.
- Coordinates, addresses, phone numbers.
- Payment instrument metadata.
- Anonymised but linkable IDs across queries (every query rolls a new session hash).

---
