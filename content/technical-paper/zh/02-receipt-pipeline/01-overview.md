# 02 — 收據處理管線

收據處理管線將使用者提交的收據圖片或 PDF 發票轉換為結構化的收據記錄。公開契約為階段順序與每個階段的輸入/輸出型別；供應商選擇、提示詞細節、門檻值與備援規則則保留於營運文件中。

管線分離兩項輸出：向使用者顯示的已驗證預覽，以及寫入獎勵分類帳的會計事件。這使使用者體驗與鏈上結算彼此獨立。

## 2.1 設計目標

| 目標 | 技術影響 |
|---|---|
| 低延遲 | 面向使用者的預覽於同步流程中產生 |
| 型別化階段交接 | 每個階段輸出與綱要綁定的結果供下一階段使用 |
| 可重新執行 | 階段輸出記錄為事件；失敗作業可使用相同輸入重試 |
| 品質分離 | 低信心度收據可從獎勵會計中分離或轉入審查 |
| 隱私 | 原始收據內容於鏈下資料層處理；資料產品衍生自匿名化層 |

## 2.2 管線概覽

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant C as 客戶端
    participant API as API 介面
    participant S as 儲存層
    participant P as 處理管線
    participant V as 驗證層
    participant M as 標準配對
    participant T as 信任層
    participant L as 獎勵分類帳

    U->>C: 選取或拍攝收據
    C->>C: 本地預處理
    C->>API: 請求上傳工作階段
    API-->>C: 上傳目標 + receipt_id
    C->>S: 上傳收據輸入
    C->>API: 開始處理
    API->>P: 提取文字與欄位
    P-->>API: ReceiptExtraction
    API->>V: 檢查日期、總額、幣別、一致性
    V-->>API: ValidationResult
    API->>M: 解析商家與商品引用
    M-->>API: CanonicalReceipt
    API->>T: 產生信任級距
    T-->>API: TrustDecision
    API->>L: 寫入獎勵會計事件
    API-->>C: 已驗證預覽
    Note over L: 鏈上結算為獨立的批次流程
```

各階段透過型別化事件而非共享可變狀態連接。這使流程可觀測，並允許歷史重新處理。
