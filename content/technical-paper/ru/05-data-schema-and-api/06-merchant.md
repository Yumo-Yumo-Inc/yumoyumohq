# Продавец (нормативный)

## 5.5 Продавец (нормативный)

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

`tax_id_hash` вместо сырого налогового ID — Yumo Yumo управляет налоговыми ID продавцов через хэшированные ключи поиска для ограничения зоны поражения в случае компрометации базы данных.

`branch_code` извлекается по возможности; не все сети их используют.

---
