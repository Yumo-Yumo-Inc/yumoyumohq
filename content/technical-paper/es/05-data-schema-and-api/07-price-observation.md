# Observación de precio (normativo)

## 5.6 Observación de precio (normativo)

El registro público de precios reside en `price_epoch_observations`. Una fila es una observación **sin identidad**, comprometida como hoja en el árbol de Merkle de una época diaria (véase 5.9). Los campos se almacenan ya normalizados, exactamente como entran en la preimagen de la hoja, de modo que el hash de la hoja y la fila del manifiesto publicado son rederivables byte a byte.

```text
// price_epoch_observations row (labeled plain text; published as a pipe-separated manifest line)
epoch_number:         214
leaf_index:           1082
leaf_hash:            0x9a01...            // keccak256 of the observation preimage
canonical_product_id: 3f6a...-...          // catalog id; name/brand/pack travel with it
category_path:        food.dairy.milk
country:              TR
city:                 Istanbul
merchant:             Migros               // brand string — brand + city + country only
obs_date:             2026-05-17           // date only, deliberately no time of day
unit_price:           23.50                // canonical decimal string, 2 dp
currency:             TRY
unit_type:            piece
pack_size:            1 L
```

Decisiones de diseño que porta esta forma:

- **Solo fecha, sin hora del día.** Publicar una marca de tiempo junto al comerciante y la fecha permitiría a cualquiera reagrupar las líneas de una sola cesta de compra, lo que reconstruye un perfil de compra incluso sin un nombre. Omitir la hora es una invariante de privacidad del libro mayor, no una carencia de datos.
- **Comerciante como marca + ciudad + país.** La observación nombra una cadena de marca a granularidad de ciudad; la identidad a nivel de tienda y dirección nunca se publica.
- **Sin vínculo con el usuario.** La fila no porta nombre de usuario, billetera, id de recibo ni trust score por fila. El control de calidad ocurre aguas arriba: solo las líneas de recibos verificados entran en la construcción de la época, así que el conjunto publicado no necesita una puntuación por observación.
- **La identidad del producto es autodescriptiva.** La preimagen de la hoja incluye el nombre del producto, la marca y el tamaño del envase, de modo que un tercero puede usar el registro sin un servicio de consulta.

Este registro alimenta:

1. **Memoria de precios del usuario** — "pagaste 23.50 TL por Pınar süt en Migros; la mediana reciente es 22.10 TL."
2. **Historial de precios abierto** — cualquiera puede reconstruir el conjunto de datos a partir de los manifiestos publicados y consultar series de precios por marca + ciudad + país.
3. **Índices agregados** — la capa agregada anonimizada (5.8) se computa sobre las mismas observaciones.

---
