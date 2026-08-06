# Resumen de datos on-chain

## 5.9 Resumen de datos on-chain

Qué va on-chain, por categoría:

| On-chain | Fuera de la cadena |
|---|---|
| Raíz de Merkle de la época de recompensas (sello memo) | Filas individuales de `contribution_point_events` |
| Raíz de Merkle de la época de precios + hash del manifiesto (sello memo) | Saldos de bINT y registros de acumulación |
| Eventos de acuñación y transferencia de INT (planificado) | Registros individuales de acumulación de recompensas por usuario |
| Transiciones de nivel NFT (planificado) | Texto bruto OCR |
| | Imágenes de recibos y artículos de línea |
| | Señales de trust score |

La regla es: **on-chain almacena compromisos y agregados; fuera de la cadena almacena contenido.** Un usuario puede verificar su saldo fuera de la cadena contra un compromiso on-chain mientras el contenido del recibo permanece en la capa de datos fuera de la cadena.

El flujo de publicación del libro público de precios y la prueba privada de inclusión de recibos se especifican en 06.

---
