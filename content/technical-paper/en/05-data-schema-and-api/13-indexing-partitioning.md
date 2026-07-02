# Indexing and partitioning

## 5.12 Indexing and partitioning

`receipts` and `receipt_line_items` are partitioned by `uploaded_at` month. The active product window stays in the hot data layer; older partitions roll to a lower-cost analytics layer. Active index classes:

| Table | Index | Use |
|---|---|---|
| `receipts` | `(user_id, uploaded_at DESC)` | List user's receipts |
| `receipts` | `(merchant_id, uploaded_at DESC)` | Merchant queue |
| `receipt_line_items` | `(canonical_product_id, uploaded_at DESC)` | Price observations |
| `price_observations` | `(canonical_product_id, observed_at)` | Inflation pulse |
| `canonical_products` | `embedding_vector` (approximate nearest-neighbour) | Stage 4 match |
| `bint_ledger` | `(user_id, created_at DESC)` | Balance queries |

The vector index is the most expensive index to rebuild and is the limiting factor in canonical-catalog growth — 02 2.7 lists this as a cost lever. The specific indexing engine and tuning parameters are managed in the internal operations layer.

---
