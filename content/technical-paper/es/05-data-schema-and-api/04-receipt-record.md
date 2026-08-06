# Registro de recibo (normativo)

## 5.3 Registro de recibo (normativo)

El registro de recibo tal como lo devuelve la API propia de la aplicación (lecturas autenticadas por sesión bajo `/api/receipts`). Los nombres de campo mostrados son representativos del registro almacenado.

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

Los valores de confianza y la puntuación de confianza se muestran como marcadores de posición. Los rangos de producción, los límites de banda y los pesos de señales se gestionan en la capa operativa interna.

### Convenciones de campo

| Convención | Regla |
|---|---|
| IDs | Claves primarias UUID para recibos y comerciantes; ids enteros seriales en las tablas de eventos y libro mayor. |
| Cantidades de moneda | Valores decimales, serializados como cadenas decimales canónicas (2 decimales para dinero). |
| Marcas de tiempo | ISO 8601 con sufijo `Z`. Siempre UTC. |
| Hashes | Hex en minúsculas, algoritmo nombrado por el contexto del campo. |
| Anulable | Los campos ausentes usan `null` explícito. |
| Enum de estado | `verified`, `saved`, `analyzed`. |

### Manejo de estado y de prueba de pago

Valores de estado en vivo:

```
analyzed  — salida de la canalización producida, aún no persistida como registro conservado
saved     — conservado por el usuario
verified  — pasó las puertas de verificación; elegible para recompensas y la capa agregada
```

Los documentos con prueba de pago limitada (una página de pedido, por ejemplo) se manejan con un **par de campos separado**, no con un valor de estado: `proof_status` marca el registro como a la espera de prueba de pago, y `linked_receipt_id` apunta al documento de prueba de pago que lo resuelve una vez que el usuario sube uno. Tales registros se computan en las estadísticas propias del usuario pero no ganan recompensa y quedan fuera del agregado anonimizado.

Un flujo de revisión manual para casos límite está planificado; no forma parte del conjunto de estados en vivo.

Un recibo `verified` gana bINT. El manejo agregado de los registros no verificados sigue las reglas 5.8.

---
