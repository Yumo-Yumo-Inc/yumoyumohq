# 02 — Fiş İşleme Boru Hattı

Fiş işleme boru hattı, kullanıcıdan gelen fiş görüntüsünü veya PDF faturayı yapılandırılmış bir fiş kaydına dönüştüren işleme zinciridir. Açık dokümanda açılan sözleşme, aşamaların sırası ve her aşamanın girdi/çıktı tipidir; sağlayıcı seçimi, istem ayrıntıları, eşik değerleri ve yedek kuralları operasyonel dokümantasyonda kalır.

Boru hattı iki çıktıyı birbirinden ayırır: kullanıcıya gösterilen doğrulanmış önizleme ve ödül defterine yazılan muhasebe olayı. Bu ayrım, kullanıcı deneyimini zincir üstü mutabakattan bağımsız tutar.

## 2.1 Tasarım hedefleri

| Hedef | Teknik sonuç |
|---|---|
| Düşük gecikme | Kullanıcıya dönen önizleme eşzamanlı akışta üretilir |
| Tipli aşama devri | Her aşama bir sonraki aşamaya şemalı çıktı verir |
| Tekrar çalıştırılabilirlik | Aşama çıktıları olay olarak kaydedilir; başarısız işler aynı girdiyle tekrar denenebilir |
| Kalite ayrımı | Düşük güvenli fişler ödül muhasebesinden ayrıştırılabilir veya incelemeye alınabilir |
| Gizlilik | Ham fiş içeriği zincir dışı veri katmanında işlenir; veri ürünü anonimleştirilmiş katmandan türetilir |

## 2.2 Bir bakışta boru hattı

```mermaid
sequenceDiagram
    autonumber
    actor U as Kullanıcı
    participant C as İstemci
    participant API as API yüzeyi
    participant S as Depolama
    participant P as İşleme hattı
    participant V as Doğrulama
    participant M as Kanonik eşleşme
    participant T as Güven katmanı
    participant L as Ödül defteri

    U->>C: Fiş seç veya çek
    C->>C: Yerel ön işleme
    C->>API: Yükleme oturumu iste
    API-->>C: Yükleme hedefi + receipt_id
    C->>S: Fiş girdisini yükle
    C->>API: İşlemeyi başlat
    API->>P: Metin ve alan çıkarımı
    P-->>API: ReceiptExtraction
    API->>V: Tarih, toplam, para birimi ve tutarlılık kontrolü
    V-->>API: ValidationResult
    API->>M: Satıcı ve ürün referanslarını çöz
    M-->>API: CanonicalReceipt
    API->>T: Güven bandı üret
    T-->>API: TrustDecision
    API->>L: Ödül muhasebe olayını yaz
    API-->>C: Doğrulanmış önizleme
    Note over L: Zincir üstü mutabakat ayrı yığın akışıdır
```

Aşamalar paylaşılan değişken durum yerine tipli olaylar üzerinden bağlanır. Bu yapı hem gözlemlenebilirliği hem de geri dönük yeniden işlemeyi mümkün kılar.
