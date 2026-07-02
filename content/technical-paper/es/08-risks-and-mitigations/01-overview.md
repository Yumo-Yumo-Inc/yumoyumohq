# Modelo de riesgo

Esta sección define las clases de riesgo divulgadas en el documento técnico público de Yumo Yumo, la superficie del protocolo que toca cada clase, y el principio de control público adjunto a ella. El objetivo es mostrar al lector técnico dónde aparece el riesgo en el diseño del sistema y dónde se especifica el mecanismo relevante.

Los runbooks internos, la lógica de alertas, la disposición de firmantes, el ordenamiento de proveedores, los umbrales y los pasos de respuesta a incidentes permanecen en la capa de operaciones. El texto público proporciona la postura arquitectónica, el principio de minimización de datos, la separación de autoridad y el modelo de estado visible para el usuario.

## 8.0 Clases de riesgo

| Clase | Superficie del protocolo | Principio de control público |
|---|---|---|
| Regulatorio | Procesamiento de datos, clasificación de tokens, impuestos y registro regional | Minimización de datos, política de publicación agregada, proceso legal por jurisdicción |
| Token y mercado | Emisión, vesting, staking, BBB y liquidez de mercado secundario | Flujo de oferta basado en fórmula, vesting público, quema vinculada a ingresos |
| Contrato inteligente | Autoridades de programa, emisión/quema de tokens, staking y movimiento de tesorería | Despliegue versionado, revisión independiente, separación de autoridad |
| Producto y canalización | Lectura de documentos, extracción estructurada, capa de reglas y escritura de registro | Validación de esquema, adaptadores agnósticos de proveedor, visibilidad de estado |
| Privacidad y datos | Contenido de recibo, historial de usuario, producto de datos agregado | Contenido fuera de la cadena, k-anonimato, acceso de ámbito de tarea |
| Operacional | Custodia de autoridad, continuidad de servicios externos, latencia de red y manejo de incidentes | Clase de aprobación múltiple, rastro auditable, gobernanza escalonada |

§8.2-§8.19 describen cada clase de riesgo a través del impacto técnico y el modelo de control público. §8.20-§8.21 resumen esas clases en una tabla. Los principios de control pertenecen al documento técnico; los detalles de implementación residen en la documentación de operaciones de seguridad.

---

## Referencias cruzadas

- Modelo operativo y localización progresiva → 00 §0.2.
- Modelo de estado de la canalización → 02 §2.9.
- Conjunto de señales de la capa de confianza → 03 Capa de confianza.
- Gobernanza de tesorería y migración de autoridad → 04 §4.10.
- Modelo de privacidad del producto de datos → 05 §5.8.
- Entradas del glosario: MiCA, k-anonimato, puntuación de salud → 09 Glosario.
