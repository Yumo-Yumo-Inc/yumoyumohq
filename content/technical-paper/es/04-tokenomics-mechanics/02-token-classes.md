# Clases de token

## 4.1 Las tres clases

Yumo Yumo opera con tres clases de activos, cada una con un rol distinto. Dos son tokens on-chain; una es un registro off-chain — la capa contable de bINT. El insight de coste oculto se calcula y se muestra por recibo verificado como un resultado analítico; no es una clase de activo ni un crédito.

| Clase | Forma | Modelo de transferencia | Rol |
|---|---|---|---|
| **INT** | Token SPL en Solana | Transferible en mercado | Coordinación a nivel de protocolo, staking, incentivos del ecosistema. Los parámetros de oferta están en el Vision Paper. |
| **bINT** | Unidad contable off-chain (capa operativa) | Se liquida a INT mediante un ciclo de vida definido | Capa de contabilidad de contribución entre el trabajo y la recompensa. |
| **SBT de proof-of-expense** | Activo no transferible Token-2022 | No transferible | Marca la billetera como contribuidor de gasto verificado; se acuña una vez por cuenta. |

### Por qué tres clases

El Vision Paper explica la razón de experiencia de usuario. La razón mecánica es la separación de responsabilidades:

- INT se mueve a través de mercados e intercambios; es transferible y fungible.
- bINT mide la contribución y se liquida a INT; es una unidad off-chain, por lo que la contabilidad puede evolucionar sin una migración on-chain.
- El SBT de proof-of-expense porta la identidad de contribuidor como un activo Token-2022 no transferible, uno por billetera.

## 4.2 Estructura de autoridad

La autoridad difiere según si una clase es on-chain u off-chain.

- **Autoridad de acuñación (mint) de INT** — se mantiene solo hasta que la oferta completa se acuña en el génesis, luego se cierra. Después del génesis no se puede acuñar INT; la distribución es una transferencia del tesoro a través del distribuidor auditado (4.15).
- **Tesoro y quema de INT** — en manos de la multifirma de Squads, con aprobaciones separadas para la firma de la raíz de distribución, el movimiento del tesoro y la recuperación (clawback) de reservas.
- **bINT** — unidad contable off-chain en la capa operativa. No tiene autoridad on-chain de acuñación ni de congelación; sus saldos se liquidan a INT a través del ciclo de vida en 4.4.
- **SBT de proof-of-expense** — Token-2022 con la extensión no transferible, acuñado por el backend una vez por billetera. La no transferibilidad se aplica en la capa del programa de token.

Mantener bINT off-chain elimina la autoridad on-chain por evento del camino de contribución; la única autoridad a nivel de INT que persiste después del génesis es la multifirma sobre el tesoro, las raíces de distribución y las quemas.
