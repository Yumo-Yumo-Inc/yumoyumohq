# Libro mayor bINT (normativo)

## 5.7 Libro mayor bINT (normativo)

El espejo fuera de la cadena de los créditos bINT. Solo adición.

```json
// BintLedgerEntry
{
  "ledger_entry_id": "01HXY...",
  "user_id": "01HXY...",
  "wallet_address": "5Hg2...8fpA",
  "source": "receipt",
  "source_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
  "amount_minor": 12500,
  "currency_code": "bINT",
  "trust_score_at_credit": "0.XX",
  "level_at_credit": "<L>",
  "health_at_credit": "0.XX",
  "daily_cap_band": "<band>",
  "created_at": "2026-05-17T14:23:12Z",
  "settled_to_chain_at": null,
  "onchain_tx_signature": null,
  "previous_entry_hash": "sha256:9a01...",
  "entry_hash": "sha256:b3f8..."
}
```

### Por qué una cadena criptográfica

`previous_entry_hash` + `entry_hash` forman una cadena de hash sobre el libro mayor. Esto le da a Yumo Yumo un **registro de auditoría verificable**: aunque el libro mayor es operacionalmente una tabla de Postgres, la cadena de hash significa que un intento de manipulación es detectable. El `entry_hash` más reciente se publica on-chain periódicamente (un compromiso de raíz Merkle) para que partes externas puedan verificar la integridad del libro mayor.

### Liquidación

El trabajador de liquidación agrupa filas de `BintLedgerEntry` con `settled_to_chain_at IS NULL` y acuña el bINT agregado en Solana. Tras la confirmación, `settled_to_chain_at` y `onchain_tx_signature` se completan. Desde ese momento, el estado on-chain es la fuente de verdad para esa entrada.

---
