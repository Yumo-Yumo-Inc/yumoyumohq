# Confianza, antiabuso y calidad

## Confianza, antiabuso y calidad

- **Trust score** — Una puntuación por recibo en [0, 1] derivada de la confianza OCR, verificaciones de reconciliación, consistencia de comerciante, plausibilidad temporal, señales de dispositivo y calidad histórica del usuario. *Véase: 03.*
- **Health score** — Una puntuación por usuario en [0, 1] que resume la calidad reciente de contribución a través de señales ponderadas en el tiempo. Modula el techo diario de bINT. *Véase: 03.*
- **Level** — Un índice de progresión de usuario computado a partir de la contribución acumulada de alta calidad. El acceso al Smart Agent y la progresión en el producto se adjuntan a este índice. *Véase: 03, 04.*
- **Canonical product** — La identidad normalizada interna de Yumo Yumo para un SKU. Múltiples cadenas de artículo de línea en bruto ("COCA COLA 330ML KUTU", "C.COLA 33CL TENEKE") se resuelven al mismo producto canónico. *Véase: 02, 05.*
- **Merchant resolution** — El proceso de mapear un recibo a una entidad de comerciante (cadena, ubicación, ID fiscal). *Véase: 02.*
- **Coordinated abuse attempt** — Un patrón donde múltiples cuentas o billeteras actúan juntas para manipular recompensas de contribución. *Véase: 03.*
- **k-anonymity** — En el producto de datos B2B, un registro agregado compartido cae en el mismo grupo de cuasi-identificadores que al menos *k - 1* otros registros. *Véase: 05, 08.*
