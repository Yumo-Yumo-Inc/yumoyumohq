# Capas de datos (resumen del Vision Paper)

## 5.1 Capas de datos (resumen del Vision Paper)

El Vision Paper define cuatro capas de datos; esta sección mapea cada una a un almacenamiento concreto y muestra qué es consultable desde qué.

| Capa | Qué reside aquí | Acceso de usuario | Acceso de operaciones | Acceso B2B |
|---|---|---|---|---|
| **Dispositivo** | Imagen original del recibo | Datos propios | Ámbito de dispositivo | Ámbito de dispositivo |
| **Sistema caliente** | Registros de recibos, artículos de línea, últimos 90 días | Datos propios | Operacional | Capa agregada |
| **Sistema templado** | Igual que el caliente, 91 días-3 años | Datos propios | Operacional | Capa agregada |
| **Agregado anonimizado** | Paneles e índices k-anónimos | Vista agregada | Operacional | Vista agregada |
| **Resumen on-chain** | Hashes de crédito bINT, eventos INT, niveles NFT | Público | Público | Público |

La regla estricta: **el agregado anonimizado está separado de los registros de usuario único**. 5.8 especifica la transformación.

---
