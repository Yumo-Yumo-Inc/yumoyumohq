# B2B REST API

## 5.11 B2B REST API

Separate base, separate auth, separate rate limits.

```
Base: https://b2b-api.yumo.io/v1
Auth: API key + authenticated requests with replay protection. The signing scheme and replay window are managed in the internal operations layer.
Rate limit: tier-dependent · separate quota from public API
```

| Method | Path | Purpose |
|---|---|---|
| GET | `/inflation-pulse` | TR Inflation Pulse series |
| GET | `/basket-panel` | Basket Panel query |
| GET | `/merchant-benchmarks` | Merchant Benchmarks |
| POST | `/cohort-query` | Custom cohort with k-floor enforcement |
| GET | `/catalog` | Available products + freshness + pricing |
| GET | `/methodology/{version}` | Methodology document for a given version |

Every B2B response includes `methodology_version`, `k_anonymity_floor`, and the response's contributor count, so the buyer's compliance team can audit a release.

---
