# 索引與分區

## 5.12 索引與分區

`receipts` 與 `receipt_line_items` 依 `uploaded_at` 月份分區。活躍產品視窗保留於熱資料層；較舊分區滾動至低成本的分析層。活躍索引類別：

| 資料表 | 索引 | 用途 |
|---|---|---|
| `receipts` | `(user_id, uploaded_at DESC)` | 列出使用者收據 |
| `receipts` | `(merchant_id, uploaded_at DESC)` | 商家佇列 |
| `receipt_line_items` | `(canonical_product_id, uploaded_at DESC)` | 價格觀測 |
| `price_observations` | `(canonical_product_id, observed_at)` | 通膨脈衝 |
| `canonical_products` | `embedding_vector`（近似最近鄰） | 階段 4 配對 |
| `bint_ledger` | `(user_id, created_at DESC)` | 餘額查詢 |

向量索引是重建成本最高的索引，也是標準目錄成長的限制因素 — 02 2.7 將其列為成本槓桿。具體的索引引擎與調校參數由內部營運層管理。

---
