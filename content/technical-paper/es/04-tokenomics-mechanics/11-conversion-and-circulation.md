# Ratio de conversión y oferta circulante

## 4.24 Ratio de conversión bINT → INT

bINT se liquida a INT a un ratio plano de **1:1**. Cada unidad de contribución porta el mismo valor de conversión a lo largo del horizonte de emisión, independientemente de cuándo se ganó.

Un ratio plano mantiene el valor de conversión predecible y elimina cualquier ventaja de temporalización entre la contribución temprana y la tardía. Como cada bINT extrae exactamente un INT, el rail de User Rewards (64.35 mil millones de INT, 4.17) absorbe más contribución antes de alcanzar el tope de lo que lo haría un ratio temprano más alto.

La liquidación es off-chain (4.4): el motor convierte el bINT elegible en cada época y el usuario reclama el INT resultante del distribuidor auditado. Cuando la recompensa elegible total de la época supera el techo de emisión global, cada participante se reduce por el mismo factor pro-rata, de modo que la tasa de recompensa se suaviza de forma pareja para todos en lugar de cortar a los últimos contribuyentes. Tanto el valor del techo como el cálculo del escalado se calibran en la capa operativa y no se publican.

## 4.25 Ventana de retención y controles de liquidación

bINT entra en un periodo de retención mínimo antes de ser elegible para la liquidación. La ventana de retención da a la capa de confianza (03) tiempo para detectar y responder a patrones anómalos antes de que se distribuya cualquier INT.

Un techo acumulado limita el total de INT que la capa de contribución puede distribuir jamás (el rail de User Rewards, 4.17); el verificador independiente (4.17) aplica esta invariante en cada época. Estos parámetros se gestionan en la capa operativa y se calibran para equilibrar la experiencia de usuario con la seguridad del protocolo.

## 4.26 Modelo de oferta circulante

El INT circulante crece a partir de tres entradas principales: la liquidación de User Rewards, los desbloqueos de Liquidity y las distribuciones periódicas de Airdrop (4.18). Se reduce a través de la recompra y quema (4.9) y las quemas por acceso corporativo a datos.

La tabla siguiente proyecta la oferta circulante bajo tres escenarios de crecimiento de MAU. Estas son proyecciones de modelado, no compromisos.

| Año | Escenario de MAU bajo | Escenario de MAU base | Escenario de MAU alto |
|---:|---:|---:|---:|
| TGE | 1,000,000,000 | 1,000,000,000 | 1,000,000,000 |
| 1 | 3,500,000,000 | 5,200,000,000 | 7,400,000,000 |
| 2 | 5,100,000,000 | 8,800,000,000 | 14,000,000,000 |
| 3 | 7,000,000,000 | 13,200,000,000 | 21,500,000,000 |
| 5 | 11,500,000,000 | 22,500,000,000 | 36,000,000,000 |
| 10 | 24,000,000,000 | 42,000,000,000 | 58,000,000,000 |
| 15 | 38,000,000,000 | 60,000,000,000 | 72,000,000,000 |

### Supuestos

- **La flotación del TGE** es la liquidez inicial (1,000,000,000), coincidiendo con la estimación en 4.21. Las distribuciones de airdrop entran en circulación más tarde como eventos periódicos basados en participación (4.18), no en el TGE.
- **MAU bajo:** los MAU permanecen en la banda de 0–10K durante los primeros dos años, alcanzando 100K para el año 5.
- **MAU base:** los MAU alcanzan 100K en el año 1, 1M para el año 3, 5M para el año 5.
- **MAU alto:** los MAU alcanzan 1M en el año 1 y sostienen 5M+ desde el año 3.
- Todos los escenarios asumen que el mecanismo de recompra y quema está activo desde el año 2 en adelante, eliminando anualmente un porcentaje de la oferta circulante. La tasa de quema es una función de los ingresos del producto de datos y la política del tesoro.
- El staking no está activo en el lanzamiento (4.6); el modelo no cuenta los bloqueos de staking como un sumidero de circulación durante la v1.

Estas proyecciones ilustran la relación entre la velocidad de adopción y la expansión de la oferta. La oferta circulante real depende del comportamiento de liquidación, la ejecución de quemas y los patrones de crecimiento de usuarios que no pueden predecirse con certeza.
