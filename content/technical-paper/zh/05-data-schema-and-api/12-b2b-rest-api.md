# B2B REST API

## 5.11 B2B REST API

獨立的基底網址、獨立的認證、獨立的速率限制。

```
Base: https://b2b-api.yumo.io/v1
Auth: API 金鑰 + 具重播保護的認證請求。簽署方案與重播視窗由內部營運層管理。
Rate limit: 依級距而定 · 與公開 API 分離的配額
```

| 方法 | 路徑 | 用途 |
|---|---|---|
| GET | `/inflation-pulse` | TR 通膨脈衝數列 |
| GET | `/basket-panel` | 購物籃面板查詢 |
| GET | `/merchant-benchmarks` | 商家基準 |
| POST | `/cohort-query` | 自訂群組，強制執行 k-底線 |
| GET | `/catalog` | 可用產品 + 新鮮度 + 定價 |
| GET | `/methodology/{version}` | 特定版本的方法論文件 |

每個 B2B 回應包含 `methodology_version`、`k_anonymity_floor` 與回應的貢獻者數量，使買方的合規團隊能審計發布內容。

---
