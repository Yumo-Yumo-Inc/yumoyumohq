# Anti-istismar yaklaşımı

## 3.8 Tehdit modeli

Güven katmanı üç istismar sınıfına karşı tasarlanmıştır:

1. **Tek hesap tarlama** — bir kullanıcının aslında ödemediği fişleri yüklemesi veya birden fazla kez bINT kazanmak için aynı fişi kozmetik varyasyonlarla yeniden yüklemesi.
2. **Çoklu hesap tarlama** — bir operatörün kullanıcı başına günlük tavanı aşmak için birkaç hesap çalıştırması, bazen tek bir fişi bu hesaplar arasında paylaşması.
3. **Sentetik içerik** — gerçek bir işleme karşılık gelmeyen ama makul görünen, görsel sentez araçlarıyla üretilmiş fişler.

Her sınıfın kendi sinyal ailesi vardır. Katman, istismarın yinelemeli olduğunu — bir saldırganın sistemi yoklayıp ayar yapacağını — varsayar ve bu yüzden sabit kurallara dayanmak yerine zamanla yeniden kalibre olacak şekilde tasarlanmıştır.

## 3.9 Sinyal kategorileri

Üç sınıf genelinde, katman burada yüksek seviyede adlandırılan sinyal kategorilerinden yararlanır:

- **Algısal benzerlik** — aynı fişin yüklemeler arası yeniden kullanımını tespit eder.
- **Cihaz ve oturum sürekliliği** — bir hesabın protokolle etkileşim biçimindeki olağandışı düzenleri tespit eder.
- **Hesaplar arası korelasyon** — bağımsız hanelerle tutarsız düzenler paylaşan hesap kümelerini tespit eder.
- **Sentetik medya özgünlüğü** — fiziksel fiş fotoğraflarını makine üretimi görsellerden ayırır. Sinyaller iç operasyon katmanında yönetilir.
- **Davranışsal ritim** — hesap etkinliğini zaman içinde modeller. Bu kategoriyi oluşturan spesifik sinyaller iç operasyon katmanında yönetilir.

Her kategori, fişin güven puanını ve uygun olduğunda kullanıcının sağlığını besleyen sinyaller üretir. Belirli sinyaller, eşikler ve küme inşa yöntemi iç operasyon katmanında yönetilir.

## 3.10 Muamele

Muamele kademelidir:

- Tek başına bir sinyal, etkilenen fiş için **güven bandını düşürür**.
- Fişler arası bir sinyal kümesi, kullanıcının **sağlığını düşürür** ve günlük tavanı sıkıştırır.
- Kullanıcılar arası kalıcı bir düzen, operasyonel kuyrukta **bir inceleme vakası açar**; çözüm insan incelemesi, ek doğrulama veya — tekrarlanan ve net durumlarda — hesap seviyesi eylem içerebilir.

Kademeli muamele kasıtlıdır. Fişler ve kullanıcılar bir güven spektrumunda yer alır; protokolün ekonomik mantığı bu spektrumu okunabilir tutmaya bağlıdır.
