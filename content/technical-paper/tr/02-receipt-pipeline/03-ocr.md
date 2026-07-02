# Aşama 1 — Belge okuma

## 2.4 Aşama 1 — Belge okuma katmanı

Bu aşama, fiş görüntüsünden veya PDF girdisinden metin blokları, okuma sırası ve konum bilgisi çıkarır. Açık doküman, aşamanın ürettiği normalleştirilmiş çıktıyı sözleşme olarak tanımlar.

### Çıktı normalleştirmesi

Belge okuma motorları farklı biçimler döndürebilir. Pipeline bunları tek bir iç biçime normalleştirir:

```json
// DocumentReadResult
{
  "raw_text": "MIGROS\nFIS NO: 4521\n...",
  "blocks": [
    {
      "text": "MIGROS",
      "bbox": { "x": 120, "y": 40, "w": 200, "h": 50 },
      "confidence_band": "high",
      "reading_order": 0
    }
  ],
  "quality_band": "high",
  "detected_languages": ["tr"],
  "page_count": 1
}
```

Bloklar okuma sırasına göre sıralanır ve bir sonraki aşamaya deterministik girdi olarak verilir. Bu sayede model çıkarımı, belge okuma sağlayıcısının ham çıktı biçimine bağlı kalmaz.

### Kalite sinyali

Belge okuma aşaması sonraki aşamalara kalite bandı ve hata kategorisi taşır. Düşük kalite durumlarında boru hattı yeniden işleme, kullanıcıdan yeni görüntü isteme veya düşük güvenle devam etme kararını operasyonel politikaya göre verir.

Bu yaklaşım açık teknik sözleşmeyi korurken tersine mühendisliğe açık olabilecek eşik ve yedek davranış ayrıntılarını dışarıda tutar.
