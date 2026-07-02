# Публичный REST API

## 5.10 Публичный REST API

```
Base: https://api.yumo.io/v1
Auth: OAuth 2.0 PKCE (публичный клиент) · Bearer token
Rate limit: ограничение на пользователя и на приложение; текущие квоты в справочнике SDK
```

| Метод | Путь | Назначение | Авторизация |
|---|---|---|---|
| POST | `/receipts/upload` | Получить предподписанный URL загрузки | Пользователь |
| POST | `/receipts/{id}/process` | Запустить конвейер | Пользователь |
| GET  | `/receipts/{id}` | Получить запись чека | Пользователь (только свои) |
| GET  | `/receipts` | Список чеков пользователя | Пользователь (только свои) |
| GET  | `/users/me/price-memory` | Личная ценовая память | Пользователь |
| GET  | `/users/me/bint` | Баланс и история bINT | Пользователь |
| POST | `/conversions/bint-to-int` | Конвертировать bINT → INT (подготавливает TX) | Пользователь |
| GET  | `/users/me/level` | Уровень + снимок здоровья | Пользователь |
| GET  | `/canonical-products/{id}` | Публичные детали канонического продукта | Публичный |
| GET  | `/merchants/{id}` | Публичные детали продавца | Публичный |

### Вебхуки

Приложения могут подписываться на события в рамках пользователя:

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

Типы событий на v1: `receipt.verified`, `receipt.rejected`, `bint.credited`, `bint.settled`, `conversion.completed`, `level.advanced`.

---
