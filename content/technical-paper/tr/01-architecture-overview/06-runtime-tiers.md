# Çalışma katmanları

## 1.5 Çalışma katmanları

Yumo Yumo'nun üç çalışma katmanı vardır; her birinin farklı bir bütçesi olur.

| Katman | Burada ne çalışır | Gecikme bütçesi | Maliyet bütçesi | Arıza biçimi |
|---|---|---|---|---|
| Eşzamanlı (istek) | OCR → LLM → regex → kanonik eşleşme → güven puanı | P95 < ~5 sn uçtan uca | < 0,02 $ / fiş | Düşük kalite önizleme + yeniden dene |
| Eşzamansız (mutabakat) | bINT mint, NFT seviye güncellemeleri | Doğrulamadan sonra < 1 saat | Solana ücretleri | Bir sonraki gruba ertele |
| Günlük grup | Kanonik yeniden kümeleme, sağlık-puanı yeniden hesaplama, anonimleştirilmiş dışa aktarma, BBB kuyruğu | Gece penceresi | Hesaplama havuzu bütçesi | Dünün anlık görüntüsünde çalış |

Bu katmanları ayırmak, alttaki sistemler pahalı veya yavaş olsa bile kullanıcıya bakan deneyimin hızlı kalmasını sağlar. Solana mint maliyeti (saniye altı zincir üstü deneyim için darboğaz) gruplar arasında amorti edilir.

---
