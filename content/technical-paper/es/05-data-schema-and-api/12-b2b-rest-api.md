# API B2B (planificado)

## 5.11 API B2B (planificado)

La API del producto de datos B2B es **trabajo futuro planificado**; no hay endpoints B2B activos hoy. Los datos relevantes de B2B actualmente llegan al mundo exterior a través del libro mayor de precios público (5.10) y sus manifiestos de Arweave.

Esbozo de diseño para la superficie planificada — ruta base separada, credenciales separadas, cuotas separadas de la API pública:

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/inflation-pulse` | Serie Inflation Pulse |
| GET | `/basket-panel` | Consulta de Basket Panel |
| GET | `/merchant-benchmarks` | Merchant Benchmarks |
| POST | `/cohort-query` | Cohorte personalizada con aplicación de piso k |
| GET | `/catalog` | Productos disponibles + antigüedad + precios |
| GET | `/methodology/{version}` | Documento de metodología para una versión dada |

Autenticación planificada: clave API con firma de solicitud protegida contra repetición; el esquema de firma y la ventana de repetición se quedan en la capa de operaciones internas.

Cada respuesta B2B planificada incluye `methodology_version`, el indicador del piso de k-anonimidad y el recuento de colaboradores de la respuesta, para que el equipo de cumplimiento del comprador pueda auditar un lanzamiento.

---
