# Mecánicas de staking

## 4.6 Rail de staking

La infraestructura de staking se incluye en la v1 pero **no está activa en el lanzamiento**. Se activa en una fase posterior, después de que se complete la ventana inicial de descubrimiento de precios, de modo que el periodo de lanzamiento no quede moldeado por los flujos de staking. El Vision Paper publica la asignación de staking y la tabla de tramos (periodo de bloqueo, peso, rango de APR indicativo). Esta sección describe el mecanismo para cuando se active.

### Modelo de recompensa

El staking se nutre del rail de Staking Incentives (4.17), liberado a lo largo de un horizonte de 5 años. El diseño fija el **pool de emisión anual**, no el APR. El APR que rinde un tramo en cualquier momento es una función de `annual_pool / weighted_staked_supply`: es más alto mientras hay poco en staking y se normaliza a medida que crece la oferta en staking. Esto mantiene el rail dentro de su presupuesto independientemente de la participación, y plantea los APR indicativos del Vision Paper como pesos en lugar de promesas fijas.

### Estructura de tramos

Un participante de staking elige un periodo de bloqueo de un conjunto fijo de tramos, cada uno con un peso relativo. Las recompensas se acumulan en proporción a ese peso. La tabla de tramos forma parte del Vision Paper publicado.

### Acumulación y reclamación

Las recompensas se acumulan a lo largo del periodo de bloqueo y se liquidan a través de la misma época y el mismo camino del distribuidor que las recompensas de usuario (4.4): el motor calcula la acumulación, el verificador independiente la comprueba (4.17) y el usuario reclama del distribuidor. El principal se vuelve retirable después de que expire el periodo de bloqueo.

### Implementación

El staking utiliza herramientas auditadas en lugar de un programa de protocolo personalizado, en consonancia con el modelo de programa en 4.15. El staking on-chain sin confianza (trustless), cuando se introduzca, se construye sobre una plantilla auditada.

## 4.7 Momento de activación

La v1 incluye la infraestructura de staking en modo inactivo. Se habilita en una fase posterior, después de la ventana inicial de descubrimiento de precios. Esto se publica en el Vision Paper.

## 4.8 Controles operativos

Las distribuciones de recompensas y los cambios de parámetros de la tabla de tramos se rigen bajo los controles del tesoro descritos en 4.9. Los cambios siguen la misma cadencia de multifirma + timelock (ejecución diferida) que la ejecución de recompra y quema, con el anuncio precediendo a la ventana de timelock.
