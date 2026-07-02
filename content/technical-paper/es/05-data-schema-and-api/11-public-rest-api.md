# API REST pública

## 5.10 API REST pública

```
Base: https://api.yumo.io/v1
Auth: OAuth 2.0 PKCE (cliente público) · Bearer token
Rate limit: limitación por usuario y por aplicación; cuotas actuales en la referencia del SDK
```

| Método | Ruta | Propósito | Auth |
|---|---|---|---|
| POST | `/receipts/upload` | Obtener URL de carga prefirmada | Usuario |
| POST | `/receipts/{id}/process` | Disparar canalización | Usuario |
| GET  | `/receipts/{id}` | Obtener registro de recibo | Usuario (solo propio) |
| GET  | `/receipts` | Listar recibos del usuario | Usuario (solo propio) |
| GET  | `/users/me/price-memory` | Memoria de precios personal | Usuario |
| GET  | `/users/me/bint` | Saldo e historial de bINT | Usuario |
| POST | `/conversions/bint-to-int` | Convertir bINT → INT (prepara TX) | Usuario |
| GET  | `/users/me/level` | Nivel + instantánea de salud | Usuario |
| GET  | `/canonical-products/{id}` | Detalles públicos de producto canónico | Público |
| GET  | `/merchants/{id}` | Detalles públicos de comerciante | Público |

### Webhooks

Las aplicaciones pueden suscribirse a eventos de ámbito de usuario:

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

Tipos de eventos en v1: `receipt.verified`, `receipt.rejected`, `bint.credited`, `bint.settled`, `conversion.completed`, `level.advanced`.

---
