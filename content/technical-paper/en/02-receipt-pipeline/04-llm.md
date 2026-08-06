# Stage 2 — Structured extraction

## 2.5 Stage 2 — Structured extraction

This stage converts the document into structured receipt fields. The public contract is the field set and stage behavior; model providers, prompt text, routing policy, token budgets, and retry conditions are managed in the internal operations layer.

### Model-routing boundary

Yumo Yumo runs structured extraction behind a model-independent interface. Operational policy can choose the appropriate engine based on language, document complexity, health state, and quality signals. The ordering and fallback behavior of that policy remain private.

### Structured output — labeled plain text

The model returns **labeled plain-text fields**, one field per line, rather than a JSON object. JSON output from language models introduces a parse-failure class of its own — unescaped control characters, unclosed brackets, stray commas — where a single malformed character invalidates the entire response. Labeled lines degrade gracefully: a missing or malformed line leaves one field empty while every other field still parses.

Header fields arrive inside a delimited block:

```
document_type: receipt
merchant_legal_name: MIGROS TICARET A.S.
merchant_display_name: MIGROS
receipt_date: 2026-05-17
currency: TRY
total_paid: 276.71
total_vat: 42.21
payment_method: visa
...
```

Line items arrive as a **pipe-separated table** with a fixed column order:

```
LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | SUT 1L | PINAR | 2 | adet | 23.50 | 47.00 | 0.01
2 | ...
```

The field set covers merchant identity (legal name, display name, recognized brand, tax identifier, address parts), document metadata (type, date, time, receipt number, country, currency), totals and tax, payment method and payment proof, and the line-item table.

### Defensive parsing

The parser treats every field independently: a missing field becomes `null`, a malformed value becomes `null`, and a broken line-item row is logged and skipped. Parsing never throws — the pipeline continues with whatever fields were recovered, and the rules layer (2.6) verifies totals, date, currency, line items, and tax fields against the receipt text.

### Consistency handling

If extraction carries a low quality signal or the rules layer finds inconsistency, the pipeline can send the result to review or reprocessing. Path selection is managed through operational parameters.
