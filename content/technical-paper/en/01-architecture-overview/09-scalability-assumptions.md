# Scalability assumptions

## 1.8 Scalability assumptions

This section expresses capacity through workload variables. The architecture evaluates user count, receipt density, line-item count, retry rate, and batch policy together.

| Symbol | Meaning |
|---|---|
| `U` | Daily active users |
| `r` | Average receipts per user per day |
| `a` | Share of receipts submitted for processing |
| `L` | Average line items per receipt |
| `v` | Share of verified receipts eligible for rewards |
| `e` | Average event records per receipt |
| `ρ_ocr` | OCR retry rate |
| `ρ_llm` | LLM retry or self-consistency rate |
| `B` | On-chain settlement batch size |

Daily processed receipt volume:

```text
R_d = U × r × a
```

Approximate monthly hot-data growth:

```text
Rows_m ≈ 30 × R_d × (1 + L + e)
```

Daily model-call volume:

```text
OCR_d ≈ R_d × (1 + ρ_ocr)
LLM_d ≈ R_d × (1 + ρ_llm)
```

Daily reward and settlement volume:

```text
Verified_d ≈ R_d × v
Onchain_batches_d ≈ ceil(Verified_d / B)
```

Public variable-cost form:

```text
Cost_d ≈ OCR_d × c_ocr + LLM_d × c_llm + Storage_d × c_storage + Settlement_d × c_chain
```

Capacity decisions are made by measuring `U`, `r`, `L`, retry rates, and batch policy together. Numeric thresholds and provider-specific cost coefficients remain in operational planning.
