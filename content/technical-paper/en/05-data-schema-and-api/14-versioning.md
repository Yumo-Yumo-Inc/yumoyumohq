# Versioning

## 5.13 Versioning

- **Ledger spec versions** are live today: every price-ledger leaf preimage and manifest carries a spec version (`v1`, with a versioned format transition gated by epoch number), so sealed history always rebuilds byte-for-byte under the rules it was published with.
- **API versions** (planned, for the public REST API): URL-prefixed (`/v1`, `/v2`), with two adjacent major versions running in parallel for at least 12 months.
- **Taxonomy versions** are independent of schema versions. A canonical product can move from `food.dairy.milk` (v1.0) to `food.dairy.fluid-milk` (v1.1) while the receipt record schema stays stable.

---
