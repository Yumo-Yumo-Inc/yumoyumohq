# Límites de seguridad

## 1.7 Límites de seguridad

El modelo de seguridad de Yumo Yumo separa qué capa alberga qué datos y qué autoridad. El documento público describe los límites de autoridad y datos de forma auditable.

| Límite | Contiene | Separación de autoridad |
|---|---|---|
| Dispositivo del usuario | Firma de billetera, archivo de recibo seleccionado, preprocesamiento local | La firma del usuario permanece en el dispositivo |
| Servicios de aplicación | Sesión, orquestación de carga, trabajos de canalización, eventos de estado | Los servicios de aplicación portan la autoridad de sesión y canalización |
| Plano de datos | Registros de recibos seudónimos, observaciones derivadas, libro mayor de recompensas | El plano de datos porta la integridad de registros y libro mayor |
| Capa en cadena | Estado del token, autoridades de staking/tesorería, compromisos criptográficos | La capa en cadena porta el estado del token y los compromisos |
| Plano de control operacional | Monitoreo, cuotas, respuesta a incidentes | El plano de control operacional gestiona los parámetros de defensa |

En este modelo, los datos del usuario, la contabilidad de recompensas y la autoridad en cadena residen en capas separadas. Las transiciones entre límites ocurren a través de eventos tipados y registros auditable; los procedimientos de firma, los manuales de emergencia y los valores umbral se gestionan en la documentación operativa privada.