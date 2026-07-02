# Açık REST API

## 5.10 Açık REST API

```
Taban: https://api.yumo.io/v1
Yetki: OAuth 2.0 PKCE (açık istemci) · Bearer token
Hız sınırı: kullanıcı ve uygulama başına sınırlama; mevcut kotalar SDK referansında
```

| Yöntem | Yol | Amaç | Yetki |
|---|---|---|---|
| POST | `/receipts/upload` | Önceden imzalı yükleme URL'si al | Kullanıcı |
| POST | `/receipts/{id}/process` | Boru hattını tetikle | Kullanıcı |
| GET  | `/receipts/{id}` | Fiş kaydını getir | Kullanıcı (sadece kendi) |
| GET  | `/receipts` | Kullanıcının fişlerini listele | Kullanıcı (sadece kendi) |
| GET  | `/users/me/price-memory` | Kişisel fiyat hafızası | Kullanıcı |
| GET  | `/users/me/bint` | bINT bakiyesi ve geçmişi | Kullanıcı |
| POST | `/conversions/bint-to-int` | bINT → INT dönüştürme (TX hazırlar) | Kullanıcı |
| GET  | `/users/me/level` | Seviye + sağlık anlık görüntüsü | Kullanıcı |
| GET  | `/canonical-products/{id}` | Açık kanonik ürün ayrıntıları | Açık |
| GET  | `/merchants/{id}` | Açık satıcı ayrıntıları | Açık |

### Webhook'lar

Uygulamalar kullanıcı kapsamlı olaylara abone olabilir:

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

v1'deki olay tipleri: `receipt.verified`, `receipt.rejected`, `bint.credited`, `bint.settled`, `conversion.completed`, `level.advanced`.

---
