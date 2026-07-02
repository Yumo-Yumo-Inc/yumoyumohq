# Riesgo de producto y canalización

## 8.11 Superficie

La canalización de recibos (02) es la superficie de ingesta de datos del protocolo. El riesgo se agrupa alrededor de la calidad de lectura de documentos, la extracción estructurada, la capa de reglas y la escritura de registro.

| Superficie | Impacto técnico | Principio de control público |
|---|---|---|
| Continuidad de lectura de documentos | El procesamiento de recibos se retrasa o encola | Adaptador agnóstico de proveedor y visibilidad de estado |
| Calidad de salida | La salida OCR / LLM puede conflicto con el esquema | Validación de reglas y coincidencia canónica |
| Costo unitario | El costo de procesamiento afecta el margen del producto de datos | Seguimiento de costo operativo y vinculación al modelo económico |
| Intento de abuso | Recibos falsos, duplicados o manipulados presionan el rail de contribución | Retroalimentación de la capa de confianza y estado de decisión |

## 8.12 Modelo de control

El diseño de la canalización funciona a través de una interfaz agnóstica de proveedor para el procesamiento de documentos. Las salidas OCR y LLM se normalizan al esquema canónico; la capa de reglas verifica consistencia de campos, coincidencia de comerciante, plausibilidad de fecha-monto y señales de duplicado (02 §2.5-§2.7).

Los recibos ambiguos se conectan a la capa de confianza y al flujo de revisión. El modelo de estado visible para el usuario muestra en qué etapa está un recibo y qué rail produjo la decisión de recompensa (02 §2.9).

La selección de proveedor, el orden de enrutamiento, los umbrales y los valores de límite de tasa se gestionan en la capa operativa interna. El documento técnico público proporciona el contrato de implementación: registro de recibo normalizado, entrada de puntuación de confianza y salida de libro mayor bINT.

## 8.13 Evolución

A medida que la canalización madura, los conjuntos de reglas, la cobertura de productos canónicos y las señales de monitoreo de calidad se expanden a través de lanzamientos versionados. A medida que avanza el plan de localización, la configuración de la canalización se conecta a la misma disciplina de gobernanza que la tesorería y la migración de autoridad.
