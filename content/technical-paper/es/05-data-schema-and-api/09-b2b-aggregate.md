# Agregado anonimizado y el producto de datos B2B

## 5.8 Agregado anonimizado y el producto de datos B2B

Esta es la superficie que genera ingresos B2B y opera bajo garantías estrictas de privacidad.

### Reglas de transformación

La transformación de `receipts + line_items + price_observations` a agregado anonimizado es **unidireccional y destructiva**:

1. **Reemplazar user_id y wallet_address.** Usar un hash de ámbito de sesión separado de los identificadores de usuario.
2. **Agregar geografía.** Solo granularidad a nivel de ciudad; las coordenadas se eliminan si alguna vez se registraron.
3. **Agregar tiempo.** Cubo diario para índices de alta frecuencia; cubo semanal para reportes a nivel de categoría; mensual para cohortes demográficas.
4. **Aplicar k-anonimato.** Cada registro liberado debe pertenecer a una celda con al menos un número mínimo definido contractualmente de contribuidores distintos en los campos cuasi-identificadores (`city`, `merchant_class`, `time_bucket`, `category_path`). Las celdas por debajo del umbral se suprimen o agregan hasta pasar.
5. **Añadir ruido de privacidad diferencial calibrado** a las salidas basadas en conteo.
6. **Construir ámbito agregado desde PoE verificado.** Los recibos de página de pedido y otros registros pendientes de verificación permanecen en la capa de memoria.

### Productos disponibles

| Producto | Granularidad | Actualización | Precio indicativo |
|---|---|---|---|
| **TR Inflation Pulse** | Categoría × región × semana | Diaria | $X / mes (suscripción) |
| **Basket Panel** | Producto canónico × ciudad × semana | Diaria | $Y / mes |
| **Merchant Benchmarks** | Cadena × categoría × mes | Semanal | $Z / mes |
| **Custom Cohort Query** | API por consulta, umbral de k-anonimato aplicado | Bajo demanda | $Q / consulta |

Los precios y las granularidades exactas son marcadores de posición; el catálogo de producción se finalizará antes del lanzamiento comercial.

### Ejemplo de respuesta B2B

```json
// GET /b2b/v1/inflation-pulse?region=istanbul&category=food.dairy&from=2026-05-01&to=2026-05-17
{
  "region": "istanbul",
  "category": "food.dairy",
  "series": [
    { "week_start": "2026-05-04", "index": 100.0, "n_observations": "<n>", "n_distinct_contributors": "<n>" },
    { "week_start": "2026-05-11", "index": 101.7, "n_observations": "<n>", "n_distinct_contributors": "<n>" }
  ],
  "k_anonymity_floor_met": true,
  "methodology_version": "1.0.0"
}
```

Cada respuesta B2B lleva `n_distinct_contributors` para que el comprador pueda auditar que se cumplió el piso de k-anonimato. Las celdas que habrían caído por debajo del piso se devuelven como `suppressed: true` sin valores. El valor específico del umbral se gestiona en la capa operativa interna.

### Campos fuera de alcance

- Cualquier campo vinculado a un único usuario.
- Cualquier registro por debajo del umbral de k-anonimato para la celda consultada.
- Coordenadas, direcciones, números de teléfono.
- Metadatos de instrumento de pago.
- IDs anonimizados pero vinculables entre consultas (cada consulta genera un nuevo hash de sesión).

### Comparación contra paneles existentes

El producto de datos B2B de Yumo Yumo compite contra Nielsen, GfK, Kantar y SimilarWeb para los mismos compradores. Comparado con esos paneles:

- **A nivel de recibo**, no de encuesta-recuerdo — menos artefactos de error de medición.
- **Mayor frecuencia de actualización** — diaria vs. semanal/mensual.
- **Cobertura de mercados emergentes** — TR primero; la cobertura de TR es la más delgada entre los incumbentes.
- **Menor costo por registro** — el panel se construye a partir de la actividad de usuario existente, no de panelistas pagados.

La compensación: el panel de Yumo Yumo es más pequeño al lanzamiento y sesgado hacia la demografía de adoptantes tempranos.

---
