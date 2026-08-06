# Receipt record (normative)

## 5.3 Receipt record (normative)

The receipt record as the application's own API returns it (session-authenticated reads under `/api/receipts`). Field names shown are representative of the stored record.

```json
// Receipt
{
  "receipt_id": "6f2b8c1e-4a7d-4f2b-9c41-0e5d8a3b7f10",
  "user": "yumo_user",
  "uploaded_at": "2026-05-17T14:23:11Z",
  "receipt_date": "2026-05-17",
  "currency": "TRY",
  "merchant": {
    "merchant_id": "f3b1c2d4-...",
    "display_name": "Migros",
    "city": "Istanbul",
    "tax_id": "6200278131"
  },
  "totals": {
    "subtotal": "234.50",
    "tax_total": "42.21",
    "grand_total": "276.71",
    "currency": "TRY"
  },
  "tax_lines": [
    { "rate_pct": 18.0, "base": "200.00", "amount": "36.00" },
    { "rate_pct": 8.0,  "base": "77.50",  "amount": "6.20"  }
  ],
  "payment_method": "credit_card",
  "document_type": "receipt",
  "is_payment_proof": true,
  "line_items": [
    {
      "raw_text": "SUT 1L PINAR",
      "canonical_product_id": "3f6a...-...",
      "qty": 2.0,
      "unit_price": "23.50",
      "line_total": "47.00",
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
    "bint_credited": "125.00",
    "reward_epoch": null
  },
  "status": "verified",
  "proof_status": null,
  "linked_receipt_id": null
}
```

Confidence values and trust score are shown as placeholders. Production ranges, band boundaries, and signal weights are managed in the internal operations layer.

### Field conventions

| Convention | Rule |
|---|---|
| IDs | UUID primary keys for receipts and merchants; serial integer ids on event and ledger tables. |
| Currency amounts | Decimal values, serialised as canonical decimal strings (2 dp for money). |
| Timestamps | ISO 8601 with `Z` suffix. UTC always. |
| Hashes | Lowercase hex, algorithm named by the field's context. |
| Nullable | Missing fields use explicit `null`. |
| Status enum | `verified`, `saved`, `analyzed`. |

### Status and payment-proof handling

Live status values:

```
analyzed  — pipeline output produced, not yet persisted as a kept record
saved     — kept by the user
verified  — passed the verification gates; eligible for rewards and the aggregate layer
```

Documents with limited payment proof (an order page, for example) are handled by a **separate field pair**, not by a status value: `proof_status` marks the record as awaiting payment proof, and `linked_receipt_id` points to the payment-proof document that resolves it once the user uploads one. Such records are computed into the user's own statistics but earn no reward and stay out of the anonymised aggregate.

A manual review flow for borderline cases is planned; it is not part of the live status set.

A `verified` receipt earns bINT. Aggregate handling of non-verified records follows the 5.8 rules.

---
