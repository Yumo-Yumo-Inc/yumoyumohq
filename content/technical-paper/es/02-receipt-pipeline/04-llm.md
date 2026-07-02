# Etapa 2 — Extracción estructurada

## 2.5 Etapa 2 — Extracción estructurada

Esta etapa convierte la salida de lectura de documentos en un objeto `ReceiptExtraction`. El contrato público es el esquema y el comportamiento de la etapa; los proveedores de modelos, el texto de los prompts, la política de enrutamiento, los presupuestos de tokens y las condiciones de reintento se gestionan en la capa operativa interna.

### Frontera de enrutamiento de modelos

Yumo Yumo ejecuta la extracción estructurada detrás de una interfaz independiente del modelo. La política operativa puede elegir el motor apropiado según el idioma, la complejidad del documento, el estado de salud y las señales de calidad. Los pesos, el ordenamiento y el comportamiento de contingencia de esa política permanecen privados.

### Salida estructurada

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

El esquema reduce la salida del modelo a una forma que la capa de reglas puede validar. Los totales, la fecha, la moneda, los artículos de línea y los campos fiscales se vuelven a comprobar en la siguiente etapa.

### Manejo de consistencia

Si la extracción lleva una banda de baja calidad o la capa de reglas encuentra inconsistencia, el canal puede enviar el resultado a revisión o reprocesamiento. La selección de ruta se gestiona mediante parámetros operativos.
