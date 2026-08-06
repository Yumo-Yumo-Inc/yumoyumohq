# Stage 5 — Merchant

## 2.8 Stage 5 — Merchant resolution

Every receipt is mapped to a `merchant_id`. Merchant resolution runs in the **synchronous flow**, so the verified preview already carries the resolved merchant. Resolution is a layered priority cascade — each layer runs only when the previous one produced no match:

1. **Tax identifier** — the printed tax ID (VKN in Türkiye) is validated with its check-digit algorithm and looked up against the merchant master table. A valid tax ID is a direct identity match.
2. **Recognized brand** — when the extraction stage recognized a known chain brand, the official brand form resolves directly to the chain merchant.
3. **Pattern anchors** — learned per-merchant text patterns match the normalized merchant name, with greeting prefixes stripped before comparison.
4. **Location** — address signals narrow candidates when name evidence alone is ambiguous.
5. **Fuzzy match** — normalized-name similarity against existing merchant candidates.
6. **Auto-create** — when no layer matches, a rate-limited path creates a new merchant record, which enters the verification queue.

The similarity settings of the cascade are managed in the internal operations layer.

### Chain mapping

A merchant resolved to a known chain (BIM, A101, Migros, ŞOK) gets a `chain_id`. Chains drive two things:

- **Cross-branch aggregation** for the B2B data product (basket prices at "Migros nationwide").
- **Geographic enrichment** — when the user opts in, the branch address is enriched with city/region from the merchant master table.

### Geo enrichment (opt-in only)

If the user enabled location sharing, the receipt is tagged with the resolved city/region. The system uses city-level geography. This satisfies the privacy commitment in 08 and the B2B data product's k-anonymity requirement in 05.

### Unknown merchant

If no layer resolves and auto-creation is declined, the receipt is written with `merchant_id = null` and `merchant_raw_name` is kept. The trust scorer (03) treats unknown-merchant as a mild negative signal. Unmatched merchants are reviewed through the admin verification queue.

---
