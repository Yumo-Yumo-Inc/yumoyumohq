# Clases de token

## 4.1 Las cuatro clases

Yumo Yumo opera con cuatro clases de activos, cada una con un rol distinto. Solo dos son tokens on-chain; las otras dos son registros off-chain.

| Clase | Forma | Modelo de transferencia | Rol |
|---|---|---|---|
| **INT** | Token SPL en Solana | Transferible en mercado | Coordinación a nivel de protocolo, staking, incentivos del ecosistema. Los parámetros de oferta están en el Vision Paper. |
| **bINT** | Unidad contable off-chain (capa operativa) | Se liquida a INT mediante un ciclo de vida definido | Capa de contabilidad de contribución entre el trabajo y la recompensa. |
| **ePoints** | Registro off-chain, denominado en USD | Crédito de insight en la aplicación | Registro del coste oculto a nivel de hogar revelado por cada recibo verificado. |
| **Foundation NFT (Yumbie)** | Activo no transferible Token-2022 | No transferible | Identidad persistente. Evoluciona al Smart Agent en el hito definido en el Vision Paper. |

### Por qué cuatro clases

El Vision Paper explica la razón de experiencia de usuario. La razón mecánica es la separación de responsabilidades:

- INT se mueve a través de mercados e intercambios; es transferible y fungible.
- bINT mide la contribución y se liquida a INT; es una unidad off-chain, por lo que la contabilidad puede evolucionar sin una migración on-chain.
- ePoints porta una señal de insight económico como su propio registro off-chain, de modo que la analítica del usuario puede crecer mientras la oferta de INT permanece fija.
- El Foundation NFT porta la continuidad de identidad como un activo Token-2022 no transferible, uno por billetera.

## 4.2 Estructura de autoridad

La autoridad difiere según si una clase es on-chain u off-chain.

- **Autoridad de acuñación (mint) de INT** — se mantiene solo hasta que la oferta completa se acuña en el génesis, luego se cierra. Después del génesis no se puede acuñar INT; la distribución es una transferencia del tesoro a través del distribuidor auditado (4.15).
- **Tesoro y quema de INT** — en manos de la multifirma de Squads, con aprobaciones separadas para la firma de la raíz de distribución, el movimiento del tesoro y la recuperación (clawback) de reservas.
- **bINT y ePoints** — unidades contables off-chain en la capa operativa. No tienen autoridad on-chain de acuñación ni de congelación; sus saldos se liquidan a INT a través del ciclo de vida en 4.4.
- **Foundation NFT** — Token-2022 con la extensión no transferible, acuñado por el backend una vez por billetera. La no transferibilidad se aplica en la capa del programa de token.

Mantener bINT y ePoints off-chain elimina la autoridad on-chain por evento del camino de contribución; la única autoridad a nivel de INT que persiste después del génesis es la multifirma sobre el tesoro, las raíces de distribución y las quemas.
