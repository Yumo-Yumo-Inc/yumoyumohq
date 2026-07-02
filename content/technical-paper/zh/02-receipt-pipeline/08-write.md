# 階段 6 — 寫入

## 2.9 階段 6 — 輸出寫入

單一 Postgres 交易寫入：

```sql
INSERT INTO receipts (...) VALUES (...);
INSERT INTO receipt_line_items (...) VALUES (...);
INSERT INTO price_observations (...) VALUES (...);
INSERT INTO events (event_type, payload) VALUES ('receipt.verified', {...});
```

`events` 列觸發兩個下游消費者：

- **信任評分器**（03）— 接收事件、計算信任分數、寫入 `trust_scores`。
- **結算工作者** — 將 `bINT.pending` 額度排入佇列。實際的鏈上鑄造發生於非同步階層（01 階段 B）。

此交易對內部寫入鍵（internal write key）具冪等性：若工作者重試，可安全重播。

---
