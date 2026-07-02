# Etapa 3 — Reglas

## 2.6 Etapa 3 — Capa de expresiones regulares y reglas

La capa de expresiones regulares se ejecuta **siempre** después del LLM. El LLM es un reconocedor rápido de patrones; la expresión regular es un verificador determinista.

### Lo que regex detecta y el LLM omite

La capa de reglas añade verificación determinista en cuatro categorías:

1. **Reconciliación de totales.** El LLM ocasionalmente redondea o normaliza el total general. La capa de reglas vuelve a extraer el total impreso del texto OCR y anula el valor del LLM en caso de discrepancia.
2. **Normalización de fechas.** Los recibos usan múltiples formatos de fecha regionales y nombres de meses específicos de la localidad. Todas las variantes convergen a ISO 8601.
3. **Desambiguación de moneda.** Los tokens de moneda mixtos se resuelven por frecuencia y localidad del comerciante.
4. **Detección de líneas fiscales.** Las líneas de tasas impositivas específicas de la localidad (p. ej., KDV en Turquía) se detectan a partir del texto impreso en lugar de inferirse por el LLM.

### Catálogo de reglas

El catálogo se organiza por categoría: totales, impuestos, fechas, moneda e identificadores de comerciantes. Cada categoría contiene familias de reglas específicas de la localidad para los idiomas en los que operamos. Los patrones específicos y los pesos por regla se gestionan en la capa operativa interna.

### Impulso de confianza

Cada acierto de regla verificado eleva la puntuación de confianza de la capa de expresiones regulares. Los recibos que se concilian limpiamente reciben una puntuación más alta; los recibos con totales no reconciliados llevan una brecha de reconciliación que el puntaje de confianza lee como una de sus entradas. El peso asignado a esa entrada se gestiona en la capa operativa interna.

---
