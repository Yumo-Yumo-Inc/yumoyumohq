# Utilidad de INT

## 4.27 Superficie de utilidad

INT desempeña seis funciones dentro del protocolo Yumo Yumo. La función de recompensa tiene su infraestructura de liquidación y reclamación construida con activación pendiente; las demás están planificadas y se activan a medida que la superficie del protocolo madura.

| Función | Estado | Descripción |
|---|---|---|
| **Activo de recompensa** | Infraestructura completa, activación pendiente | Las contribuciones verificadas se acumulan actualmente en la capa contable de bINT (4.14). La ruta de liquidación y reclamación para el ciclo de vida de conversión bINT → INT (4.4) está construida; la distribución de INT en cadena se activa con el Token Generation Event |
| **Activo de staking** | Planificado | Si se habilita el staking, los titulares pueden bloquear INT en pools de staking ponderados por nivel (4.6) |
| **Recompra y quema** | Si se habilita la política | El tesoro puede comprar y quemar INT conforme a una política publicada (4.9) |
| **Quema por informe de datos** | Planificado | Las empresas que acceden a informes de datos comunitarios agregados deben quemar una cantidad designada de INT por informe (4.30) |
| **Señal de gobernanza** | Planificado | Señalización ponderada por INT para decisiones sobre prioridades del producto de datos, asignaciones del tesoro y subvenciones del ecosistema |
| **Acceso vinculado por API** | Planificado | Los consumidores de la API del producto de datos anonimizado pueden tener que vincular INT contra sus claves de acceso |

## 4.28 Política de ingresos del tesoro

INT no promete rendimiento, revalorización ni respaldo de precio. Si un producto de datos u otra actividad genera ingresos, su asignación al tesoro, a operaciones, a incentivos de staking o a recompra y quema solo puede realizarse bajo una política publicada y tras la revisión legal necesaria.

Cualquier asignación de ingresos o incentivo de staking se publica junto con su importe, período, responsable autorizado y registro en cadena. Esta sección no constituye un compromiso de ingresos, quemas ni pagos de staking futuros.

## 4.29 Posibles fuentes de ingresos

Las posibles fuentes de ingresos sujetas a la política del tesoro incluyen:

- **Ventas de datos anonimizados.** Datos a nivel de recibo k-anonimizados y agregados vendidos a marcas de FMCG, minoristas, firmas de investigación y desarrolladores a través de acceso API por niveles.
- **Ingresos por afiliación y referencia.** Clics de comparación de precios hacia socios minoristas o de cupones (planificado).
- **Suscripción premium.** Funciones avanzadas de analítica personal y automatización de objetivos (planificado).

Los detalles de generación de ingresos y la arquitectura de anonimización se describen en 05 Esquema de datos y API.

## 4.30 Quema por informe de datos

El modelo planificado de acceso a informes de datos puede requerir la quema de INT para determinados tipos de informe. Si se habilita este modelo, la quema se registra en cadena y se publican el tipo de informe y el importe.

Una quema reduce el INT en circulación; no garantiza un resultado para el precio, valor o demanda del token. El importe por informe solo entra en vigor cuando se publiquen la política del tesoro y el precio del producto aplicables.
