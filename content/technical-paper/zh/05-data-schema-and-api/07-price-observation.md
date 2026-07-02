# 價格觀測（規範）

## 5.6 價格觀測（規範）

價格記憶表。每個 `(canonical_product_id, merchant_id, observation timestamp)` 組合一列。

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

此表驅動：

1. **使用者價格記憶** —「你以 23.50 TL 在 Migros 購買 Pınar süt；本週中位數為 22.10 TL。」
2. **B2B 價格指數** — 依 `(canonical_product_id, region, week)` 彙總，並強制執行 k-匿名性門檻。
3. **通膨脈衝** — 每晚計算的高頻購物籃指數。

低於生產環境調校品質底線的列會被寫入，但排除於指數計算外。

---
