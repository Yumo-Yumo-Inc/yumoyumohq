# Entornos

## 1.6 Entornos

Yumo Yumo define los entornos por alcance de datos y efecto económico, no por etiquetas de red. El propósito de esta página es describir los límites de madurez del protocolo, no explicar terminología específica de cadena.

| Entorno | Alcance de datos | Efecto económico | Uso |
|---|---|---|---|
| Local y prueba | Fixtures, recibos sintéticos | Ninguno | Desarrollo, pruebas automatizadas, experimentos de modelos |
| Staging | Datos sintéticos y datos de prueba con consentimiento explícito | Ninguno | Validación de lanzamiento, ensayo de migración, control de calidad |
| Producción controlada | Datos reales de usuarios | Alcance limitado de recompensas y autoridad | Crecimiento temprano, despliegue por país/segmento, escalamiento observado |
| Producción completa | Datos reales de usuarios | Reglas de protocolo publicadas | Uso amplio y liquidación regular |

La transición de producción controlada a producción completa está impulsada por límites económicos, alcance de procesamiento de datos y modelo de autoridad. Los topes operativos y los criterios de transición se gestionan en la capa de operaciones internas.