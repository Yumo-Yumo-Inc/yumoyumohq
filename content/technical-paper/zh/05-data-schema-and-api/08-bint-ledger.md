# bINT 分類帳（規範）

## 5.7 bINT 分類帳（規範）

bINT 額度的鏡像分類帳。僅追加。

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

### 為何使用密碼學鏈

`previous_entry_hash` + `entry_hash` 在分類帳上形成雜湊鏈。這賦予 Yumo Yumo 一個**可驗證的審計日誌**：即使分類帳在營運上是一張 Postgres 資料表，雜湊鏈意味著竄改嘗試可被偵測。最新的 `entry_hash` 定期在鏈上公布（Merkle 根承諾），使外部方能驗證分類帳完整性。

### 結算

結算工作者批次處理 `settled_to_chain_at IS NULL` 的 `BintLedgerEntry` 列，並在 Solana 上鑄造彙總後的 bINT。確認後，`settled_to_chain_at` 與 `onchain_tx_signature` 會被填入。從該時刻起，鏈上狀態成為該筆記錄的真相來源。

---
