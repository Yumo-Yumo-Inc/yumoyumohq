# Superficie de API

## 5.10 Superficie de API

### Actual: rutas de aplicación

La API activa es la superficie de rutas de la propia aplicación: **rutas autenticadas por sesión bajo `/api/*` en `yumoyumo.com`**, servidas por la misma implementación de Next.js que el producto. La autenticación es la sesión del usuario; no hay credencial de desarrollador separada hoy.

| Método | Ruta | Propósito | Autenticación |
|---|---|---|---|
| POST | `/api/receipt/upload` | Cargar una imagen de recibo | Sesión |
| POST | `/api/receipt/analyze` | Ejecutar el canal en una carga | Sesión |
| GET  | `/api/receipts` | Listar los recibos del usuario | Sesión (solo propio) |
| GET  | `/api/receipts/{id}` | Obtener un registro de recibo | Sesión (solo propio) |
| GET  | `/api/wallet/summary` | Saldo de puntos e historial | Sesión |
| GET  | `/api/prices/epoch/{epoch}` | Datos de época de precios públicos: metadatos de época, páginas de observaciones y pruebas de inclusión de Merkle (`?proof=<leaf_hash>`) | Público |
| GET  | `/api/prices/product/{productId}` | Historial de precios públicos para un producto del catálogo | Público |

Las rutas del libro mayor de precios son la superficie de lectura pública hoy: cualquiera puede obtener una época sellada, extraer sus observaciones y solicitar una prueba de inclusión que se pliegue a la raíz on-chain. Los manifiestos de Arweave publicados proporcionan los mismos datos independientemente de estas rutas.

### Planificado: API REST pública versionada

Una API REST pública versionada para aplicaciones de terceros es **trabajo futuro planificado**. El esbozo de diseño: una base `/v1` en `yumoyumo.com`, autorización delegada basada en estándares para clientes de terceros, endpoints de estilo de recurso de recibo y recompensa, y suscripciones a eventos para cambios de estado (recibo verificado, recompensa acreditada, época sellada). La superficie concreta se especificará cuando se abra el programa de desarrolladores; las rutas de aplicación anteriores son el contrato hasta entonces.

---
