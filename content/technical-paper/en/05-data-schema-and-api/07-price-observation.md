# Price observation (normative)

## 5.6 Price observation (normative)

The price-memory table. One row per `(canonical_product_id, merchant_id, observation timestamp)`.

```json
// PriceObservation
{
  "observation_id": "01HXY...",
  "canonical_product_id": "cp.pinar.milk.1l",
  "merchant_id": "01HXY...",
  "chain_id": "chain.migros",
  "city": "Istanbul",
  "observed_at": "2026-05-17T14:23:11Z",
  "unit_price_minor": 2350,
  "currency": "TRY",
  "trust_score": "0.XX",
  "is_promotional": false
}
```

This is the table that powers:

1. **User price memory** — "you paid 23.50 TL for Pınar süt at Migros; the median this week is 22.10 TL."
2. **B2B price index** — aggregated by `(canonical_product_id, region, week)` with k-anonymity threshold enforced.
3. **Inflation pulse** — high-frequency basket index computed nightly.

Rows below a production-tuned quality floor are written but excluded from index computations.

---
