# Confianza, antiabuso y calidad

## Confianza, antiabuso y calidad

- **Trust score** — Una evaluación de calidad por recibo producida por las verificaciones de la canalización. Cada evaluación alimenta un trust standing acumulativo por usuario mantenido por un worker en segundo plano. Las señales específicas y sus pesos se calibran en producción y no se publican. *Véase: 03.*
- **Trust standing** — La medida acumulativa por usuario de la calidad de contribución, construida a partir de las evaluaciones por recibo. Influye en la tasa de recompensa aplicada a cada recibo. El decaimiento temporal del standing es un mecanismo planificado y no está activo en la versión actual. *Véase: 03.*
- **Level** — Un índice de progresión de usuario computado a partir de la contribución acumulada de alta calidad. La progresión en el producto, los desbloqueos cosméticos y los techos de recompensa se adjuntan a este índice. *Véase: 03, 04.*
- **Canonical product** — La identidad normalizada interna de Yumo Yumo para un SKU. Múltiples cadenas de artículo de línea en bruto ("COCA COLA 330ML KUTU", "C.COLA 33CL TENEKE") se resuelven al mismo producto canónico. *Véase: 02, 05.*
- **Merchant resolution** — El proceso de mapear un recibo a una entidad de comerciante (cadena, ubicación, ID fiscal). *Véase: 02.*
- **Coordinated abuse attempt** — Un patrón donde múltiples cuentas o billeteras actúan juntas para manipular recompensas de contribución. *Véase: 03.*
- **k-anonymity** — En el producto de datos B2B, un registro agregado compartido cae en el mismo grupo de cuasi-identificadores que al menos *k - 1* otros registros. *Véase: 05, 08.*
