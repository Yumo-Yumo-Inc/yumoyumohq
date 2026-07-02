# Superficie de contratos inteligentes

## 4.15 Modelo de programa

La v1 se ejecuta sobre programas auditados y ampliamente utilizados en lugar de código de protocolo personalizado. No se despliega ningún programa on-chain a medida para la capa de recompensas; cada función on-chain se asigna a un programa desplegado y revisado externamente.

| Función | Programa | Modelo de autoridad |
|---|---|---|
| Emisión y quema de INT | SPL Token | Autoridad de acuñación cerrada tras el génesis; quema bajo multifirma |
| Distribución y reclamación de recompensas | Distribuidor merkle auditado | Raíz por época; la autoridad de fijación de raíz es multifirma |
| Tesoro y autoridades | Multifirma de Squads | Aprobaciones separadas de raíz / tesoro / clawback |
| Foundation NFT | Token-2022 (NonTransferable) | Acuñación por backend, una por billetera |
| Compromisos de transparencia | Programa Memo | Raíz de época y hash del conjunto de datos escritos on-chain |

bINT y ePoints son unidades contables off-chain. No son tokens on-chain; sus saldos residen en la capa operativa y se liquidan en INT a través del distribuidor.

## 4.16 Qué va on-chain

La capa on-chain porta los eventos del token INT, la raíz de distribución por época, los cambios de autoridad del tesoro y los compromisos de transparencia. La capa off-chain porta el motor de recompensas (contribución → cantidad → raíz), el contenido del recibo, las señales de confianza y el historial de comportamiento.

El conjunto de datos de recompensas publicado se escribe en almacenamiento permanente; su hash y la raíz de época se comprometen on-chain. Terceros pueden recalcular su propio saldo a partir de los datos publicados y compararlo con la raíz on-chain, mientras que el contenido del recibo permanece en la capa de datos off-chain.

## 4.17 Integridad de la liquidación

Antes de firmar una raíz de distribución, un verificador independiente la recalcula a partir del mismo libro mayor de origen y comprueba las invariantes de asignación acumulada (4.18). Una raíz que no coincide con el recálculo, o que vulneraría un techo de asignación, no procede a la firma. La firma de raíces y los movimientos del tesoro requieren aprobación múltiple a través de la multifirma de Squads.

Esta separación mantiene el cálculo de recompensas, la verificación independiente y el movimiento de fondos en manos distintas: un único servidor comprometido no puede mover fondos por sí solo.

## 4.18 Postura de auditoría

La superficie on-chain se apoya en programas que ya están auditados y en amplio uso en producción. El motor de recompensas off-chain y el verificador independiente se revisan antes del lanzamiento, con un archivo público de informes y un canal de reporte de seguridad. El alcance y los enlaces a los informes se publican a medida que se completan las revisiones.
