# Indexing and scaling

## 5.12 Indexing and scaling

The system of record is a **single managed Postgres instance (Neon)** with conventional B-tree indexes; separate branches serve development and production. Representative index classes:

| Table | Index | Use |
|---|---|---|
| `receipts` | user + upload time | List a user's receipts |
| `receipts` | merchant + upload time | Merchant history |
| `receipt_line_items` | canonical product | Price history reads |
| `price_epoch_observations` | epoch + leaf index | Epoch reads and inclusion proofs |
| `contribution_point_events` | user + creation time | Balance queries |
| `merchants` | tax id + country (unique, partial) | Merchant identity resolution |

Time-based partitioning of `receipts` and `receipt_line_items` and movement of older data to a lower-cost analytics layer are **scaling options** for when volume warrants them; the current volume is served by the single instance and conventional indexing. The specific engine tuning stays in the internal operations layer.

---
