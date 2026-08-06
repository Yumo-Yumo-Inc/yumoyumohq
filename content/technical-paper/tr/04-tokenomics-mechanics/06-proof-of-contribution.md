# Proof of Contribution rayı

## 4.11 Bu ray neyi finanse eder

Proof of Contribution (PoC) rayı, INT tahsisinin mühendislik, tasarım, yönetişim ve ekosistem aktivasyonu işlerini ödüllendiren payıdır. Vision Paper tahsis payını belirler. Kurucu ekip, tam zamanlı işe alımlar, sözleşmeliler ve dış katkıcıların tümü PoC üzerinden, aynı etki ağırlıklı mantıkla kazanır.

PoC, ekip ve dış katkıcı dağıtımlarını aynı yayımlanmış değerlendirme ve hak ediş sürecine bağlar. Bu tasarım tek başına adil dağıtımı garanti etmez; denetlenebilirlik, sürümlü değerlendirme çizelgesinin, dağıtım kayıtlarının ve hak ediş sözleşmelerinin yayımlanmasına bağlıdır.

## 4.12 Dağıtımlar nasıl puanlanır

PoC ihracı periyodik dağıtımlarla gerçekleşir. Her dağıtım, yakın katkıları yazılı bir etki değerlendirme çizelgesine karşı puanlar ve dönemin PoC bütçesini orantılı olarak ayırır. Değerlendirme çizelgesi ayrı olarak belgelenir ve protokolün yüzeyi evrildikçe güncellenir; mevcut kategoriler şunları içerir:

- Protokol mühendisliği (akıllı kontrat geliştirme, boru hattı operasyonu, altyapı).
- Uygulama mühendisliği (mobil, web, yüzeyler).
- Araştırma ve ekonomik tasarım.
- Güvenlik, denetim irtibatı ve operasyonel risk işlemesi.
- Ekosistem aktivasyonu (pazar genişletme, ortak etkinleştirme, topluluk programları).
- Somutlaştıkça yönetişim işi.

Her katkıcı için cliff, hak ediş süresi ve sözleşme adresi ilgili dağıtım kaydında açıkça belirtilir. Dağıtım yapılmadan önce değerlendirme çizelgesinin sürümü de aynı kayda eklenir.

## 4.13 Hak ediş

Tüm PoC ihracı hak ediş taşır; hiçbir PoC dağıtımı anında likit değildir. Hak kazanma parametreleri katkıcının rolüne ve dağıtımın kapsamına bağlıdır:

| Dağıtım kapsamı | Cliff | Doğrusal hak ediş ufku | Saklayıcı |
|---|---|---|---|
| Tam zamanlı çekirdek mühendislik | Standart cliff | Çok yıllık doğrusal | Alıcı başına hak ediş kontratı |
| Uzman sözleşmeli (denetim, güvenlik, tasarım) | Değişken, proje sınırlı | Projeyle hizalı | Görev başına hak ediş kontratı |
| Topluluk / yönetişim işi | Kısa veya yok | Dağıtımla hizalı | Doğrudan ihraç veya kısa hak ediş |

Tam cliff ve hak ediş süreleri politikadır ve her dağıtımın yayınlanmış kaydında belgelenir. Hak kazanma kontratları zincir üstü ve incelenebilirdir.

## 4.14 bINT muhasebe katmanı

Doğrulanmış her katkı, bINT muhasebe katmanında yalnızca-ekle bir defter olayı olarak kaydedilir. Epoch mutabakatı bu olayları doğrudan toplayıp toplamı düz 1:1 oranıyla (4.24) INT'e dönüştürür; standart bINT → INT yaşam döngüsü (4.4) uygulanır. Ayrı bir geçiş olayı, anlık görüntü veya dönüşüm adımı yoktur.
