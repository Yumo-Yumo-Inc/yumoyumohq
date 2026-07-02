# Indexación y particionamiento

## 5.12 Indexación y particionamiento

`receipts` y `receipt_line_items` se particionan por mes de `uploaded_at`. La ventana de producto activo permanece en la capa de datos caliente; las particiones más antiguas pasan a una capa de análisis de menor costo. Clases de índice activas:

| Tabla | Índice | Uso |
|---|---|---|
| `receipts` | `(user_id, uploaded_at DESC)` | Listar recibos del usuario |
| `receipts` | `(merchant_id, uploaded_at DESC)` | Cola de comerciantes |
| `receipt_line_items` | `(canonical_product_id, uploaded_at DESC)` | Observaciones de precio |
| `price_observations` | `(canonical_product_id, observed_at)` | Pulso de inflación |
| `canonical_products` | `embedding_vector` (vecino más cercano aproximado) | Coincidencia Etapa 4 |
| `bint_ledger` | `(user_id, created_at DESC)` | Consultas de saldo |

El índice vectorial es el más caro de reconstruir y es el factor limitante en el crecimiento del catálogo canónico — 02 2.7 lo enumera como una palanca de costo. El motor de indexación específico y los parámetros de ajuste se gestionan en la capa operativa interna.

---
