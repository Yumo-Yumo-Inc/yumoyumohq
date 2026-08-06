# Objetivos de diseño

## 3.1 Objetivos de la capa de confianza

La capa de confianza optimiza cuatro propiedades en tensión.

| Objetivo | Qué significa | Por qué importa |
|---|---|---|
| **Los recibos de bajo riesgo no esperan** | Un recibo con señales de verificación suficientes recibe una vista previa y un resultado de elegibilidad sin revisión manual. | La cola de revisión se reserva para registros ambiguos o contradictorios. |
| **Se limita el crédito no elegible** | Las señales de multicuentas, recibos duplicados e imágenes sintéticas se derivan a reducción, revisión o rechazo. | Los créditos no elegibles distorsionan la contabilidad de recompensas y los techos de distribución. |
| **Los casos límite se revisan de nuevo** *(planificado)* | Los recibos que parecen inusuales pero plausibles ingresan a una cola de revisión para una segunda evaluación. La cola de revisión es un mecanismo planificado; la versión actual resuelve cada recibo de forma automática. | Los rechazos incorrectos requieren una segunda evaluación y una vía de apelación. |
| **Las decisiones y opciones son claras** | El usuario puede ver por qué un recibo fue degradado o retenido y qué opciones están disponibles. | El usuario puede entender los siguientes pasos, como volver a cargar o apelar. |

La capa equilibra estos cuatro objetivos con un modelo de puntuación calibrado en lugar de un conjunto de reglas rígidas; el modelo se reajusta según los resultados observados en lugar de quedar fijo en el momento del diseño.

## 3.2 Dónde se adhiere la confianza

La puntuación de confianza se ejecuta en dos granularidades:

1. **Nivel de recibo** — cada recibo que sale de la canalización (02 Etapa 6) se puntúa exactamente una vez antes del asentamiento de bINT. La re-puntuación es posible (por ejemplo, después de una apelación exitosa), pero cada versión reemplaza a la anterior.
2. **Nivel de usuario** — cada usuario tiene una posición de confianza acumulativa que refleja la calidad de sus contribuciones a lo largo del tiempo. La posición cambia de forma gradual y está acotada, de modo que un solo recibo defectuoso tiene un efecto limitado en un historial largo y positivo.

Ambas granularidades se actualizan de forma sincrónica: la evaluación de calidad a nivel de recibo se ejecuta cuando el recibo sale de la canalización, y la posición a nivel de usuario se actualiza en la misma pasada de procesamiento.
