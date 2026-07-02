# Operaciones

## 2.10 Manejo de errores y casos límite

El canal evalúa los errores por separado de los mensajes orientados al usuario y el impacto en el libro mayor. El contrato público es la categoría en la que cae un caso límite; las señales de detección, los umbrales y la política de reintento se gestionan en la capa operativa interna.

| Categoría | Impacto en el usuario | Impacto en el libro mayor |
|---|---|---|
| Baja calidad de entrada | Se puede pedir al usuario una entrada mejor | La contabilidad de recompensas puede aplazarse o marcarse como de baja confianza |
| Recibo faltante o inconsistente | El usuario ve el flujo de verificación/recarga | El registro va a revisión o rechazo |
| Tipo de documento no admitido | Se informa al usuario de que el tipo no es compatible | No se admite en la contabilidad de recompensas |
| Sospecha de repetición o colisión | Se puede mostrar un registro existente o realizar una revisión silenciosa | La capa de confianza determina el resultado |
| Recibo antiguo o de reembolso | Se muestra al usuario el estado apropiado | Puede afectar a la memoria/ePoints en lugar de bINT |
| Retraso del sistema | El usuario ve el estado de espera o reintento | El evento del trabajo se preserva en la cola |

## 2.11 Costo y rendimiento

El diseño del canal apunta a una vista previa de baja latencia para el usuario manteniendo las etapas de modelo pesado dentro de límites medibles. El costo por etapa, los presupuestos de latencia, las proporciones de proveedores y la política de reintento son parámetros operativos.

## 2.12 Observabilidad

Cada etapa emite las mismas familias de métricas: latencia, tasa de éxito, categoría de error, profundidad de cola y banda de calidad. El documento público describe la forma de las métricas; los umbrales de alerta, las tasas de muestreo, las etiquetas de proveedor y la política de ejecución en sombra se gestionan en la capa operativa interna.

## 2.13 Hoja de ruta

La hoja de ruta del canal avanza en tres direcciones técnicas: más entradas de facturas estructuradas, un preprocesamiento más potente en el dispositivo y una experiencia de captura por lotes. Los planes de cambio de proveedor y los calendarios de capacidad permanecen en la planificación operativa.
