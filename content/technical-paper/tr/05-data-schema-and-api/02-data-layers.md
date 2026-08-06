# Veri katmanları (Vision özet)

## 5.1 Veri katmanları (Vision özet)

Vision Paper veri katmanlarını tanımlar; bu bölüm her birini somut depolamaya eşler ve hangisinin neyi sorgulayabileceğini gösterir.

| Katman | Burada ne yaşar | Kullanıcı erişimi | Operasyon erişimi | B2B erişimi |
|---|---|---|---|---|
| **Cihaz** | Orijinal fiş görseli | Kendi verisi | Cihaz kapsamı | Cihaz kapsamı |
| **Kayıt sistemi** | Fiş kayıtları, kalemler, ödül olayları — tek yönetilen Postgres (Neon) | Kendi verisi | Operasyonel | Toplam katman |
| **Anonimleştirilmiş toplam** | k-anonim paneller ve indeksler | Toplam görünüm | Operasyonel | Toplam görünüm |
| **Zincir üstü özet** | Epoch Merkle kökleri (ödül + fiyat), INT olayları | Açık | Açık | Açık |

Kayıt sisteminin yaşa dayalı sıcak/ılık katmanlaması bir **ölçekleme seçeneğidir**; hacim gerektirdiğinde devreye alınmak üzere planlanmıştır. Bugün tek bir Postgres örneği tüm geçmişi tutar.

Katı kural: **anonimleştirilmiş toplam, tek kullanıcı kayıtlarından ayrıştırılmıştır.** 5.8 dönüşümü belirler.

---
