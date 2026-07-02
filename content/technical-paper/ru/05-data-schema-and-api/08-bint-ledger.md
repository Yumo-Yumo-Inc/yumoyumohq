# Реестр bINT (нормативный)

## 5.7 Реестр bINT (нормативный)

Внеблокчейн-зеркало кредитов bINT. Только с добавлением.

```json
// BintLedgerEntry
{
  "ledger_entry_id": "01HXY...",
  "user_id": "01HXY...",
  "wallet_address": "5Hg2...8fpA",
  "source": "receipt",
  "source_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
  "amount_minor": 12500,
  "currency_code": "bINT",
  "trust_score_at_credit": "0.XX",
  "level_at_credit": "<L>",
  "health_at_credit": "0.XX",
  "daily_cap_band": "<band>",
  "created_at": "2026-05-17T14:23:12Z",
  "settled_to_chain_at": null,
  "onchain_tx_signature": null,
  "previous_entry_hash": "sha256:9a01...",
  "entry_hash": "sha256:b3f8..."
}
```

### Зачем криптографическая цепь

`previous_entry_hash` + `entry_hash` формируют хэш-цепь по реестру. Это даёт Yumo Yumo **верифицируемый журнал аудита**: хотя реестр операционно является таблицей Postgres, хэш-цепь означает, что попытка подделки обнаружима. Последний `entry_hash` периодически публикуется в блокчейне (обязательство корня Merkle), чтобы внешние стороны могли проверять целостность реестра.

### Расчёт

Расчётный worker пакетирует строки `BintLedgerEntry` с `settled_to_chain_at IS NULL` и чеканит агрегированный bINT в Solana. После подтверждения заполняются `settled_to_chain_at` и `onchain_tx_signature`. С этого момента состояние в блокчейне является источником истины для этой записи.

---
