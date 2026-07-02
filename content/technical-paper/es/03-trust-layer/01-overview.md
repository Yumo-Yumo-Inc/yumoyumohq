# 03 — Capa de confianza

La capa de confianza es la capa de calidad e integridad que se sitúa entre los recibos verificados y la contabilidad de recompensas. Un recibo que sale de la canalización ingresa primero a una de las bandas de decisión públicas según la calidad del recibo, el comportamiento del usuario y las señales de abuso repetido.

El contrato público de la capa define qué categorías de decisión existen y cómo afectan al libro mayor de recompensas. Los pesos de las señales, los umbrales, las vidas medias de decaimiento, los techos diarios y el conjunto completo de señales antiabuso se gestionan en la capa de operaciones internas.

## 3.0 Superficie de decisión pública

| Salida | Significado |
|---|---|
| Aceptación completa | El recibo ingresa al libro mayor de recompensas con el coeficiente normal |
| Aceptación reducida | El recibo es válido, pero las señales de calidad o comportamiento reducen el coeficiente de recompensa |
| Revisión | El recibo o el comportamiento del usuario ingresan a la decisión manual |
| Rechazo | El recibo ingresa al estado de registro rechazado |

Esta superficie brinda retroalimentación comprensible al usuario mientras los parámetros de defensa permanecen en la capa de operaciones internas.
