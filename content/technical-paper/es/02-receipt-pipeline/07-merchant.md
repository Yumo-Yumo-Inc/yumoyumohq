# Etapa 5 — Comerciante

## 2.8 Etapa 5 — Resolución de comerciante

Cada recibo se asigna a un `merchant_id`. La huella utiliza un modelo multi-señal ponderado. Las señales incluyen el identificador fiscal, el nombre normalizado del comerciante, el fragmento de dirección y la huella de la plantilla del recibo. El conjunto de señales y los pesos se gestionan en la capa operativa interna.

### Mapeo de cadenas

Un comerciante resuelto a una cadena conocida (BIM, A101, Migros, ŞOK) obtiene un `chain_id`. Las cadenas impulsan dos cosas:

- **Agregación entre sucursales** para el producto de datos B2B (precios de canasta en «Migros a nivel nacional»).
- **Enriquecimiento geográfico** — cuando el usuario acepta, la dirección de la sucursal se enriquece con ciudad/región de la tabla maestra de comerciantes.

### Enriquecimiento geográfico (solo con opt-in)

Si el usuario habilitó el uso compartido de ubicación, el recibo se etiqueta con la ciudad/región resuelta. El sistema utiliza geografía a nivel de ciudad. Esto satisface el compromiso de privacidad en 08 y el requisito de k-anonimato del producto de datos B2B en 05.

### Comerciante desconocido

Si la huella se resuelve en la cola de comerciantes, el recibo se escribe con `merchant_id = null` y se conserva `merchant_raw_name`. El puntaje de confianza (03) trata al comerciante desconocido como una señal negativa leve. La cola de comerciantes se vacía de la misma forma que la cola de canonización.

---
