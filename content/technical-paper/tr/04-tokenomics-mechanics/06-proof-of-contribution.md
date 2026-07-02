# Proof of Contribution rayı

## 4.11 Bu ray neyi finanse eder

Proof of Contribution (PoC) rayı, INT tahsisinin mühendislik, tasarım, yönetişim ve ekosistem aktivasyonu işlerini ödüllendiren payıdır. Vision Paper tahsis payını belirler. Kurucu ekip, tam zamanlı işe alımlar, sözleşmeliler ve dış katkıcıların tümü PoC üzerinden, aynı etki ağırlıklı mantıkla kazanır.

Bu kasıtlı bir yapısal seçimdir. "Ekip token'ları"nı "katkıcı token'ları"ndan ayırmak geleneksel düzendir; ekibe etki gözetmeksizin sabit bir tahsis verir ve uzun vadeli token sahibi güvenini bastıran bir asimetri yaratır. PoC rayı, kullanıcı-ödülü-dışı tüm ihraçları aynı işle-kazanılan mekanizmasından yönlendirerek o asimetriyi kapatır.

## 4.12 Dağıtımlar nasıl puanlanır

PoC ihracı periyodik dağıtımlarla gerçekleşir. Her dağıtım, yakın katkıları yazılı bir etki değerlendirme çizelgesine karşı puanlar ve dönemin PoC bütçesini orantılı olarak ayırır. Değerlendirme çizelgesi ayrı olarak belgelenir ve protokolün yüzeyi evrildikçe güncellenir; mevcut kategoriler şunları içerir:

- Protokol mühendisliği (akıllı kontrat geliştirme, boru hattı operasyonu, altyapı).
- Uygulama mühendisliği (mobil, web, yüzeyler).
- Araştırma ve ekonomik tasarım.
- Güvenlik, denetim irtibatı ve operasyonel risk işlemesi.
- Ekosistem aktivasyonu (pazar genişletme, ortak etkinleştirme, topluluk programları).
- Somutlaştıkça yönetişim işi.

Her katkıcı hak ediş eki ile bir INT dağıtımı alır. Hak kazanma takvimi politikadır; mevcut varsayılanlar mühendislik katkıları için endüstri standardı cliff-artı-doğrusal şekilleri ve proje sınırlı iş için daha kısa takvimleri takip eder.

## 4.13 Hak ediş

Tüm PoC ihracı hak ediş taşır. Hak kazanma parametreleri katkıcının rolüne ve dağıtımın kapsamına bağlıdır:

| Dağıtım kapsamı | Cliff | Doğrusal hak ediş ufku | Saklayıcı |
|---|---|---|---|
| Tam zamanlı çekirdek mühendislik | Standart cliff | Çok yıllık doğrusal | Alıcı başına hak ediş kontratı |
| Uzman sözleşmeli (denetim, güvenlik, tasarım) | Değişken, proje sınırlı | Projeyle hizalı | Görev başına hak ediş kontratı |
| Topluluk / yönetişim işi | Kısa veya yok | Dağıtımla hizalı | Doğrudan ihraç veya kısa hak ediş |

Tam cliff ve hak ediş süreleri politikadır ve her dağıtımın yayınlanmış kaydında belgelenir. Hak kazanma kontratları zincir üstü ve incelenebilirdir.

## 4.14 TGE'de cPoints → bINT taşıması

Token Üretim Olayı'ndan önce katkı kredileri cPoints olarak birikir. TGE'de cPoints devre dışı bırakılır ve yayınlanmış bir dönüşüm oranıyla bINT'e taşınır. Taşıma anlık görüntü tarihi olan tek seferlik bir olaydır. Dönüşüm oranı, yayınlanmış TGE takviminin parçasıdır ve anlık görüntü zamanında var olan kapalı beta katkı dağılımına karşı belirlenir.

cPoints sahipleri taşımayı cüzdanlarında tek seferlik bir bINT mint olarak görür; o andan itibaren standart bINT → INT yaşam döngüsü (4.4) uygulanır.
