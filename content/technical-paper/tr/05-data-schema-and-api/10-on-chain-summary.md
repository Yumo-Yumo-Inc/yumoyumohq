# Zincir üstü veri özeti

## 5.9 Zincir üstü veri özeti

Zincir üstüne ne çıkar, kategoriye göre:

| Zincir üstü | Zincir dışı |
|---|---|
| Ödül epoch'u Merkle kökü (memo mührü) | Bireysel `contribution_point_events` satırları |
| Fiyat epoch'u Merkle kökü + manifest hash'i (memo mührü) | bINT bakiyeleri ve birikim kayıtları |
| INT mint ve transfer olayları (planlı) | Kullanıcı başına ödül tahakkuk kayıtları |
| NFT seviye geçişleri (planlı) | OCR ham metin |
| | Fiş görselleri ve kalemler |
| | Güven puanı sinyalleri |

Kural: **zincir üstü taahhütleri ve toplamları saklar; zincir dışı içeriği saklar.** Bir kullanıcı, fiş içeriği zincir dışı veri katmanında kalırken zincir dışı bakiyesini zincir üstü taahhüde karşı doğrulayabilir.

Açık fiyat defterinin yayımlanma akışı ve özel fişin dahil edilme kanıtı 06'da tanımlanır.

---
