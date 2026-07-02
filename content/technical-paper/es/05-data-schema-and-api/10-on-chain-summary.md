# Resumen de datos on-chain

## 5.9 Resumen de datos on-chain

Qué va on-chain, por categoría:

| On-chain | Fuera de la cadena |
|---|---|
| Eventos de emisión INT | Filas individuales de `BintLedgerEntry` |
| Eventos de transferencia INT | Saldos de bINT y registros de acumulación |
| Raíz de distribución por época | Registros individuales de ePoints |
| Hash del conjunto de datos publicado (compromiso de transparencia) | Texto bruto OCR |
| Transiciones de nivel NFT | Imágenes de recibos y artículos de línea |
| Firmas de transacción de quema BBB | Señales de puntuación de confianza |

La regla es: **on-chain almacena compromisos y agregados; fuera de la cadena almacena contenido.** Un usuario puede verificar su saldo fuera de la cadena contra un compromiso on-chain mientras el contenido del recibo permanece en la capa de datos fuera de la cadena.

---
