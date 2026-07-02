# 05 — Esquema de datos y API

Esta sección define el esquema público y la superficie de API de Yumo Yumo. Las salidas de la canalización en 02, las decisiones de confianza en 03 y la contabilidad de recompensas en 04 se mapean a las formas de entidad y evento definidas aquí.

Los esquemas se publican para que las partes del protocolo puedan leer el mismo registro de la misma manera. La estrategia de indexación física, la elección de proveedor, el movimiento de datos calientes/fríos y los parámetros comerciales del producto B2B permanecen en la documentación operativa.

## 5.0 Principio del esquema

| Principio | Consecuencia |
|---|---|
| Registro tipado | Cada objeto público está versionado y vinculado a un esquema |
| Libro mayor basado en eventos | La contabilidad de recompensas se deriva de eventos históricos auditables |
| Datos separados | Los datos personales, los datos agregados y el resumen on-chain residen en capas separadas |
| API versionable | Las adiciones/eliminaciones de campos siguen reglas de compatibilidad hacia atrás |
