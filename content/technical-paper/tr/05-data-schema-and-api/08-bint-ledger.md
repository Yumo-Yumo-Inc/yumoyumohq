# bINT defteri (bağlayıcı)

## 5.7 bINT defteri (bağlayıcı)

bINT kredilerinin zincir dışı aynası. Yalnız-ekleme.

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

### Niçin kriptografik zincir

`previous_entry_hash` + `entry_hash` defter üzerinde bir hash zinciri oluşturur. Bu, Yumo Yumo'ya **doğrulanabilir bir denetim günlüğü** verir: defter operasyonel olarak bir Postgres tablosu olsa da hash zinciri kurcalama girişiminin saptanmasını sağlar. En son `entry_hash` periyodik olarak zincir üstüne yayınlanır (bir Merkle kök taahhüdü) ki dış taraflar defter bütünlüğünü doğrulayabilsin.

### Mutabakat

Mutabakat işçisi `settled_to_chain_at IS NULL` olan `BintLedgerEntry` satırlarını gruplar ve toplam bINT'i Solana'da basar. Onaydan sonra `settled_to_chain_at` ve `onchain_tx_signature` doldurulur. O noktadan itibaren o satır için zincir üstü durum doğruluk kaynağıdır.

---
