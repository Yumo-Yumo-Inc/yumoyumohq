# Observabilidad y calibración

## 3.14 Qué publica la capa de confianza para sí misma

Cada recibo que pasa por la capa emite un registro en un flujo interno de observabilidad. El registro contiene:

- La banda de confianza asignada y la lista de familias de señales que contribuyeron.
- Si el recibo fue retenido, rechazado o acreditado (completo / reducido).
- Para recibos retenidos, la acción final del revisor y el tiempo hasta la decisión.
- Para recibos acreditados, la salud y el nivel del usuario en el momento del crédito.

Este flujo alimenta tres vistas:

1. **Panel de salud de la capa** — distribución de bandas a lo largo del tiempo, profundidad de la cola de retención, tiempo hasta decisión, tasa de anulación del revisor.
2. **Vista de calibración** — distribuciones emparejadas de banda de confianza y resultado descendente observado (por ejemplo, ¿un recibo de banda "alta" fue marcado posteriormente por una señal diferente?).
3. **Pulso de abuso** — distribución de tamaños de clúster, tasa de emergencia de nuevos patrones, geografía de casos retenidos.

## 3.15 Cadencia de calibración

La capa se recalibra en una cadencia regular. El paso de calibración:

- Revisa la tasa de anulación del revisor por banda y por familia de señales.
- Detecta la deriva en las distribuciones de señales (una señal cuya distribución ha cambiado es una señal que puede necesitar reponderación).
- Repondera señales y ajusta los límites de banda contra la ventana más reciente de resultados observados.

La calibración es propiedad del equipo del protocolo en la fase actual. A medida que el modelo operativo se descentraliza (véase 00 §0.2), la recalibración pasa a un proceso gobernado documentado en *Vision Paper — Closing Thesis*.

## 3.16 Qué queda fuera del panel

Los paneles son internos. Agregan por banda, familia de señales, geografía y tiempo. Los datos identificables residen en el almacén de recibos (05 §5.3) y se accede a ellos bajo los controles operacionales descritos allí.

Los parámetros de calibración — los pesos producidos por cada paso de calibración — residen en el almacén de configuración de producción y se rotan a medida que la capa se reajusta.

---

## Referencias cruzadas

- Definiciones de esquema (`trust_scores`, `health_snapshots`, `levels`) → 05 Esquema de datos y API
- Enumeración de estado del recibo y ciclo de vida → 05 §5.3
- Cálculo del techo diario en términos tokenómicos → 04 Mecánicas tokenómicas
- Riesgos operacionales para la capa de confianza (escala del revisor, retraso en la evolución del abuso) → 08 Riesgos y mitigaciones
