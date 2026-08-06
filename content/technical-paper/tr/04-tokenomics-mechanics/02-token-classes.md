# Token sınıfları

## 4.1 Üç sınıf

Yumo Yumo, her biri ayrı bir rol taşıyan üç varlık sınıfıyla çalışır. İkisi zincir üstü token; biri zincir dışı kayıttır — bINT muhasebe katmanı. Gizli maliyet içgörüsü, doğrulanmış her fiş için bir analitik sonuç olarak hesaplanır ve gösterilir; bir varlık sınıfı veya kredi değildir.

| Sınıf | Biçim | Devir modeli | Rol |
|---|---|---|---|
| **INT** | Solana üzerinde SPL token | Piyasada devredilebilir | Protokol düzeyinde koordinasyon, staking, ekosistem teşvikleri. Arz parametreleri Vision Paper'da yer alır. |
| **bINT** | Zincir dışı muhasebe birimi (operasyon katmanı) | Tanımlı bir yaşam döngüsü üzerinden INT'e mutabakat eder | İş ile ödül arasındaki katkı muhasebesi katmanı. |
| **Proof-of-expense SBT** | Token-2022 devredilemez varlık | Devredilemez | Cüzdanı doğrulanmış harcama katkıcısı olarak işaretler; hesap başına bir kez basılır. |

### Neden üç sınıf

Kullanıcı deneyimi gerekçesini Vision Paper açıklar. Mekanik gerekçe ise sorumlulukların ayrılmasıdır:

- INT piyasalar ve borsalar arasında hareket eder; devredilebilir ve değiştirilebilirdir.
- bINT katkıyı ölçer ve INT'e mutabakat eder; zincir dışı bir birim olduğundan muhasebe, zincir üstü bir göç gerektirmeden evrilebilir.
- Proof-of-expense SBT, devredilemez bir Token-2022 varlığı olarak katkıcı kimliğini taşır; cüzdan başına bir adet.

## 4.2 Yetki yapısı

Yetki, bir sınıfın zincir üstü mü yoksa zincir dışı mı olduğuna göre değişir.

- **INT mint yetkisi** — yalnızca genesis'te tüm arz basılana kadar tutulur, sonra kapatılır. Genesis sonrası hiç INT basılamaz; dağıtım, denetlenmiş dağıtıcı (4.15) üzerinden yapılan bir hazine transferidir.
- **INT hazinesi ve yakım** — Squads çoklu imzasında tutulur; dağıtım kökü imzalama, hazine hareketi ve rezerv geri çağırma için ayrılmış onaylarla.
- **bINT** — operasyon katmanındaki zincir dışı muhasebe birimidir. Zincir üstü mint veya dondurma yetkisi yoktur; bakiyeleri 4.4'teki yaşam döngüsü üzerinden INT'e mutabakat eder.
- **Proof-of-expense SBT** — devredilemez uzantılı Token-2022; arka uç tarafından cüzdan başına bir kez basılır. Devredilemezlik, token-program katmanında uygulanır.

bINT'i zincir dışı tutmak, katkı yolundan olay başına zincir üstü yetkiyi kaldırır; genesis sonrası kalıcı tek INT düzeyi yetki, hazine, dağıtım kökleri ve yakımlar üzerindeki çoklu imzadır.
