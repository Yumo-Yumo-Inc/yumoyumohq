# 索引与分区

## 5.12 索引与分区

`receipts` 与 `receipt_line_items` 依 `uploaded_at` 月份分区。活跃产品视窗保留于热资料层；较旧分区滚动至低成本的分析层。活跃索引类别：

| 资料表 | 索引 | 用途 |
|---|---|---|
| `receipts` | `(user_id, uploaded_at DESC)` | 列出使用者收据 |
| `receipts` | `(merchant_id, uploaded_at DESC)` | 商家伫列 |
| `receipt_line_items` | `(canonical_product_id, uploaded_at DESC)` | 价格观测 |
| `price_observations` | `(canonical_product_id, observed_at)` | 通膨脉冲 |
| `canonical_products` | `embedding_vector`（近似最近邻） | 阶段 4 配对 |
| `bint_ledger` | `(user_id, created_at DESC)` | 余额查询 |

向量索引是重建成本最高的索引，也是标准目录成长的限制因素 — 02 2.7 将其列为成本杠杆。具体的索引引擎与调校参数由内部营运层管理。

---
