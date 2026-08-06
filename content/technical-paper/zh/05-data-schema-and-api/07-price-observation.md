# 价格观测（规范）

## 5.6 价格观测（规范）

价格记忆表。每个 `(canonical_product_id, merchant_id, observation timestamp)` 组合一列。

```json
// PriceObservation
{
  "observation_id": "01HXY...",
  "canonical_product_id": "cp.pinar.milk.1l",
  "merchant_id": "01HXY...",
  "chain_id": "chain.migros",
  "city": "Istanbul",
  "observed_at": "2026-05-17T14:23:11Z",
  "unit_price_minor": 2350,
  "currency": "TRY",
  "trust_score": "0.XX",
  "is_promotional": false
}
```

此表驱动：

1. **使用者价格记忆** —「你以 23.50 TL 在 Migros 购买 Pınar süt；本周中位数为 22.10 TL。」
2. **B2B 价格指数** — 依 `(canonical_product_id, region, week)` 汇总，并强制执行 k-匿名性门槛。
3. **通膨脉冲** — 每晚计算的高频购物篮指数。

低于生产环境调校品质底线的列会被写入，但排除于指数计算外。

---
