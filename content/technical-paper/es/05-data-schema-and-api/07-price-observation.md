# Observación de precio (normativo)

## 5.6 Observación de precio (normativo)

La tabla de memoria de precios. Una fila por `(canonical_product_id, merchant_id, marca de tiempo de observación)`.

```json
// PriceObservation
{
  "observation_id": "01HXY...",
  "canonical_product_id": "cp.pinar.milk.1l",
  "merchant_id": "01HXY...",
  "chain_id": "chain.migros",
  "city": "Istanbul",
  "observed_at": "2026-05-17T14:23:11Z",
  "unit_price_minor": 2350,
  "currency": "TRY",
  "trust_score": "0.XX",
  "is_promotional": false
}
```

Esta es la tabla que alimenta:

1. **Memoria de precios del usuario** — "pagaste 23.50 TL por Pınar süt en Migros; la mediana esta semana es 22.10 TL."
2. **Índice de precios B2B** — agregado por `(canonical_product_id, región, semana)` con umbral de k-anonimato aplicado.
3. **Pulso de inflación** — índice de canasta de alta frecuencia computado nocturnamente.

Las filas por debajo de un piso de calidad ajustado en producción se escriben pero se excluyen de las computaciones de índice.

---
