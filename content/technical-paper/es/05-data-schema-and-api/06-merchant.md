# Comerciante (normativo)

## 5.5 Comerciante (normativo)

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

`tax_id_hash` en lugar del ID fiscal en bruto — Yumo Yumo gestiona los ID fiscales de comerciantes a través de claves de búsqueda hasheadas para limitar el radio de explosión si la base de datos se ve comprometida.

`branch_code` se extrae oportunísticamente; no todas las cadenas los usan.

---
