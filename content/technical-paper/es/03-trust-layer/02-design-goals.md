# Objetivos de diseño

## 3.1 Objetivos de la capa de confianza

La capa de confianza optimiza cuatro propiedades en tensión.

| Objetivo | Qué significa | Por qué importa |
|---|---|---|
| **Los recibos honestos pasan rápido** | Un recibo doméstico genuino atraviesa la capa con bINT completo en la misma solicitud que genera la vista previa verificada. | Retención. Los usuarios honestos son la masa del protocolo; la fricción aquí reduce el MAU. |
| **La calidad de la recompensa está protegida** | El farming multi-cuenta coordinado, los recibos duplicados y las imágenes sintéticas se derivan a reducción, revisión o rechazo. | Seguridad económica. Cada bINT acuñado a partir de una carga abusiva erosiona el valor para cada usuario honesto. |
| **Los casos límite reciben una segunda mirada** | Los recibos que parecen inusuales pero plausibles ingresan a una cola de revisión para una segunda mirada. | Costo de falso positivo. Revisar un recibo genuino protege la confianza del usuario. |
| **El usuario se siente en control** | Un usuario puede ver por qué un recibo fue degradado o retenido y qué hacer al respecto. | Confianza. Una explicación clara preserva el ciclo de contribución. |

La capa equilibra estos cuatro objetivos con un modelo de puntuación calibrado en lugar de un conjunto de reglas rígidas; el modelo se reajusta según los resultados observados en lugar de quedar fijo en el momento del diseño.

## 3.2 Dónde se adhiere la confianza

La puntuación de confianza se ejecuta en dos granularidades:

1. **Nivel de recibo** — cada recibo que sale de la canalización (02 Etapa 6) se puntúa exactamente una vez antes del asentamiento de bINT. La re-puntuación es posible (por ejemplo, después de una apelación exitosa), pero cada versión reemplaza a la anterior.
2. **Nivel de usuario** — cada usuario tiene una instantánea de salud en rotación que refleja la calidad reciente de sus contribuciones. La salud cambia lentamente y está acotada, de modo que un solo recibo defectuoso tiene un efecto limitado en un historial largo y positivo.

La puntuación a nivel de recibo es sincrónica; la salud a nivel de usuario se recalcula en el nivel de procesamiento por lotes diario (01 §1.5).
