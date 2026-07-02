# Dependencias y clases de fallo

## 1.9 Dependencias y clases de fallo

El documento técnico público clasifica las dependencias externas por comportamiento del producto. Las rutas de proveedor, los umbrales y las acciones de incidentes se gestionan en la capa de operaciones internas.

| Clase de fallo | Impacto en el usuario | Postura pública de la arquitectura |
|---|---|---|
| Retraso en procesamiento de documentos/IA | La vista previa del recibo se retrasa o se deriva a revisión | Las etapas de la canalización se separan por salidas tipadas; cada etapa puede diferirse o reejecutarse de forma independiente |
| Indisponibilidad del plano de datos | El procesamiento de nuevos recibos puede pausarse; la lectura puede limitarse | El modelo de eventos del libro mayor es de solo adición; la liquidación puede derivarse nuevamente de eventos reproducibles |
| Problema de latencia de cadena/RPC | La liquidación en cadena se retrasa; la vista previa del usuario puede permanecer fuera de la cadena | La contabilidad de recompensas se escribe primero en el libro mayor fuera de la cadena; las escrituras en cadena se tratan como liquidación por lotes |
| Riesgo de autoridad y firma | Las autoridades de tesorería o programa pueden verse afectadas | Las autoridades se separan entre la billetera del usuario, los servicios de aplicación y la capa en cadena |
| Crecimiento de cola y acumulación | El tiempo de procesamiento aumenta; los trabajos de baja prioridad se diferirán | El flujo de usuario sincrónico y el flujo de liquidación en segundo plano están separados |

Las rutas de proveedor, los umbrales de firma, los pasos de recuperación y los tiempos de respuesta a incidentes se gestionan en la capa de operaciones internas. El documento público describe el impacto en el producto y las clases de resiliencia arquitectónica.

## Referencias cruzadas

- Detalle de procesamiento de recibos → 02 Canal de procesamiento de recibos
- Modelo de confianza y antiabuso → 03 Capa de confianza
- Superficie de tokens y liquidación → 04 Mecánicas tokenómicas
- Esquema de datos y producto agregado → 05 Esquema de datos y API
