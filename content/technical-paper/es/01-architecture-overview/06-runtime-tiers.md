# Niveles de tiempo de ejecución

## 1.5 Niveles de tiempo de ejecución

Yumo Yumo tiene tres niveles de tiempo de ejecución, cada uno con un presupuesto diferente.

| Nivel | Qué se ejecuta aquí | Presupuesto de latencia | Presupuesto de costo | Modo de falla |
|---|---|---|---|---|
| Sincrónico (solicitud) | OCR → LLM → regex → matching canónico → puntaje de confianza | P95 < ~5 s de extremo a extremo | < 0,02 $ / recibo | Mostrar vista previa degradada + reintentar |
| Asincrónico (liquidación) | Acuñación de bINT, actualizaciones de nivel NFT | < 1 hora desde la verificación | Tarifas de Solana | Diferir al siguiente lote |
| Lote diario | Reagrupación canónica, recálculo de puntaje de salud, exportación anonimizada, cola BBB | Ventana nocturna | Presupuesto del pool de cómputo | Operar con la instantánea del día anterior |

Dividir estos niveles permite que la experiencia orientada al usuario se mantenga rápida incluso cuando los sistemas subyacentes son costosos o lentos. El costo de acuñación en Solana (el cuello de botella para la UX en cadena de subsegundo) se amortiza en lotes.