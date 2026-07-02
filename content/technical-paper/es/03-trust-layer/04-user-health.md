# Salud y nivel del usuario

## 3.5 Salud a nivel de usuario

Cada usuario tiene un valor de **salud** en `[0, 1]` que refleja la calidad reciente de sus contribuciones. La salud cambia lentamente: una larga secuencia de recibos limpios la empuja hacia arriba; una secuencia de recibos retenidos o rechazados la hace bajar. La salud actúa como multiplicador sobre el techo de contribución diaria del usuario, por lo que afecta directamente cuánto bINT puede ganar el mismo recibo para diferentes usuarios.

La salud tiene tres propiedades que vale la pena nombrar:

- **Acotada.** Permanece dentro de un rango configurado que permite a un usuario en recuperación recuperarse. Los usuarios nuevos comienzan en un punto medio neutral.
- **Retardada.** Se recalcula en el nivel de procesamiento por lotes diario. Los efectos de recibos individuales se dispersan en el tiempo.
- **Decreciente.** Las contribuciones más antiguas importan menos que las recientes a través de la ventana de contribución.

La ventana de decaimiento, los valores de piso y techo, y los límites de banda que mapean la salud a los techos diarios se gestionan en la capa de operaciones internas.

## 3.6 Nivel

La salud es de corto plazo; el **nivel** es de largo plazo. El nivel es un entero que crece con la contribución acumulada de alta calidad. Los niveles desbloquean superficies de producto y, en el hito definido en *Vision Paper — Yumbie Product Surface*, el Foundation NFT del usuario evoluciona al Smart Agent (un evento de acuñación unidireccional).

El nivel es monotónico. Un usuario que pausa sus contribuciones conserva su nivel mientras la salud deriva hacia el punto medio neutral.

El nivel y la salud juntos establecen el techo diario efectivo de bINT. La implementación MVP actual utiliza tablas por nivel (04 §4.22); la arquitectura objetivo utiliza un techo basado en fórmula con `base_cap × level_multiplier × health_score` (04 §4.23).

## 3.7 El techo diario, en términos sencillos

Un usuario puede ganar bINT todos los días hasta un techo que refleja (a) qué tan activo ha estado en el protocolo y (b) qué tan limpias han sido sus contribuciones recientes. Los usuarios nuevos reciben un techo modesto que crece con el nivel. El techo se comunica al usuario en la superficie del producto como un indicador de progreso; el valor se reajusta con el tiempo y a través de mercados.
