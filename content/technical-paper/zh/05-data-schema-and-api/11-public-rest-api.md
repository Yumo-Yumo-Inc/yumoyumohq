# 公開 REST API

## 5.10 公開 REST API

```
Base: https://api.yumo.io/v1
Auth: OAuth 2.0 PKCE（公開客戶端）· Bearer token
Rate limit: 每使用者與每應用程式限制；當前配額見 SDK 參考文件
```

| 方法 | 路徑 | 用途 | 認證 |
|---|---|---|---|
| POST | `/receipts/upload` | 取得預簽名上傳 URL | 使用者 |
| POST | `/receipts/{id}/process` | 觸發管線 | 使用者 |
| GET  | `/receipts/{id}` | 讀取收據記錄 | 使用者（僅限自身） |
| GET  | `/receipts` | 列出使用者收據 | 使用者（僅限自身） |
| GET  | `/users/me/price-memory` | 個人價格記憶 | 使用者 |
| GET  | `/users/me/bint` | bINT 餘額與歷史 | 使用者 |
| POST | `/conversions/bint-to-int` | 轉換 bINT → INT（準備交易） | 使用者 |
| GET  | `/users/me/level` | 等級 + 健康快照 | 使用者 |
| GET  | `/canonical-products/{id}` | 公開標準商品詳情 | 公開 |
| GET  | `/merchants/{id}` | 公開商家詳情 | 公開 |

### Webhooks

應用程式可訂閱使用者範圍事件：

```json
// receipt.verified
{
  "event_type": "receipt.verified",
  "event_id": "01HXY...",
  "occurred_at": "2026-05-17T14:23:13Z",
  "data": {
    "receipt_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
    "user_id": "01HXY...",
    "trust_score": "0.XX",
    "bint_credited_minor": 12500
  }
}
```

v1 事件型別：`receipt.verified`、`receipt.rejected`、`bint.credited`、`bint.settled`、`conversion.completed`、`level.advanced`。

---
