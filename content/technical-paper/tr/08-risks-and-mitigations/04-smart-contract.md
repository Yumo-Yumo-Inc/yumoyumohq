# Akıllı kontrat riski

## 8.8 Yüzey

Akıllı kontrat riski; token mint/burn, staking, hazine yönlendirmesi, hak ediş ve mutabakat taahhütleri gibi zincir üstü durum geçişlerinden doğar. Program hatası, yetki yanlış yapılandırması veya beklenmeyen ağ davranışı kullanıcı bakiyelerini, dolaşımdaki arzı veya hazine durumunu etkileyebilir.

## 8.9 Kontrol modeli

| Risk yüzeyi | Açık kontrol ilkesi |
|---|---|
| Program hatası | Bağımsız inceleme, test kapsamı, sürümlü dağıtım |
| Yetki yoğunlaşması | Çoklu onay sınıfı, gecikmeli icra, yetki ayrıştırma |
| Mutabakat tutarsızlığı | Zincir dışı defter taahhütleri ve tekrar üretilebilir olay modeli |
| Hazine kaynaklı piyasa etkisi | Kural tabanlı icra ve tamamlanan olayların açık izi |

Zincir üstü yetki modeli 04 §4.10'da açıklanır. İmza aracı, imzacı seti, eşik, gecikme penceresi, acil durum sırası ve müdahale adımları iç operasyon katmanında yönetilir.

## 8.10 Evrim

Zincir çalışma ortamı dış bir mutabakat katmanıdır. İşlem sırası, ücret piyasası, hesaplama sınırı ve ağ canlılığı gibi alanlar dağıtım öncesi inceleme, dağıtım sonrası izleme ve sürümlü güncelleme disipliniyle ele alınır.
