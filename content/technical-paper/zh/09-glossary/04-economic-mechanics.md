# 經濟機制

## 經濟機制

- **TGE（Token Generation Event，代幣生成事件）** — INT 成為即時鏈上資產且 cPoints 遷移至 bINT 的時刻。
- **發放曲線** — 使用者獎勵發放時程，以每月活躍使用者數與 TGE 後時間索引。*見：04。*
- **轉換比率（bINT → INT）** — 決定每單位 bINT 可轉換為多少 INT 的年度索引乘數。*見：04。*
- **每日 bINT 上限** — 使用者每日可賺取的最大 bINT 數量。計算方式為 `base_cap × level_multiplier × health_score`。*見：03 信任層、04 代幣經濟學機制。*
- **回購銷毀（Buy-back-and-burn，BBB）** — 金庫政策下用於減少 INT 流通量的基於規則銷毀機制。執行細節為營運機密。*見：04。*
- **流動性啟動池（Liquidity Bootstrapping Pool，LBP）** — 一種可調整權重的 DEX 池格式，用於啟動新代幣。考慮用於 INT 初始流動性。
- **單邊流動性提供者（Single-sided LP）** — 僅需配對中兩種資產之一的流動性提供。用於以鎖定 LP 啟動初始 INT 池。
