# B2B API (planned)

## 5.11 B2B API (planned)

The B2B data product's API is **planned future work**; no B2B endpoints are live today. B2B-relevant data currently reaches the outside world through the public price ledger (5.10) and its Arweave manifests.

Design sketch for the planned surface — separate base path, separate credentials, separate quotas from the public API:

| Method | Path | Purpose |
|---|---|---|
| GET | `/inflation-pulse` | Inflation Pulse series |
| GET | `/basket-panel` | Basket Panel query |
| GET | `/merchant-benchmarks` | Merchant Benchmarks |
| POST | `/cohort-query` | Custom cohort with k-floor enforcement |
| GET | `/catalog` | Available products + freshness + pricing |
| GET | `/methodology/{version}` | Methodology document for a given version |

Planned auth: API key with replay-protected request signing; the signing scheme and replay window stay in the internal operations layer.

Every planned B2B response includes `methodology_version`, the k-anonymity floor indicator, and the response's contributor count, so the buyer's compliance team can audit a release.

---
