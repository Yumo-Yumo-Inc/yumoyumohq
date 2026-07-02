# Techos de recompensa

## 4.22 Techos por recibo y diarios

Dos techos de comportamiento protegen el pool de emisión de la concentración y el spam. Ambos se aplican en la capa de aplicación antes de que se acredite bINT en el saldo off-chain del usuario. Un tercer techo, global, se aplica en la liquidación (el pro-rata de tope flexible (soft-cap) en 4.24).

### Techo por recibo

Cada recibo verificado produce como máximo un crédito de bINT máximo dependiente del nivel. El techo evita que un único recibo de alto valor consuma una cuota desproporcionada del presupuesto diario del usuario. El sistema admite 50 niveles de usuario, y el techo por recibo aumenta de forma monótona a través de los niveles. Los valores exactos por nivel se calibran en producción y no se publican.

### Techo diario

Cada usuario tiene un presupuesto diario de bINT que limita la recompensa total ganada a través de todos los recibos en un día UTC. El techo escala con el nivel de usuario a lo largo del mismo rango de 50 niveles, aumentando de forma monótona. Los valores exactos por nivel se calibran en producción y no se publican.

Una vez que el total diario de un usuario alcanza el techo, los recibos adicionales se procesan y registran pero producen cero bINT incremental para ese día. El techo se reinicia a la medianoche UTC. Estos valores son anulables a través de la configuración por nivel y se reajustan a medida que la base de usuarios crece y la distribución de niveles evoluciona.

## 4.23 Arquitectura objetivo: techo basado en fórmula

El modelo de techo a largo plazo reemplaza la tabla plana por nivel con una fórmula continua:

```
effective_daily_ceiling = base_cap × level_multiplier × health_score
```

| Factor | Fuente | Rango |
|---|---|---|
| `base_cap` | Constante a nivel de protocolo | Calibrado en producción y no publicado |
| `level_multiplier` | Contribución acumulada (03 §3.6) | Aumenta con el nivel |
| `health_score` | Calidad de contribución reciente (03 §3.5) | Escalar acotado, calibrado en producción y no publicado |

Bajo este modelo, un usuario de nivel bajo con salud neutra gana una fracción del techo base (`base_cap × level_multiplier × health_score`), mientras que un usuario de nivel alto con salud fuerte se aproxima al extremo superior del rango del techo. Las constantes exactas se calibran en producción y no se publican. La fórmula permite al protocolo reajustar cualquiera de los tres factores de forma independiente preservando el sobre económico general.

### Camino de transición

La tabla del MVP y la fórmula objetivo coexisten durante las fases pre-TGE y post-TGE temprana. La tabla del MVP proporciona techos deterministas y fácilmente auditables durante el periodo en que el sistema de puntuación de salud y la distribución de niveles aún están madurando. El modelo basado en fórmula se activa cuando las señales de salud y nivel de la capa de confianza alcanzan suficiente profundidad de calibración. La transición es un cambio de configuración del protocolo, no una migración de contrato inteligente.
