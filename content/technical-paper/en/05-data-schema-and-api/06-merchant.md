# Merchant (normative)

## 5.5 Merchant (normative)

```json
// Merchant
{
  "merchant_id": "f3b1c2d4-...",
  "display_name": "Migros",
  "name_aliases": ["MIGROS T.A.S.", "MIGROS A.S."],
  "tax_id": "6200278131",
  "city": "Istanbul",
  "country": "TR",
  "merchant_class": "supermarket",
  "first_seen_at": "2026-01-01T00:00:00Z",
  "last_seen_at": "2026-05-17T14:23:11Z",
  "receipt_count": 18432
}
```

`tax_id` is the merchant's official tax identifier (in Türkiye, the 10-digit *Vergi Kimlik Numarası*). It is stored as a **validated field**: an extracted value passes a check-digit verification before it is accepted, so an OCR misread or a hallucinated number is discarded rather than written. Together with `country`, a validated tax identifier gives a merchant a stable identity across name variants — the same chain printed as "MIGROS T.A.S." and "MIGROS A.S." resolves to one record.

Merchant matching layers three signals: a **recognised brand** (the chain's official spelling, resolved during extraction), the **validated tax identifier**, and normalised name matching. Brand takes precedence when present; the tax identifier confirms or establishes identity when the name is noisy.

Public merchant identity is **brand + city + country**. Any published surface — including the public price ledger — carries a merchant at exactly this granularity; store-level and address-level detail stays in the operational layer and is never published.

---
