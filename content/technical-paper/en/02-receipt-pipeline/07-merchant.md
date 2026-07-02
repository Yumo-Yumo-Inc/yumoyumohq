# Stage 5 — Merchant

## 2.8 Stage 5 — Merchant resolution

Every receipt is mapped to a `merchant_id`. The fingerprint uses a weighted multi-signal model. Signals include tax identifier, normalised merchant name, address fragment, and receipt template fingerprint. The signal set and weights are managed in the internal operations layer.

### Chain mapping

A merchant resolved to a known chain (BIM, A101, Migros, ŞOK) gets a `chain_id`. Chains drive two things:

- **Cross-branch aggregation** for the B2B data product (basket prices at "Migros nationwide").
- **Geographic enrichment** — when the user opts in, the branch address is enriched with city/region from the merchant master table.

### Geo enrichment (opt-in only)

If the user enabled location sharing, the receipt is tagged with the resolved city/region. The system uses city-level geography. This satisfies the privacy commitment in 08 and the B2B data product's k-anonymity requirement in 05.

### Unknown merchant

If the fingerprint resolves to the merchant queue, the receipt is written with `merchant_id = null` and `merchant_raw_name` is kept. The trust scorer (03) treats unknown-merchant as a mild negative signal. The merchant queue is drained the same way as the canonicalisation queue.

---
