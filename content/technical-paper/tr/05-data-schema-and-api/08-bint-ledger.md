# Ödül muhasebesi (bağlayıcı)

## 5.7 Ödül muhasebesi (bağlayıcı)

bINT muhasebesi **olay temellidir**. Üç kayıt ailesi taşır:

- **`contribution_point_events`** — yalnız-ekleme olay satırları. Her alacak; kaynağı (`receipt`, referans, görev, ...), kaynak kaydın id'si, tutar ve oluşturulma zaman damgasıyla bir olay olarak yazılır. Bakiyeler olaylardan türetilir; olaylar yerinde asla düzenlenmez.
- **`receipt_rewards`** — fiş başına ödül kaydı: belirli bir doğrulanmış fişin ne kazandığı ve tutarın nasıl oluştuğu (bileşim, tutarın yanında bir döküm olarak saklanır).
- **Kullanıcı bakiyesi** — üründe gösterilen, olay geçmişinden türetilen güncel bakiye.

```text
// contribution_point_events satırı (temsili)
id:          184223            // serial
user_id:     9c41...-...       // account id
source:      receipt
source_id:   6f2b...-...       // receipt UUID
amount:      125.00            // decimal
created_at:  2026-05-17T14:23:12Z
```

### Mutabakat: epoch anlık görüntüleri

Mutabakat periyodiktir. Epoch motoru, uygun her hesabın dönem içi birikmiş bakiyesinin anlık görüntüsünü kurar, bunu `reward_epochs` + `reward_epoch_leaves` olarak yazar (hesap başına bir yaprak), yaprakları bir **Merkle köküne** katlar ve epoch onaylanmadan önce saklanan yapraklardan kökü yeniden hesaplayan bağımsız bir doğrulama adımı çalıştırır. Onaylanan kök, bir memo işlemiyle zincir üstünde mühürlenir ve INT talep hakları mühürlenmiş epoch'un yapraklarından okunur.

Denetlenebilir birim, kayıt başına bir zincir değil, epoch anlık görüntüsüdür: yayımlanmış bir epoch'un yaprakları, kökü ve doğrulama yöntemi, herkesin taahhüdü yeniden hesaplamasına ve mühürlenmiş kökün kayıtlarla eşleştiğini denetlemesine imkân verir. Mühürden sonraki düzeltmeler, sonraki bir epoch'ta yeni kayıtlar olarak ele alınır; mühürlenmiş geçmiş asla yeniden yazılmaz.

---
