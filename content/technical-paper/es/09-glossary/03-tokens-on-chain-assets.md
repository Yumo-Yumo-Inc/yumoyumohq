# Tokens y activos on-chain

## Tokens y activos on-chain

- **INT** — Token de utilidad transferible de Yumo Yumo, emitido en Solana como un token SPL (decimales = 6, oferta total = 99.000.000.000). *Véase: 04 Mecánicas de Tokenomics.*
- **bINT** — Crédito de contribución soulbound acuñado en el Associated Token Account (ATA) congelado del usuario cuando un recibo es verificado. Se convierte en INT a un ratio indexado por año. *Véase: 04 Mecánicas de Tokenomics.*
- **ePoints** — Crédito de análisis soulbound denominado en USD que refleja el "hidden cost" revelado para un hogar a lo largo del tiempo. *Véase: 04 Mecánicas de Tokenomics, 05 Esquema de datos y API.*
- **cPoints** — Puntos de contribución pre-TGE; migrados a bINT en el Token Generation Event y mantenidos como registro de puntos archivado. *Véase: 04 Mecánicas de Tokenomics.*
- **Foundation NFT (Yumbie)** — Un NFT NonTransferable Token-2022 que representa la identidad Yumbie del usuario. Evoluciona al Smart Agent en el Nivel 30. *Véase: 00 Equipo y Filosofía de Construcción, 04 Mecánicas de Tokenomics.*
- **Smart Agent** — La evolución post-Nivel-30 del Foundation NFT. Un evento de acuñación unidireccional. *Véase: 04 Mecánicas de Tokenomics.*
- **SPL Token** — Estándar de token de Solana Program Library. El "ERC-20 de Solana." Usado para INT.
- **Token-2022** — Estándar de token con extensiones de Solana. Usado para Foundation NFTs con la extensión NonTransferable.
- **Frozen ATA** — Un Associated Token Account que contiene bINT (o ePoints) y está vinculado al usuario por la autoridad de emisión. Aplica comportamiento soulbound a nivel de protocolo. *Véase: 04 Mecánicas de Tokenomics.*
- **Soulbound** — Comportamiento de token vinculado a una sola billetera durante la vida del activo.
