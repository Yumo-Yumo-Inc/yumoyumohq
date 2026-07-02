# Riesgo operacional

## 8.17 Superficie

El riesgo operacional proviene de la custodia de autoridad, la concentración de decisiones, la continuidad de servicios externos, la latencia de red y los procesos de gestión de incidentes.

| Superficie | Impacto técnico | Principio de control público |
|---|---|---|
| Custodia de autoridad | Las autoridades de tesorería o programa son objetivo | Clase de aprobación múltiple y separación de autoridad |
| Concentración de decisiones | Las decisiones de producto, economía o seguridad dependen de una operación estrecha | Gobernanza escalonada y registro público de migración de autoridad |
| Continuidad de servicios externos | El procesamiento de documentos, el plano de datos o el acceso a la cadena se retrasa | Estado de cola, rail operativo alternativo y visibilidad del usuario |
| Latencia de red | La liquidación on-chain se retrasa | Compromisos de libro mayor y modelo de evento reproducible |
| Gestión de incidentes | La calidad de respuesta afecta la experiencia de usuario y la confianza | Rastro de incidente auditable y disciplina de divulgación versionada |

## 8.18 Modelo de control

El modelo público explica las clases de control: separación de autoridad, aprobación múltiple, ejecución diferida, registro auditable, divulgación post-incidente y madurez de gobernanza escalonada. Los firmantes, umbrales, herramientas, alarmas, tiempos de respuesta y pasos de runbook se gestionan en la capa operativa interna.

La ingeniería social y los ataques de autoridad dirigidos se manejan dentro de la clase de riesgo operacional. El documento técnico define la superficie técnica; los detalles de implementación permanecen dentro de operaciones de seguridad.

## 8.19 Evolución

A medida que avanzan los pasos de migración de autoridad, las decisiones operacionales pasan del equipo corporativo hacia procesos de gobernanza más amplios. Esta transición se rastrea a través del modelo de registro público descrito en 00 §0.2 y 04 §4.10.
