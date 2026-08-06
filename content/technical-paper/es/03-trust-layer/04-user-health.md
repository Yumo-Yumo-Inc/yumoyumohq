# Salud y nivel del usuario

## 3.5 Salud a nivel de usuario

Cada usuario tiene una posición de **salud** que refleja la calidad de sus contribuciones. La salud cambia de forma gradual: una secuencia de recibos limpios y completos la empuja hacia arriba; una secuencia de recibos de baja calidad o inconsistentes la hace bajar. La salud actúa como multiplicador sobre la **tasa de recompensa por recibo**, por lo que el mismo recibo puede ganar cantidades distintas de bINT para usuarios con posiciones distintas.

La salud tiene tres propiedades que vale la pena nombrar:

- **Acotada.** Permanece dentro de un rango configurado que permite a un usuario en recuperación volver a subir. Los usuarios nuevos comienzan en un punto medio neutral.
- **Sincrónica.** Se actualiza a medida que se procesa cada recibo, en la misma pasada que evalúa la calidad del recibo (3.3).
- **Decreciente** *(planificada)*. Un componente de decaimiento temporal, bajo el cual las contribuciones más antiguas importan menos que las recientes, está planificado y no activo en la versión actual.

El rango de salud, las bandas de tasa y el mapeo de la salud a la tasa de recompensa se gestionan en la capa de operaciones internas.

## 3.6 Nivel

La salud es de horizonte conductual; el **nivel** es de horizonte de contribución. El nivel es un entero que crece con la contribución acumulada de alta calidad. Los niveles desbloquean superficies de producto.

El nivel es monotónico. Un usuario que pausa sus contribuciones conserva su nivel mientras la salud deriva hacia el punto medio neutral.

El nivel y la salud actúan sobre partes distintas del cálculo de recompensas: **el nivel establece el techo diario de bINT** (04 §4.22) y **la salud multiplica la tasa de recompensa por recibo** dentro de ese techo.

## 3.7 El techo diario, en términos sencillos

Un usuario puede ganar bINT todos los días hasta un techo establecido por su nivel de cuenta, que refleja qué tan activo ha estado en el protocolo. Dentro de ese techo, la cantidad que gana cada recibo individual está moldeada por la posición de salud del usuario. Los usuarios nuevos reciben un techo modesto que crece con el nivel. El techo se comunica al usuario en la superficie del producto como un indicador de progreso; los valores se reajustan con el tiempo y a través de mercados.
