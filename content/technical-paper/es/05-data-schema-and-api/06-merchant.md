# Comerciante (normativo)

## 5.5 Comerciante (normativo)

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

`tax_id` es el identificador fiscal oficial del comerciante (en Türkiye, el *Vergi Kimlik Numarası* de 10 dígitos). Se almacena como un **campo validado**: un valor extraído pasa una verificación de dígito de control antes de ser aceptado, de modo que una lectura errónea del OCR o un número alucinado se descarta en lugar de escribirse. Junto con `country`, un identificador fiscal validado da al comerciante una identidad estable a través de las variantes de nombre — la misma cadena impresa como "MIGROS T.A.S." y "MIGROS A.S." se resuelve a un único registro.

La coincidencia de comerciantes superpone tres señales: una **marca reconocida** (la escritura oficial de la cadena, resuelta durante la extracción), el **identificador fiscal validado** y la coincidencia de nombre normalizada. La marca tiene precedencia cuando está presente; el identificador fiscal confirma o establece la identidad cuando el nombre es ruidoso.

La identidad pública del comerciante es **marca + ciudad + país**. Cualquier superficie publicada — incluido el libro público de precios — lleva un comerciante exactamente en esta granularidad; el detalle a nivel de tienda y de dirección permanece en la capa operativa y nunca se publica.

---
