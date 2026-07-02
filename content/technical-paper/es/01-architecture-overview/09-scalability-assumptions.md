# Supuestos de escalabilidad

## 1.8 Supuestos de escalabilidad

Esta sección expresa la capacidad a través de variables de carga de trabajo. La arquitectura evalúa en conjunto el número de usuarios, la densidad de recibos, el conteo de líneas, la tasa de reintentos y la política de lotes.

| Símbolo | Significado |
|---|---|
| `U` | Usuarios activos diarios |
| `r` | Recibos promedio por usuario por día |
| `a` | Proporción de recibos enviados para procesamiento |
| `L` | Líneas promedio por recibo |
| `v` | Proporción de recibos verificados elegibles para recompensas |
| `e` | Registros de eventos promedio por recibo |
| `ρ_ocr` | Tasa de reintento de OCR |
| `ρ_llm` | Tasa de reintento o autoconsistencia de LLM |
| `B` | Tamaño de lote de liquidación en cadena |

Volumen diario de recibos procesados:

```text
R_d = U × r × a
```

Crecimiento mensual aproximado de datos activos:

```text
Rows_m ≈ 30 × R_d × (1 + L + e)
```

Volumen diario de llamadas a modelos:

```text
OCR_d ≈ R_d × (1 + ρ_ocr)
LLM_d ≈ R_d × (1 + ρ_llm)
```

Volumen diario de recompensas y liquidación:

```text
Verified_d ≈ R_d × v
Onchain_batches_d ≈ ceil(Verified_d / B)
```

Forma pública de costos variables:

```text
Cost_d ≈ OCR_d × c_ocr + LLM_d × c_llm + Storage_d × c_storage + Settlement_d × c_chain
```

Las decisiones de capacidad se toman midiendo en conjunto `U`, `r`, `L`, las tasas de reintento y la política de lotes. Los umbrales numéricos y los coeficientes de costo específicos del proveedor permanecen en la planificación operativa.
