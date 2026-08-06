# Emisión de recompensas de usuario

## 4.3 Cómo fluyen las recompensas hacia bINT

El pool de recompensas de usuario se rige por la tabla de asignación en 4.17. Dentro de ese pool, la emisión diaria se mide mediante una curva que toma el uso activo mensual como su entrada principal. La curva tiene tres propiedades que vale la pena nombrar:

- **Crecimiento por escalones hacia un pico.** A medida que los MAU crecen a través de bandas definidas, el pool de emisión diaria se expande por escalones en lugar de continuamente. Esto evita efectos de acantilado cuando la actividad oscila cerca de un umbral.
- **Pico acotado.** El pool diario crece de forma escalonada hasta una banda pico y luego se mantiene. Tras el pico, los MAU adicionales aumentan la densidad de contribución por usuario. Los valores de banda se calibran en producción y no se publican.
- **Horizonte largo.** El rail de recompensas de usuario está dimensionado para durar un horizonte de 15 años. La cuota de recompensas de la oferta (64.35 mil millones de INT, ver 4.17) es el presupuesto; la curva es el medidor.

La función escalonada — las bandas de MAU, los valores del pool diario por banda y el comportamiento de transición — se documenta en 4.19. Los límites de banda se reajustan a medida que evoluciona la actividad observada.

## 4.4 El ciclo de vida de conversión bINT → INT

bINT se acumula off-chain cuando un recibo supera la capa de confianza (03). Se liquida a INT a través de una época periódica en lugar de una llamada de conversión on-chain por usuario. El ciclo de vida:

```
accrue  →  settle (epoch)  →  claim  →  INT in user wallet
```

- **Acumular.** Por recibo, en la capa contable off-chain. La cantidad la fijan la evaluación de calidad del recibo, la tasa de recompensa ajustada por la salud del usuario, el techo diario basado en nivel y el escalón de emisión actual.
- **Liquidar.** En cada época, el motor suma el libro mayor de contribución sobre la ventana de la época y lo convierte a INT a un ratio plano de 1:1 (4.24). Los puntos ganados antes del cierre de la ventana de la época se liquidan en esa época. El motor construye una lista de distribución, un verificador independiente la comprueba (4.17) y la raíz resultante se publica en el distribuidor auditado.
- **Reclamar.** El usuario reclama su INT directamente del distribuidor a una billetera SPL estándar, transferible. El tesoro retiene el INT hasta que se reclama; no hay un paso de vesting separado.

Cuando la recompensa elegible total de una época supera el techo de emisión global, la cantidad de cada participante se reduce por el mismo factor (pro-rata de tope flexible (soft-cap), 4.24). El valor del techo global se gestiona en la capa operativa y no se publica.

## 4.5 Techo diario, en términos de tokenomics

El techo diario de bINT lo establece el nivel de cuenta del usuario (03 §3.6) mediante tablas por nivel (4.22). Dentro de ese techo, la posición de salud del usuario (03 §3.5) multiplica la tasa de recompensa por recibo. Los valores por nivel y el mapeo de salud residen en la capa de confianza y la configuración operativa.

Esta descomposición importa porque permite al protocolo reajustar cualquiera de los dos factores preservando la tokenomics. Una expansión de mercado o un reequilibrio del sistema de niveles puede desplazar las tablas de techos; una ola de abuso comprime la distribución de salud y, con ella, la tasa de recompensa efectiva.
