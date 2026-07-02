# Capas de almacenamiento

## 1.4 Capas de almacenamiento

El modelo de almacenamiento separa los datos por propósito y clase de privacidad. El documento público describe qué datos residen en qué capa.

| Capa | Contenido | Ubicación | Principio de retención | Clase de privacidad |
|---|---|---|---|---|
| Capa de registros activos | Registros de recibos, líneas, eventos de etapa | Base de datos de la aplicación | Ventana activa del producto | Seudónimo |
| Capa de análisis | Observaciones normalizadas y métricas de calidad | Partición de análisis separada | Ventana rodante definida por política | Seudónimo o anónimo |
| Capa de objetos | Entrada de recibo cifrada y derivados de procesamiento | Almacenamiento de objetos cifrado | Política de minimización de datos | Puede contener datos personales |
| Capa de agregados anónimos | Salida agregada para el producto de datos B2B | Almacenamiento de agregados separado | Ventana de publicación versionada | No vinculable al usuario |
| Resumen en cadena | Evento de token, compromiso de liquidación, estado del programa | Cadena pública | Permanente | Datos de token y compromiso |

Dos reglas son invariantes: el contenido bruto del recibo se procesa en la capa de datos fuera de la cadena; la capa de agregados anónimos utiliza claves separadas del usuario. Los períodos de retención y la selección de proveedor físico son política operativa.