# Ölçeklenebilirlik varsayımları

## 1.8 Ölçeklenebilirlik varsayımları

Bu bölüm kapasiteyi iş yükü değişkenleriyle ifade eder. Mimari; kullanıcı sayısı, fiş yoğunluğu, satır kalemi sayısı, yeniden deneme oranı ve yığın politikasını birlikte değerlendirir.

| Sembol | Anlam |
|---|---|
| `U` | Günlük aktif kullanıcı |
| `r` | Kullanıcı başına günlük ortalama fiş |
| `a` | İşleme alınan fiş oranı |
| `L` | Fiş başına ortalama satır kalemi |
| `v` | Ödüle uygun doğrulanmış fiş oranı |
| `e` | Fiş başına ortalama olay kaydı |
| `ρ_ocr` | OCR yeniden deneme oranı |
| `ρ_llm` | LLM yeniden deneme veya öz-tutarlılık oranı |
| `B` | Zincir üstü mutabakat yığın boyutu |

Günlük işlenen fiş hacmi:

```text
R_d = U × r × a
```

Aylık sıcak veri büyümesi yaklaşık:

```text
Rows_m ≈ 30 × R_d × (1 + L + e)
```

Günlük model çağrısı hacmi:

```text
OCR_d ≈ R_d × (1 + ρ_ocr)
LLM_d ≈ R_d × (1 + ρ_llm)
```

Günlük ödül ve mutabakat hacmi:

```text
Verified_d ≈ R_d × v
Onchain_yığınes_d ≈ ceil(Verified_d / B)
```

Günlük değişken maliyet modelinin açık formu:

```text
Cost_d ≈ OCR_d × c_ocr + LLM_d × c_llm + Storage_d × c_storage + Settlement_d × c_chain
```

Kapasite kararı `U`, `r`, `L`, yeniden deneme oranları ve yığın politikasının birlikte ölçülmesiyle verilir. Sayısal eşikler ve sağlayıcı bazlı maliyet katsayıları operasyonel planlamada tutulur.
