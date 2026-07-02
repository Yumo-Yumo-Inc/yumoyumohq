# Puntuación de confianza

## 3.3 Puntuación de confianza por recibo

La puntuación de confianza de un recibo es un número en `[0, 1]` derivado de una combinación ponderada de señales. Más alto es mejor. La puntuación se escribe en el registro del recibo (véase 05 §5.3) junto con la lista de señales que contribuyeron.

### Familias de señales

La puntuación se basa en cuatro familias de señales. Cada familia produce una o más señales individuales; la capa las compone en la puntuación final.

| Familia | Qué observa |
|---|---|
| **Confianza de la canalización** | Qué tan confiado estaba el canal ascendente en la extracción (confianza OCR, confianza LLM, reconciliación de la capa de reglas). |
| **Consistencia del comerciante** | Si el comerciante, la sucursal y la plantilla del recibo coinciden con lo que hemos visto antes de este comerciante. |
| **Plausibilidad temporal** | Si la fecha, hora del recibo y el patrón de carga del usuario son consistentes con el comportamiento normal. |
| **Historial del usuario** | La calidad reciente de las contribuciones del usuario, limitada a una ventana móvil. |

Dentro de cada familia, las señales individuales se registran con su valor observado y una bandera de contribución (`signal_used` / `signal_skipped`). La ponderación exacta, los umbrales de familia y las reglas de omisión se gestionan en la capa de operaciones internas.

### Bandas de puntuación

La puntuación final se agrupa en bandas para uso posterior:

- **Alta** — el recibo se liquida con crédito bINT completo.
- **Media** — el recibo se liquida con crédito bINT reducido. El usuario ve la vista previa verificada y la cantidad de bINT; sin fricción.
- **Baja** — el recibo se retiene para revisión (véase 3.7). Se le informa al usuario que se está verificando.
- **Rechazo** — el recibo ingresa al estado rechazado. El usuario ve una categoría de motivo en lenguaje sencillo.

Los límites de las bandas se calibran periódicamente contra los resultados observados y se gestionan en la capa de operaciones internas.

## 3.4 Qué lleva el registro del recibo

El bloque de confianza del recibo enumera las familias de señales que contribuyeron y la banda resultante. Los valores de señal individuales, los pesos y la puntuación residen en la configuración interna de confianza. La superficie orientada al usuario comunica el **resultado** (cantidad de bINT, retención, rechazo) y la **categoría de motivo** cuando sea relevante.

Esto es intencional: las bandas públicas proporcionan claridad sobre el resultado, mientras que las puntuaciones internas preservan la superficie de calibración.
