# Public REST API

## 5.10 Public REST API

```
Base: https://api.yumo.io/v1
Auth: OAuth 2.0 PKCE (public client) · Bearer token
Rate limit: per-user and per-app limiting; current quotas in the SDK reference
```

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/receipts/upload` | Get presigned upload URL | User |
| POST | `/receipts/{id}/process` | Trigger pipeline | User |
| GET  | `/receipts/{id}` | Fetch receipt record | User (own only) |
| GET  | `/receipts` | List user's receipts | User (own only) |
| GET  | `/users/me/price-memory` | Personal price memory | User |
| GET  | `/users/me/bint` | bINT balance and history | User |
| POST | `/conversions/bint-to-int` | Convert bINT → INT (prepares TX) | User |
| GET  | `/users/me/level` | Level + health snapshot | User |
| GET  | `/canonical-products/{id}` | Public canonical product details | Public |
| GET  | `/merchants/{id}` | Public merchant details | Public |

### Webhooks

Apps can subscribe to user-scoped events:

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

Event types at v1: `receipt.verified`, `receipt.rejected`, `bint.credited`, `bint.settled`, `conversion.completed`, `level.advanced`.

---
