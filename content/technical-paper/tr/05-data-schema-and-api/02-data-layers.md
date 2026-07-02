# Veri katmanları (Vision özet)

## 5.1 Veri katmanları (Vision özet)

Vision Paper dört veri katmanı tanımlar; bu bölüm her birini somut depolamaya eşler ve hangisinin neyi sorgulayabileceğini gösterir.

| Katman | Burada ne yaşar | Kullanıcı erişimi | Operasyon erişimi | B2B erişimi |
|---|---|---|---|---|
| **Cihaz** | Orijinal fiş görseli | Kendi verisi | Cihaz kapsamı | Cihaz kapsamı |
| **Sıcak sistem** | Fiş kayıtları, kalemler, son 90 gün | Kendi verisi | Operasyonel | Toplam katman |
| **Ilık sistem** | Sıcakla aynı, 91 gün-3 yıl | Kendi verisi | Operasyonel | Toplam katman |
| **Anonimleştirilmiş toplam** | k-anonim paneller ve indeksler | Toplam görünüm | Operasyonel | Toplam görünüm |
| **Zincir üstü özet** | bINT kredi hash'leri, INT olayları, NFT seviyeleri | Açık | Açık | Açık |

Katı kural: **anonimleştirilmiş toplam, kullanıcıdan ayrıştırılmış toplam katmandır.** 5.8 dönüşümü belirler.

---
