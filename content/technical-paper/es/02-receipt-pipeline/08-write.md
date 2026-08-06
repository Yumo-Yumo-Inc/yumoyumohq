# Etapa 6 — Escritura

## 2.9 Etapa 6 — Escritura de salida

La escritura se divide entre el flujo sincrónico y el worker de post-procesamiento en segundo plano.

**Escritura sincrónica.** Cuando el recibo supera la validación, el flujo sincrónico inserta la fila de `receipts` junto con el registro bruto de extracción por visión. Este es el estado desde el que se sirve la vista previa verificada: el recibo del usuario existe en la base de datos en el momento en que aparece la vista previa.

**Escritura asíncrona.** El worker de post-procesamiento en segundo plano completa después el registro:

- `receipt_line_items` — las líneas de artículos se escriben después de la resolución canónica de productos (2.7), de modo que cada fila lleva su referencia canónica.
- `receipt_rewards` — el asiento contable de recompensa, incluido el desglose de puntos que se muestra al usuario.
- `receipt_quality` — la evaluación de calidad que lee la capa de confianza (03).

**Observaciones de precios.** Las observaciones de precios las produce un flujo diario separado de épocas de precios que lee los recibos verificados, agrega las observaciones por época y compromete la raíz de la época en cadena en el nivel asíncrono (01 Fase B). Se derivan de las filas de recibos en lugar de ser escritas por el propio canal de recibos.

Los flujos posteriores — scoring de confianza, liquidación de recompensas, el libro mayor de precios — leen directamente las filas de recibo y calidad. Las escrituras son idempotentes sobre el identificador del recibo: seguras ante repeticiones si el worker reintenta.

---
