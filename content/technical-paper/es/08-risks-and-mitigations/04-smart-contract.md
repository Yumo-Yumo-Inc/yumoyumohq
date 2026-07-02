# Riesgo de contrato inteligente

## 8.8 Superficie

El riesgo de contrato inteligente proviene de transiciones de estado on-chain como emisión/quema de tokens, staking, enrutamiento de tesorería, vesting y compromisos de liquidación. Errores de programa, configuración incorrecta de autoridad o comportamiento inesperado de la red pueden afectar los saldos de usuario, la oferta circulante o el estado de tesorería.

## 8.9 Modelo de control

| Superficie de riesgo | Principio de control público |
|---|---|
| Error de programa | Revisión independiente, cobertura de pruebas, despliegue versionado |
| Concentración de autoridad | Clase de aprobación múltiple, ejecución diferida, separación de autoridad |
| Inconsistencia de liquidación | Compromisos de libro mayor fuera de la cadena y modelo de evento reproducible |
| Impacto de mercado impulsado por tesorería | Ejecución basada en reglas y rastro público para eventos completados |

El modelo de autoridad on-chain se describe en 04 §4.10. La herramienta de firma, el conjunto de firmantes, el umbral, la ventana de retraso, la orden de emergencia y los pasos de respuesta se gestionan en la capa operativa interna.

## 8.10 Evolución

El runtime de la cadena es una capa de liquidación externa. El ordenamiento de transacciones, el mercado de tarifas, el límite de cómputo y la latencia de red se manejan a través de revisión pre-despliegue, monitoreo post-despliegue y disciplina de actualización versionada.
