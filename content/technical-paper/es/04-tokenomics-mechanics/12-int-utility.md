# Utilidad de INT

## 4.27 Superficie de utilidad

INT desempeña seis funciones dentro del protocolo Yumo Yumo. Dos están activas; cuatro están planificadas y se activan a medida que la superficie del protocolo madura.

| Función | Estado | Descripción |
|---|---|---|
| **Activo de recompensa** | Activo | Los usuarios obtienen INT a través del ciclo de vida de conversión bINT → INT (4.4) por contribuciones verificadas de Proof of Expense |
| **Activo de staking** | Activo en TGE+1 semana | Los titulares bloquean INT en pools de staking ponderados por nivel (4.6) para obtener recompensas de la asignación de incentivos de staking |
| **Objetivo de recompra y quema** | Activo al inicio de ingresos | El tesoro utiliza los ingresos del producto de datos para comprar INT en el mercado abierto y quemarlo (4.9), generando presión deflacionaria |
| **Quema por informe de datos** | Planificado | Las empresas que acceden a informes de datos comunitarios agregados deben quemar una cantidad designada de INT por informe (4.30) |
| **Señal de gobernanza** | Planificado | Señalización ponderada por INT para decisiones sobre prioridades del producto de datos, asignaciones del tesoro y subvenciones del ecosistema |
| **Acceso vinculado por API** | Planificado | Los consumidores de la API del producto de datos anonimizado pueden tener que vincular INT contra sus claves de acceso |

## 4.28 Rendimiento real

INT está diseñado como un activo de rendimiento real. Su captura de valor a largo plazo proviene de los ingresos externos generados por el negocio del producto de datos, no de la emisión de tokens.

Dos mecanismos conectan los ingresos de la plataforma con los titulares de tokens:

1. **Rendimiento para stakers.** Una porción de los ingresos netos del producto de datos fluye hacia un pool de rendimiento para stakers, reclamable por los stakers de INT en proporción a su participación y peso de nivel.
2. **Recompra y quema.** Una porción de los ingresos netos es utilizada por el tesoro para comprar INT en el mercado abierto y quemarlo permanentemente.

La distribución entre rendimiento para stakers y recompra y quema es un parámetro de política del tesoro, gobernado bajo los controles descritos en 4.10. Ambos flujos están vinculados a ingresos externos, no a emisión de tokens. Esta separación significa que la emisión (4.19) expande la oferta de forma predecible mientras que el rendimiento real comprime o distribuye la oferta en función del rendimiento real del negocio.

## 4.29 Fuentes de ingresos

Los ingresos que alimentan el mecanismo de rendimiento real provienen de:

- **Ventas de datos anonimizados.** Datos a nivel de recibo k-anonimizados y agregados vendidos a marcas de FMCG, minoristas, firmas de investigación y desarrolladores a través de acceso API por niveles.
- **Ingresos por afiliación y referencia.** Clics de comparación de precios hacia socios minoristas o de cupones (planificado).
- **Suscripción premium.** Funciones avanzadas de analítica personal y automatización de objetivos (planificado).

Los detalles de generación de ingresos y la arquitectura de anonimización se describen en 05 Esquema de datos y API.

## 4.30 Quema por informe de datos

Las empresas que adquieren informes de datos comunitarios agregados están obligadas a quemar una cantidad designada de INT por cada informe que generan. La quema ocurre on-chain y es permanente.

Este mecanismo cumple dos propósitos:

1. **Presión deflacionaria.** Cada informe de datos consumido elimina permanentemente INT de la oferta circulante, generando escasez del lado de la demanda proporcional a la adopción comercial del producto de datos.
2. **Alineación de valor.** El requisito de quema vincula directamente la utilidad del producto de datos con el token. A medida que más empresas consumen datos de Yumo Yumo, más INT se retira de la circulación, fortaleciendo la relación entre el uso de la plataforma y el valor del token.

La cantidad de quema por informe es establecida por la política del tesoro y varía según el nivel del informe (p. ej. agregados a nivel de categoría vs. paneles completos a nivel de cesta). La estructura de precios asegura que el costo de quema se mantenga como una fracción pequeña del valor comercial del producto de datos mientras genera un impacto acumulativo significativo en la oferta.
