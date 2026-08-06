# Puntuación de confianza

## 3.3 Calidad por recibo y confianza por usuario

La confianza se registra en dos capas conectadas. Cada recibo que sale de la canalización recibe una **evaluación de calidad**: la capa comprueba qué tan completo es el registro extraído (comerciante, fecha, hora, totales, líneas de detalle) y si los importes del recibo se reconcilian internamente. La evaluación se resuelve en un nivel de calidad para el recibo. Ese nivel alimenta después una **posición de confianza acumulativa por usuario**, actualizada de forma sincrónica en la misma pasada de procesamiento: un flujo de recibos limpios y completos eleva la posición con el tiempo; las cargas de baja calidad o inconsistentes la frenan o la revierten. Los sistemas posteriores consumen la posición como niveles en lugar de valores brutos.

### Familias de señales

La evaluación de calidad en la versión actual se basa en la **completitud del registro** y la **reconciliación de importes**, junto con la detección de duplicados (3.9). Las siguientes familias de señales extienden el modelo y son **planificadas**; no están activas en la versión actual:

| Familia (planificada) | Qué observa |
|---|---|
| **Confianza de la canalización** | Qué tan confiado estaba el canal ascendente en la extracción (confianza OCR, confianza LLM, reconciliación de la capa de reglas). |
| **Consistencia del comerciante** | Si el comerciante, la sucursal y la plantilla del recibo coinciden con lo que hemos visto antes de este comerciante. |
| **Plausibilidad temporal** | Si la fecha, hora del recibo y el patrón de carga del usuario son consistentes con el comportamiento normal. |
| **Historial del usuario** | La calidad reciente de las contribuciones del usuario, limitada a una ventana móvil. |

La composición exacta de la puntuación, los límites entre niveles y los efectos por nivel se gestionan en la capa de operaciones internas.

### Niveles de calidad

La evaluación por recibo se resuelve en un conjunto ordenado de niveles de calidad. Los niveles superiores reflejan recibos completos e internamente consistentes y refuerzan más la posición de confianza del usuario; los niveles inferiores reflejan registros escasos o inconsistentes y contribuyen menos. Las definiciones de los niveles y sus efectos exactos se calibran en producción y no se publican.

## 3.4 Qué lleva el registro del recibo

El bloque de calidad del recibo registra el nivel evaluado y las observaciones de completitud que lo produjeron. Los límites entre niveles y los efectos por nivel residen en la configuración interna de confianza. La superficie orientada al usuario comunica el **resultado** (cantidad de bINT, rechazo) y la **categoría de motivo** cuando sea relevante.

Esto es intencional: los resultados públicos proporcionan claridad, mientras que los valores internos de calibración preservan la superficie de calibración.
