# Registro de recibo (normativo)

## 5.3 Registro de recibo (normativo)

El JSON de ciclo de vida completo. Esto es lo que devuelven las lecturas de `/v1/receipts/{id}`.

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

Los valores de confianza y la puntuación de confianza se muestran como marcadores de posición. Los rangos de producción, los límites de banda y los pesos de señales se gestionan en la capa operativa interna.

### Convenciones de campo

| Convención | Regla |
|---|---|
| IDs | ULID (Crockford base-32, 26 caracteres). Ordenados por tiempo, ordenables. |
| Cantidades de moneda | Unidades menores (kuruş para TRY, centavos para USD). Evita la deriva de float. |
| Marcas de tiempo | ISO 8601 con sufijo `Z`. Siempre UTC. |
| Hashes | Prefijo `sha256:` seguido de hex en minúsculas. |
| Anulable | Los campos ausentes usan `null` explícito. |
| Enum de estado | `pending`, `verified`, `rejected`, `statistics_only`, `under_review`. |

### Transiciones de estado

```
pending
   │
   ├──► verified  (pasa la puerta de confianza)
   ├──► statistics_only  (p. ej., recibo de página de pedido con prueba de pago limitada)
   ├──► under_review  (confianza límite, cola de apelaciones)
   └──► rejected  (rechazo duro: señal antiabuso, manuscrito, imagen sintética)
```

Un recibo `verified` gana bINT. Un recibo `statistics_only` se cuenta en la memoria de precios y las estadísticas del hogar del usuario; el manejo agregado y de recompensas sigue las reglas 5.8.

---
