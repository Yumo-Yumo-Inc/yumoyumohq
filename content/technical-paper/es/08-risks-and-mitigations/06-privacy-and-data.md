# Riesgo de privacidad y datos

## 8.14 Superficie

Yumo Yumo trabaja con dos clases de datos: datos de usuario y datos agregados. Los datos de usuario cubren contenido de recibo, historial de gastos y señales de confianza. Los datos agregados cubren señales de precio y composición de canasta que entran en el producto de datos B2B.

| Superficie | Impacto técnico | Principio de control público |
|---|---|---|
| Exposición de datos de usuario | El contenido de recibo identificable es objetivo | Contenido fuera de la cadena y almacenamiento cifrado |
| Re-identificación | Los datos agregados pueden coincidir con un recibo o usuario individual | k-anonimato y disciplina de grupo de publicación |
| Solicitud legal de datos | Una autoridad solicita datos específicos de usuario | Política de privacidad publicada y registro de proceso |
| Acceso administrativo | El equipo de operaciones realiza tareas de procesamiento de datos | Acceso de ámbito de tarea y rastro de auditoría |

## 8.15 Modelo de control

**Contenido de recibo fuera de la cadena.** Los artículos de línea de recibo residen en el libro mayor fuera de la cadena (04 §4.16). La capa on-chain transporta eventos de emisión de bINT y compromisos de raíz Merkle; el contenido se procesa en la capa de datos.

**Disciplina de publicación agregada.** El producto de datos B2B sigue reglas de k-anonimato y grupos de publicación (05 §5.8). Los grupos de publicación se forman a partir de cohortes de región, categoría y período con densidad suficiente.

**Acceso de ámbito de tarea.** Los trabajadores de procesamiento de documentos y las herramientas administrativas operan con el ámbito de datos necesario para la tarea relevante. Los procesos de retención, acceso y eliminación se conectan a la política de privacidad y el proceso de seguridad operativa.

**Rastro de auditoría.** Los registros de acceso administrativo se retienen para revisión externa y ciclos de control interno. Las solicitudes legales de datos se procesan bajo la política de privacidad publicada.

## 8.16 Evolución

La responsabilidad de custodia de datos evoluciona con la localización progresiva y las decisiones de estructura regional. El objetivo arquitectónico permanece estable: el contenido de recibo de usuario permanece fuera de la cadena, los datos agregados se productizan, y la prueba de integridad se proporciona a través de compromiso on-chain.
