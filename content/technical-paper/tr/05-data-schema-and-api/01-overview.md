# 05 — Veri Şeması ve API

Bu bölüm, Yumo Yumo'nun açık şema ve API yüzeyini tanımlar. 02'deki boru hattı çıktıları, 03'teki güven kararları ve 04'teki ödül muhasebesi burada tanımlanan varlık ve olay biçimlerine bağlanır.

Şemalar, protokol taraflarının aynı kaydı aynı şekilde okuyabilmesi için yayınlanır. Fiziksel indeks stratejisi, sağlayıcı tercihi, sıcak/soğuk veri taşıma kuralları ve B2B ürünün ticari parametreleri operasyonel dokümantasyonda kalır.

## 5.0 Şema ilkesi

| İlke | Sonuç |
|---|---|
| Tipli kayıt | Her açık nesne sürümlü ve şemalıdır |
| Olay temelli defter | Ödül muhasebesi geriye dönük denetlenebilir olaylardan türetilir |
| Ayrıştırılmış veri | Kişisel veri, toplam veri ve zincir üstü özet ayrı katmanlarda tutulur |
| Sürümlenebilir API | Alan ekleme/çıkarma geriye uyumluluk kurallarıyla yönetilir |
