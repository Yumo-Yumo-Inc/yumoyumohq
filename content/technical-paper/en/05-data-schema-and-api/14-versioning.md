# Versioning

## 5.13 Versioning

- **Schema versions** follow SemVer at the record level. `schema_version: "1.0.0"` on every receipt allows backwards-compatible reads.
- **API versions** are URL-prefixed (`/v1`, `/v2`). Two adjacent major versions run in parallel for at least 12 months.
- **Taxonomy versions** are independent of schema versions. A canonical product can move from `food.dairy.milk` (v1.0) to `food.dairy.fluid-milk` (v1.1) while the receipt record schema stays stable.

---
