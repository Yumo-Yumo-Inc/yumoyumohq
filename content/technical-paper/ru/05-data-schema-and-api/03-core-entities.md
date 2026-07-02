# Основные сущности

## 5.2 Основные сущности

```mermaid
erDiagram
    USER ||--o{ WALLET : owns
    USER ||--o{ RECEIPT : uploads
    USER ||--|| HEALTH_SNAPSHOT : has_current
    USER ||--|| LEVEL : has_current
    RECEIPT ||--o{ RECEIPT_LINE_ITEM : contains
    RECEIPT }o--|| MERCHANT : at
    RECEIPT_LINE_ITEM }o--o| CANONICAL_PRODUCT : resolves_to
    RECEIPT_LINE_ITEM ||--o| PRICE_OBSERVATION : emits
    RECEIPT ||--o| TRUST_SCORE : scored_by
    RECEIPT ||--o{ BINT_LEDGER_ENTRY : credits
    BINT_LEDGER_ENTRY }o--|| INT_ONCHAIN_EVENT : settles_to
    RECEIPT ||--o{ EPOINTS_RECORD : produces
    USER ||--|| FOUNDATION_NFT : has

    CANONICAL_PRODUCT }o--|| BRAND : belongs_to
    CANONICAL_PRODUCT }o--|| CATEGORY : belongs_to
    MERCHANT }o--o| CHAIN : member_of
```

Кардинальности имеют значение: **один чек содержит много строк**, **одна строка разрешается максимум в один канонический продукт** (или ни в один, если попадает в очередь ожидания), **один чек испускает максимум одну оценку доверия** (переоценка возможна, но каждая версия заменяет предыдущую).

---
