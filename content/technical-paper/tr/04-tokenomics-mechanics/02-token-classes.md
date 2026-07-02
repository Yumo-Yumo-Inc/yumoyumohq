# Token sınıfları

## 4.1 Dört sınıf

Yumo Yumo, her biri ayrı bir rol taşıyan dört varlık sınıfıyla çalışır. Bunlardan yalnızca ikisi zincir üstü token; diğer ikisi zincir dışı kayıttır.

| Sınıf | Biçim | Devir modeli | Rol |
|---|---|---|---|
| **INT** | Solana üzerinde SPL token | Piyasada devredilebilir | Protokol düzeyinde koordinasyon, staking, ekosistem teşvikleri. Arz parametreleri Vision Paper'da yer alır. |
| **bINT** | Zincir dışı muhasebe birimi (operasyon katmanı) | Tanımlı bir yaşam döngüsü üzerinden INT'e mutabakat eder | İş ile ödül arasındaki katkı muhasebesi katmanı. |
| **ePoints** | Zincir dışı, USD cinsinden kayıt | Uygulama içi içgörü kredisi | Doğrulanmış her fişte yüzeye çıkan hane düzeyindeki gizli maliyetin kaydı. |
| **Foundation NFT (Yumbie)** | Token-2022 devredilemez varlık | Devredilemez | Kalıcı kimlik. Vision Paper'da tanımlanan dönüm noktasında Smart Agent'a evrilir. |

### Neden dört sınıf

Kullanıcı deneyimi gerekçesini Vision Paper açıklar. Mekanik gerekçe ise sorumlulukların ayrılmasıdır:

- INT piyasalar ve borsalar arasında hareket eder; devredilebilir ve değiştirilebilirdir.
- bINT katkıyı ölçer ve INT'e mutabakat eder; zincir dışı bir birim olduğundan muhasebe, zincir üstü bir göç gerektirmeden evrilebilir.
- ePoints kendi zincir dışı kaydı olarak bir ekonomik içgörü sinyali taşır; böylece kullanıcı analitiği büyürken INT arzı sabit kalır.
- Foundation NFT, devredilemez bir Token-2022 varlığı olarak kimlik sürekliliğini taşır; cüzdan başına bir adet.

## 4.2 Yetki yapısı

Yetki, bir sınıfın zincir üstü mü yoksa zincir dışı mı olduğuna göre değişir.

- **INT mint yetkisi** — yalnızca genesis'te tüm arz basılana kadar tutulur, sonra kapatılır. Genesis sonrası hiç INT basılamaz; dağıtım, denetlenmiş dağıtıcı (4.15) üzerinden yapılan bir hazine transferidir.
- **INT hazinesi ve yakım** — Squads çoklu imzasında tutulur; dağıtım kökü imzalama, hazine hareketi ve rezerv geri çağırma için ayrılmış onaylarla.
- **bINT ve ePoints** — operasyon katmanındaki zincir dışı muhasebe birimleridir. Zincir üstü mint veya dondurma yetkileri yoktur; bakiyeleri 4.4'teki yaşam döngüsü üzerinden INT'e mutabakat eder.
- **Foundation NFT** — devredilemez uzantılı Token-2022; arka uç tarafından cüzdan başına bir kez basılır. Devredilemezlik, token-program katmanında uygulanır.

bINT ve ePoints'i zincir dışı tutmak, katkı yolundan olay başına zincir üstü yetkiyi kaldırır; genesis sonrası kalıcı tek INT düzeyi yetki, hazine, dağıtım kökleri ve yakımlar üzerindeki çoklu imzadır.
