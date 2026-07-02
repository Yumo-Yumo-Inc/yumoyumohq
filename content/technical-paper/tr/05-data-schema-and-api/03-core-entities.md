# Çekirdek varlıklar

## 5.2 Çekirdek varlıklar

```mermaid
erDiagram
    USER ||--o{ WALLET : "sahiptir"
    USER ||--o{ RECEIPT : "yükler"
    USER ||--|| HEALTH_SNAPSHOT : "mevcut"
    USER ||--|| LEVEL : "mevcut"
    RECEIPT ||--o{ RECEIPT_LINE_ITEM : "içerir"
    RECEIPT }o--|| MERCHANT : "burada"
    RECEIPT_LINE_ITEM }o--o| CANONICAL_PRODUCT : "çözülür"
    RECEIPT_LINE_ITEM ||--o| PRICE_OBSERVATION : "üretir"
    RECEIPT ||--o| TRUST_SCORE : "puanlanır"
    RECEIPT ||--o{ BINT_LEDGER_ENTRY : "kredilenir"
    BINT_LEDGER_ENTRY }o--|| INT_ONCHAIN_EVENT : "mutabık"
    RECEIPT ||--o{ EPOINTS_RECORD : "üretir"
    USER ||--|| FOUNDATION_NFT : "sahiptir"

    CANONICAL_PRODUCT }o--|| BRAND : "aittir"
    CANONICAL_PRODUCT }o--|| CATEGORY : "aittir"
    MERCHANT }o--o| CHAIN : "üyedir"
```

Çoklukla ilgili kurallar önemlidir: **bir fişin birçok kalemi vardır**, **bir kalem en fazla bir kanonik ürüne çözülür** (veya bekleyen kuyruğa düşerse hiçbirine), **bir fiş en fazla bir güven puanı yayar** (yeniden puanlanabilir; her yeni sürüm bir öncekini geçersiz kılar).

---
