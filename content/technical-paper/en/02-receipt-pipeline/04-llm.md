# Stage 2 — Structured extraction

## 2.5 Stage 2 — Structured extraction

This stage converts the document-reading output into a `ReceiptExtraction` object. The public contract is the schema and stage behavior; model providers, prompt text, routing policy, token budgets, and retry conditions are managed in the internal operations layer.

### Model-routing boundary

Yumo Yumo runs structured extraction behind a model-independent interface. Operational policy can choose the appropriate engine based on language, document complexity, health state, and quality signals. The weights, ordering, and fallback behavior of that policy remain private.

### Structured output

```json
// ReceiptExtraction
{
  "merchant": {
    "name_raw": "MIGROS T.A.S.",
    "tax_id_raw": "1234567890",
    "address_raw": "...",
    "phone_raw": null
  },
  "captured_at_raw": "17/05/2026 14:23",
  "currency": "TRY",
  "totals": {
    "subtotal": 234.50,
    "tax_total": 42.21,
    "grand_total": 276.71
  },
  "tax_lines": [
    { "rate_pct": 18.0, "base": 200.0, "amount": 36.0 },
    { "rate_pct": 8.0, "base": 77.50, "amount": 6.20 }
  ],
  "payment_method": "credit_card",
  "line_items": [
    {
      "raw_text": "SUT 1L PINAR",
      "qty": 2,
      "unit_price": 23.50,
      "line_total": 47.00,
      "tax_rate_pct": 8.0
    }
  ],
  "quality_band": "medium",
  "extraction_notes": "tax_total reconstructed from tax_lines"
}
```

The schema reduces model output into a form that the rules layer can validate. Totals, date, currency, line items, and tax fields are checked again in the next stage.

### Consistency handling

If extraction carries a low quality band or the rules layer finds inconsistency, the pipeline can send the result to review or reprocessing. Path selection is managed through operational parameters.
