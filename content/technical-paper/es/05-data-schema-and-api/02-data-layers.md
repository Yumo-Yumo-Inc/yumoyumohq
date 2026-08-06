# Capas de datos (resumen del Vision Paper)

## 5.1 Capas de datos (resumen del Vision Paper)

El Vision Paper define las capas de datos; esta sección mapea cada una a un almacenamiento concreto y muestra qué es consultable desde qué.

| Capa | Qué reside aquí | Acceso de usuario | Acceso de operaciones | Acceso B2B |
|---|---|---|---|---|
| **Dispositivo** | Imagen original del recibo | Datos propios | Ámbito de dispositivo | Ámbito de dispositivo |
| **Sistema de registro** | Registros de recibos, artículos de línea, eventos de recompensa — un único Postgres gestionado (Neon) | Datos propios | Operacional | Capa agregada |
| **Agregado anonimizado** | Paneles e índices k-anónimos | Vista agregada | Operacional | Vista agregada |
| **Resumen on-chain** | Raíces de Merkle por epoch (recompensa + precio), eventos INT | Público | Público | Público |

La estratificación caliente/templada por antigüedad del sistema de registro es una **opción de escalado**, planificada para cuando el volumen lo justifique; hoy una única instancia de Postgres alberga el historial completo.

La regla estricta: **el agregado anonimizado está separado de los registros de usuario único**. 5.8 especifica la transformación.

---
