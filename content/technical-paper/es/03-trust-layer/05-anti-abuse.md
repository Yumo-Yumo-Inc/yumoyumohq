# Enfoque antiabuso

## 3.8 Modelo de amenazas

La capa de confianza está construida contra tres clases de abuso:

1. **Farming de una sola cuenta** — un usuario carga recibos que en realidad no pagó, o vuelve a cargar el mismo recibo con variaciones cosméticas para ganar bINT múltiples veces.
2. **Farming multi-cuenta** — un operador maneja varias cuentas, a veces compartiendo un solo recibo entre ellas, para eludir el techo diario por usuario.
3. **Contenido sintético** — recibos generados por herramientas de síntesis de imágenes que parecen plausibles mientras representan transacciones fabricadas.

Cada clase tiene su propia familia de señales. La capa asume que el abuso es iterativo — que un atacante sondeará el sistema y se ajustará — y por lo tanto está diseñada para recalibrarse con el tiempo en lugar de depender de reglas fijas.

## 3.9 Categorías de señales

A través de las tres clases, la capa se basa en categorías de señales nombradas aquí a alto nivel:

- **Similitud perceptual** — detecta la reutilización del mismo recibo entre cargas.
- **Continuidad de dispositivo y sesión** — detecta patrones inusuales en cómo una cuenta interactúa con el protocolo.
- **Correlación entre cuentas** — detecta grupos de cuentas que comparten patrones inconsistentes con hogares independientes.
- **Autenticidad de medios sintéticos** — distingue las fotografías de recibos físicos de las imágenes generadas por máquina. Las señales se gestionan en la capa de operaciones internas.
- **Ritmo conductual** — modela la actividad de la cuenta a lo largo del tiempo. Las señales específicas que componen esta categoría se gestionan en la capa de operaciones internas.

Cada categoría produce señales que alimentan la puntuación de confianza del recibo y, donde sea relevante, la salud del usuario. Las señales específicas, los umbrales y el método de construcción de clústeres se gestionan en la capa de operaciones internas.

## 3.10 Tratamiento

El tratamiento es graduado:

- Una señal de forma aislada **reduce la banda de confianza** para el recibo afectado.
- Un grupo de señales a través de recibos **reduce la salud del usuario**, lo que comprime el techo diario.
- Un patrón persistente a través de usuarios **abre un caso de revisión** en la cola operacional; la resolución puede implicar revisión humana, verificación adicional o — en casos repetidos y inequívocos — acción a nivel de cuenta.

El tratamiento graduado es intencional. Los recibos y los usuarios se sitúan en un espectro de confianza, y la lógica económica del protocolo depende de mantener ese espectro legible.
