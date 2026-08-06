# İndeksleme ve ölçekleme

## 5.12 İndeksleme ve ölçekleme

Kayıt sistemi, geleneksel B-tree indeksli **tek bir yönetilen Postgres örneğidir (Neon)**; geliştirme ve üretim ayrı dallardan (branch) sunulur. Temsili indeks sınıfları:

| Tablo | İndeks | Kullanım |
|---|---|---|
| `receipts` | kullanıcı + yükleme zamanı | Kullanıcının fişlerini listeleme |
| `receipts` | işletme + yükleme zamanı | İşletme geçmişi |
| `receipt_line_items` | kanonik ürün | Fiyat geçmişi okumaları |
| `price_epoch_observations` | epoch + yaprak indeksi | Epoch okumaları ve dahil edilme kanıtları |
| `contribution_point_events` | kullanıcı + oluşturma zamanı | Bakiye sorguları |
| `merchants` | vergi no + ülke (unique, kısmi) | İşletme kimliği çözümleme |

`receipts` ve `receipt_line_items` tablolarının zamana göre bölümlenmesi ve eski verinin daha düşük maliyetli analitik katmana taşınması, hacim gerektirdiğinde devreye alınacak **ölçekleme seçenekleridir**; mevcut hacim tek örnek ve geleneksel indekslemeyle karşılanır. Spesifik motor ayarları iç operasyon katmanında kalır.

---
