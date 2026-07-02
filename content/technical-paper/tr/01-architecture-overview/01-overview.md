# 01 — Sistem Mimarisi

Yumo Yumo mimarisi üç akışı birbirinden ayırır: kullanıcıya saniyeler içinde dönen fiş işleme akışı, arka planda çalışan ödül ve mutabakat akışı, ve anonimleştirilmiş veri ürünü akışı. Bu ayrım gecikme, maliyet, gizlilik ve zincir üstü mutabakat sorumluluklarını aynı sistem içinde fakat ayrı sınırlar halinde yönetir.

Açık teknik belge bu bölümde bileşenlerin görevlerini, veri hareketini ve güven sınırlarını açıklar. Sağlayıcı seçimi, kapasite eşikleri, *runbook*'lar, savunma parametreleri ve yük devretme politikaları operasyonel dokümantasyonda kalır.

Mimarideki temel invariant şudur: ham fiş içeriği zincir dışı veri katmanında işlenir; ödül muhasebesi önce zincir dışı defterde hesaplanır; zincir üstü katman token durumu, yetki durumu ve kriptografik taahhütleri taşır.
