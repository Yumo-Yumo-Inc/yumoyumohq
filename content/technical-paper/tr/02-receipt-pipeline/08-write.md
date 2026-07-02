# Aşama 6 — Yazım

## 2.9 Aşama 6 — Çıktı yazımı

Tek bir Postgres işlemi şunları yazar:

```
INSERT INTO receipts (...) VALUES (...);
INSERT INTO receipt_line_items (...) VALUES (...);
INSERT INTO price_observations (...) VALUES (...);
INSERT INTO events (event_type, payload) VALUES ('receipt.verified', {...});
```

`events` satırı iki aşağı akış tüketicisini tetikler:

- **Güven puanlayıcı** (03) — olayı alır, güven puanını hesaplar, `trust_scores`'a yazar.
- **Mutabakat işçisi** — bir `bINT.pending` kredisini kuyruğa alır. Asıl zincir üstü mint, eşzamansız katmanda gerçekleşir (01 Faz B).

İşlem dahili bir yazım anahtarı üzerinde idempotenttir: işçi tekrar denerse oynatma güvenli.
