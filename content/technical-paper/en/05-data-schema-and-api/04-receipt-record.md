# Receipt record (normative)

## 5.3 Receipt record (normative)

The full lifecycle JSON. This is what reads of `/v1/receipts/{id}` return.

```json
// Receipt
{
  "receipt_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
  "user_id": "01HXY8K3F9A2QZ0M1B7N4PQR00",
  "wallet_address": "5Hg2...8fpA",
  "uploaded_at": "2026-05-17T14:23:11Z",
  "captured_at": "2026-05-17T14:21:00Z",
  "currency": "TRY",
  "merchant": {
    "merchant_id": "01HXY...",
    "chain_id": "chain.migros",
    "name_raw": "MIGROS T.A.S. ŞUBE 4521",
    "city": "Istanbul",
    "tax_id_hash": "sha256:7f3a..."
  },
  "totals": {
    "subtotal_minor": 23450,
    "tax_total_minor": 4221,
    "grand_total_minor": 27671,
    "currency": "TRY"
  },
  "tax_lines": [
    { "rate_pct": 18.0, "base_minor": 20000, "amount_minor": 3600 },
    { "rate_pct": 8.0,  "base_minor": 7750,  "amount_minor": 620  }
  ],
  "payment_method": "credit_card",
  "line_items": [
    {
      "line_item_id": "01HXY...01",
      "raw_text": "SUT 1L PINAR",
      "canonical_product_id": "cp.pinar.milk.1l",
      "qty": 2.0,
      "unit_price_minor": 2350,
      "line_total_minor": 4700,
      "tax_rate_pct": 8.0,
      "match_confidence": "0.XX"
    }
  ],
  "pipeline": {
    "document_reader_class": "receipt_ocr",
    "ocr_confidence": "0.XX",
    "extraction_route_class": "structured_receipt",
    "extraction_confidence": "0.XX",
    "rules_confidence": "0.XX",
    "self_consistency_check": false
  },
  "trust": {
    "score": "0.XX",
    "band": "<band>",
    "signals_present": ["total_reconciliation", "merchant_consistency"]
  },
  "rewards": {
    "bint_minor_credited": 12500,
    "bint_settled_at": null,
    "epoints_minor_recorded": 845,
    "statistics_only": false
  },
  "status": "verified",
  "schema_version": "1.0.0"
}
```

Confidence values and trust score are shown as placeholders. Production ranges, band boundaries, and signal weights are managed in the internal operations layer.

### Field conventions

| Convention | Rule |
|---|---|
| IDs | ULID (Crockford base-32, 26 chars). Time-ordered, sortable. |
| Currency amounts | Minor units (kuruş for TRY, cents for USD). Avoids float drift. |
| Timestamps | ISO 8601 with `Z` suffix. UTC always. |
| Hashes | `sha256:` prefix followed by lowercase hex. |
| Nullable | Missing fields use explicit `null`. |
| Status enum | `pending`, `verified`, `rejected`, `statistics_only`, `under_review`. |

### Status transitions

```
pending
   │
   ├──► verified  (passes trust gate)
   ├──► statistics_only  (e.g., order-page receipt with limited payment proof)
   ├──► under_review  (borderline trust, appeal queue)
   └──► rejected  (hard reject: anti-abuse signal, hand-written, synthetic image)
```

A `verified` receipt earns bINT. A `statistics_only` receipt is counted in the user's price memory and household statistics; aggregate and reward handling follows the 5.8 rules.

---
