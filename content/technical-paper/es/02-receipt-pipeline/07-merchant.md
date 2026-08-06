# Etapa 5 — Comerciante

## 2.8 Etapa 5 — Resolución de comerciante

Cada recibo se asigna a un `merchant_id`. La resolución de comerciante se ejecuta en el **flujo sincrónico**, de modo que la vista previa verificada ya lleva el comerciante resuelto. La resolución es una cascada de prioridad por capas — cada capa se ejecuta solo cuando la anterior no produjo coincidencia:

1. **Identificador fiscal** — el ID fiscal impreso (VKN en Türkiye) se valida con su algoritmo de dígito de control y se busca en la tabla maestra de comerciantes. Un ID fiscal válido es una coincidencia directa de identidad.
2. **Marca reconocida** — cuando la etapa de extracción reconoció una marca de cadena conocida, la forma oficial de la marca se resuelve directamente al comerciante de la cadena.
3. **Anclas de patrón** — patrones de texto aprendidos por comerciante se comparan con el nombre normalizado del comerciante, eliminando los prefijos de saludo antes de la comparación.
4. **Ubicación** — las señales de dirección acotan los candidatos cuando la evidencia del nombre por sí sola es ambigua.
5. **Coincidencia difusa** — similitud del nombre normalizado contra los candidatos de comerciante existentes.
6. **Autocreación** — cuando ninguna capa coincide, una ruta con límite de tasa crea un nuevo registro de comerciante, que entra en la cola de verificación.

Los ajustes de similitud de la cascada se gestionan en la capa de operaciones internas.

### Mapeo de cadenas

Un comerciante resuelto a una cadena conocida (BIM, A101, Migros, ŞOK) recibe un `chain_id`. Las cadenas impulsan dos elementos:

- **Agregación entre sucursales** para el producto de datos B2B (precios de canasta en "Migros a nivel nacional").
- **Enriquecimiento geográfico** — cuando el usuario da su consentimiento, la dirección de la sucursal se enriquece con ciudad/región desde la tabla maestra de comerciantes.

### Enriquecimiento geográfico (solo con consentimiento)

Si el usuario habilitó el uso compartido de ubicación, el recibo se etiqueta con la ciudad/región resuelta. El sistema usa geografía a nivel de ciudad. Esto satisface el compromiso de privacidad del capítulo 08 y el requisito de k-anonimato del producto de datos B2B del capítulo 05.

### Comerciante desconocido

Si ninguna capa resuelve y la autocreación se rechaza, el recibo se escribe con `merchant_id = null` y se conserva `merchant_raw_name`. El scoring de confianza (03) trata al comerciante desconocido como una señal negativa leve. Los comerciantes sin coincidencia se revisan mediante la cola de verificación del panel de administración.

---
