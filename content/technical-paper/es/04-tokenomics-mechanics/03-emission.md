# Emisión de recompensas de usuario

## 4.3 Cómo fluyen las recompensas hacia bINT

El pool de recompensas de usuario se rige por la tabla de asignación en 4.17. Dentro de ese pool, la emisión diaria se mide mediante una curva que toma el uso activo mensual como su entrada principal. La curva tiene tres propiedades que vale la pena nombrar:

- **Crecimiento por escalones hacia un pico.** A medida que los MAU crecen a través de bandas definidas, el pool de emisión diaria se expande por escalones en lugar de continuamente. Esto evita efectos de acantilado cuando la actividad oscila cerca de un umbral.
- **Pico acotado.** El pool diario crece de forma escalonada hasta una banda pico y luego se mantiene. Tras el pico, los MAU adicionales aumentan la densidad de contribución por usuario. Los valores de banda se calibran en producción y no se publican.
- **Horizonte largo.** El rail de recompensas de usuario está dimensionado para durar un horizonte de 15 años. La cuota de recompensas de la oferta (64.35 mil millones de INT, ver 4.17) es el presupuesto; la curva es el medidor.

La función escalonada — las bandas de MAU, los valores del pool diario por banda y el comportamiento de transición — se documenta en 4.19. Los límites de banda se reajustan a medida que evoluciona la actividad observada.

## 4.4 El ciclo de vida de conversión bINT → INT

bINT se acumula off-chain cuando un recibo supera la capa de confianza (03). Se liquida a INT a través de una época periódica (semanal) en lugar de una llamada de conversión on-chain por usuario. El ciclo de vida:

```
acumular  →  retener  →  liquidar (época)  →  reclamar  →  INT en la billetera del usuario
```

- **Acumular.** Por recibo, en la capa contable off-chain. La cantidad la fija la banda de confianza, el techo diario del usuario y el escalón de emisión actual.
- **Retener.** bINT permanece en la capa contable durante una ventana de retención mínima antes de ser elegible para la liquidación. La ventana da a la capa de confianza (03) tiempo para responder a patrones anómalos antes de que se distribuya cualquier INT.
- **Liquidar.** En cada época, el bINT elegible se convierte a INT a un ratio plano de 1:1 (4.24). El motor construye una lista de distribución, un verificador independiente la comprueba (4.17) y la raíz resultante se publica en el distribuidor auditado.
- **Reclamar.** El usuario reclama su INT directamente del distribuidor a una billetera SPL estándar, transferible. El tesoro retiene el INT hasta que se reclama; no hay un paso de vesting separado.

Cuando la recompensa elegible total de una época supera el techo de emisión global, la cantidad de cada participante se reduce por el mismo factor (pro-rata de tope flexible (soft-cap), 4.24). La longitud de la ventana de retención y el valor del techo global se gestionan en la capa operativa y no se publican.

## 4.5 Techo diario, en términos de tokenomics

El techo diario efectivo de bINT es el producto de un techo base, un multiplicador de nivel (03 §3.6) y la salud actual del usuario (03 §3.5). La implementación actual del MVP utiliza tablas por nivel (4.22); la arquitectura objetivo utiliza un techo basado en fórmula (4.23). Los valores de multiplicador y salud son específicos del usuario y residen en la capa de confianza.

Esta descomposición importa porque permite al protocolo reajustar cualquiera de los tres factores preservando la tokenomics. Una expansión de mercado puede elevar la base; un reequilibrio del sistema de niveles puede desplazar el multiplicador; una ola de abuso puede comprimir la distribución de salud.
