# 商家（規範）

## 5.5 商家（規範）

```json
// Merchant
{
  "merchant_id": "01HXY...",
  "name_canonical": "Migros",
  "name_aliases": ["MIGROS T.A.S.", "MIGROS A.S."],
  "tax_id_hash": "sha256:7f3a...",
  "chain_id": "chain.migros",
  "branch_code": "4521",
  "city": "Istanbul",
  "country": "TR",
  "merchant_class": "supermarket",
  "first_seen_at": "2026-01-01T00:00:00Z",
  "last_seen_at": "2026-05-17T14:23:11Z",
  "receipt_count": 18432
}
```

`tax_id_hash` 取代原始稅務 ID — Yumo Yumo 透過雜湊查詢鍵管理商家稅務 ID，以在資料庫遭入侵時限制影響範圍。

`branch_code` 為機會式提取；並非所有連鎖都使用它們。

---
