# 代幣與鏈上資產

## 代幣與鏈上資產

- **INT** — Yumo Yumo 的可轉移功能性代幣，於 Solana 上以 SPL 代幣發行（小數位數 = 6，總供應量 = 99,000,000,000）。*見：04 代幣經濟學機制。*
- **bINT** — 靈魂綁定貢獻額度，於收據驗證時鑄造至使用者的凍結 Associated Token Account（ATA）。以年度索引比率轉換為 INT。*見：04 代幣經濟學機制。*
- **ePoints** — 以美元計價的靈魂綁定洞察額度，反映家庭隨時間浮現的「隱藏成本」。*見：04 代幣經濟學機制、05 資料架構與 API。*
- **cPoints** — TGE 前貢獻點數；於代幣生成事件時遷移至 bINT，並保留為歸檔點數記錄。*見：04 代幣經濟學機制。*
- **Foundation NFT（Yumbie）** — 代表使用者 Yumbie 身分的 Token-2022 NonTransferable NFT。於等級 30 演化為 Smart Agent。*見：00 團隊與組織、04 代幣經濟學機制。*
- **Smart Agent** — Foundation NFT 於等級 30 後的演化形態。單向鑄造事件。*見：04 代幣經濟學機制。*
- **SPL Token** — Solana Program Library 代幣標準。Solana 的「ERC-20」。INT 使用此標準。
- **Token-2022** — Solana 的擴充功能代幣標準。Foundation NFT 使用 NonTransferable 擴充功能。
- **Frozen ATA** — 持有 bINT（或 ePoints）並由鑄造權限綁定至使用者的 Associated Token Account。於協議層強制執行靈魂綁定行為。*見：04 代幣經濟學機制。*
- **Soulbound（靈魂綁定）** — 代幣行為於資產生命週期中綁定至單一錢包。
