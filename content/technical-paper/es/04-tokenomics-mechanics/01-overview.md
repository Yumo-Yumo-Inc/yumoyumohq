# 04 — Mecánicas de Tokenomics

Esta sección traduce la intención económica del Vision Paper en mecánicas de implementación: los roles desempeñados por INT, bINT, ePoints y el Foundation NFT; el camino que sigue la contabilidad de recompensas; y cómo el staking, el tesoro y las mecánicas de recompra/quema se sitúan dentro del protocolo.

El documento técnico público explica las relaciones mecánicas, el flujo contable y las responsabilidades on-chain. Los parámetros específicos de la curva de emisión, los techos a nivel de usuario, los ratios operativos del tesoro y los dictámenes legales por jurisdicción se gestionan en las capas operativas y legales.

## 4.0 Superficie mecánica

| Mecánica | Alcance público |
|---|---|
| INT | Token principal on-chain y contabilidad de circulación |
| bINT | Representación de recompensa pre-liquidación por contribución verificada |
| ePoints | Capa de progreso en la aplicación y actividad estacional |
| Foundation NFT | Representación de contribución temprana y nivel |
| Staking | Semántica de bloqueo, acumulación y participación en el protocolo |
| Treasury | Relación entre entradas de ingresos, operaciones, reservas y economía del token |
| Oferta y asignación | Oferta total, porcentajes por rail, cantidades de tokens (4.16–4.18) |
| Emisión y desbloqueos | Bandas de emisión diaria basadas en MAU, calendarios de desbloqueo por rail (4.19–4.21) |
| Techos de recompensa | Límites por recibo y diarios según nivel de usuario (4.22–4.23) |
| Conversión y circulación | Ratio bINT→INT fijo 1:1, modelo de oferta circulante (4.24–4.26) |
| Utilidad de INT | Recompensa, staking, recompra y quema, gobernanza, acceso vinculado (4.27–4.29) |
