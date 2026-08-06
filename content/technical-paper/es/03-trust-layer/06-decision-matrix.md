# Matriz de decisión

## 3.11 De la puntuación al resultado

Una vez que un recibo tiene una evaluación de calidad y la posición de salud del usuario está al día, la capa deriva el recibo hacia un resultado.

Activos en la versión actual:

| Resultado | Qué ve el usuario | Qué registra el libro mayor |
|---|---|---|
| **Aceptación — crédito completo** | Vista previa verificada + cantidad completa de bINT para este recibo y este usuario. | `receipt.status = "verified"`, crédito completo, nivel de calidad registrado. |
| **Aceptación — crédito reducido** | Vista previa verificada + una cantidad menor de bINT. Sin fricción. | `receipt.status = "verified"`, crédito parcial, categoría de motivo de degradación. |
| **Rechazo** | Mensaje claro en lenguaje sencillo y 0 bINT. | `receipt.status = "rejected"`, categoría de motivo de rechazo. |

Planificado, no activo en la versión actual:

| Resultado (planificado) | Qué ve el usuario | Qué registra el libro mayor |
|---|---|---|
| **Retenido para revisión** | "Estamos verificando este recibo. El resultado suele llegar en un día." | Un estado de revisión dedicado, en cola en el flujo de trabajo de apelaciones (3.12). |

El resultado de rechazo está reservado para casos fuera de la banda de plausibilidad de recibos honestos — por ejemplo, una imagen marcada por verificaciones de autenticidad de medios sintéticos, un documento manuscrito o un duplicado de un recibo ya acreditado a un usuario diferente con evidencia contradictoria.

## 3.12 La cola de apelaciones (planificada)

La cola de apelaciones es un mecanismo planificado; la versión actual resuelve cada recibo de forma automática. Bajo el diseño planificado, un recibo retenido para revisión ingresa a una cola bajo un objetivo de tiempo operacional. El revisor (inicialmente el equipo operativo, posteriormente un pool comunitario que gana Proof of Contribution) ve:

- La imagen del recibo y el registro extraído.
- La banda y la lista de familias de señales que contribuyeron.
- Un vistazo al historial reciente del usuario.
- Tres acciones: **aprobar completo**, **aprobar reducido**, **confirmar rechazo**.

El revisor ve las mismas familias de señales que registra el bloque del recibo. Esto mantiene al revisor alineado con el diseño de la capa y apoya decisiones consistentes.

Si el revisor revierte la recomendación de la capa, la anulación se registra y contribuye al siguiente ciclo de calibración.

## 3.13 Qué puede hacer el usuario

Un usuario cuyo recibo es rechazado ve una explicación a nivel de categoría y, donde corresponda, una vía de autoservicio: volver a fotografiar el recibo con mejor iluminación, contactar al soporte con una confirmación de pago, o aceptar el rechazo. Las razones a nivel de señal permanecen en la configuración interna de confianza.

La puntuación de salud se calcula a partir de señales en ventana móvil. Los recibos aceptados posteriormente afectan la puntuación bajo las reglas configuradas; un solo evento no la restablece de forma abrupta.
