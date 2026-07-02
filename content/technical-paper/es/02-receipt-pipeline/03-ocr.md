# Etapa 1 — Lectura de documentos

## 2.4 Etapa 1 — Capa de lectura de documentos

Esta etapa extrae bloques de texto, orden de lectura e información de posición a partir de una imagen de recibo o una entrada PDF. El contrato público es la salida normalizada del etapa, no el nombre del proveedor.

### Normalización de salida

Los motores de lectura de documentos pueden devolver estructuras diferentes. El canal las normaliza a una forma interna única:

```json
// DocumentReadResult
{
  "raw_text": "MIGROS\nFIS NO: 4521\n...",
  "blocks": [
    {
      "text": "MIGROS",
      "bbox": { "x": 120, "y": 40, "w": 200, "h": 50 },
      "confidence_band": "high",
      "reading_order": 0
    }
  ],
  "quality_band": "high",
  "detected_languages": ["tr"],
  "page_count": 1
}
```

Los bloques se ordenan según el orden de lectura y se pasan a la siguiente etapa como entrada determinista. Por tanto, la extracción del modelo no está acoplada a ninguna forma de respuesta bruta del proveedor.

### Señal de calidad

La etapa de lectura de documentos transporta bandas de calidad y categorías de error a etapas posteriores. En casos de baja calidad, el canal puede reprocesar, solicitar una nueva imagen al usuario o continuar con menor confianza según la política operativa.

Esto preserva el contrato técnico público mientras evita detalles de umbrales y comportamientos de contingencia que serían fáciles de ingeniería inversa.
