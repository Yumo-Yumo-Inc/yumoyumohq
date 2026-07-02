# Riesgo de token y mercado

## 8.5 Superficie

INT es un token SPL negociado en mercados públicos. El riesgo de mercado se lee a través de tres superficies técnicas:

| Superficie | Impacto técnico | Principio de control público |
|---|---|---|
| Volatilidad de precio | El valor en USD de las recompensas de usuario y el staking cambia | Las fórmulas de emisión se publican en unidades de token |
| Presión de desbloqueo | La liberación de oferta bloqueada afecta la oferta circulante | Los perfiles de vesting se mapean a calendarios públicos |
| Liquidez | La profundidad del mercado secundario determina el impacto de la operación | Las mecánicas de tesorería y BBB se conectan al modelo económico público |

## 8.6 Modelo de control

**Curva de emisión basada en pico.** El pool diario de recompensas de usuario sigue la fórmula basada en pico definida en 04 §4.3. El crecimiento de MAU cambia la densidad de contribución por usuario a través de esa fórmula.

**Quema vinculada a ingresos.** Los ingresos del producto de datos B2B crean la fuente económica para la recompra y quema de INT a través del rail de BBB (4.9). La capacidad de quema escala con los ingresos del producto de datos.

**Vesting y staking.** Las distribuciones de PoC siguen calendarios de vesting plurianuales (4.13). Los pools de staking y las duraciones de bloqueo hacen que la tenencia a largo plazo sea económicamente legible (4.6).

**Gestión de liquidez.** Las condiciones de liquidez iniciales después del Token Generation Event se gestionan como parte del plan de lanzamiento. El movimiento de tesorería se mapea al modelo de autoridad y registro en 04 §4.10.

## 8.7 Evolución

A medida que la autoridad de tesorería migra a la gobernanza de la fundación, la ejecución de BBB, los parámetros de staking y las operaciones de liquidez maduran bajo el mismo modelo público de migración de autoridad. El documento técnico proporciona la fórmula del mecanismo y el flujo de autoridad como referencia estable.
