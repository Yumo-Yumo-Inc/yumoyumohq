# Price observation (normative)

## 5.6 Price observation (normative)

The public price record lives in `price_epoch_observations`. One row is one **identity-free** observation, committed as a leaf into a daily epoch's Merkle tree (see 5.9). Fields are stored already normalised, exactly as they enter the leaf preimage, so the leaf hash and the published manifest row are re-derivable byte for byte.

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

Design decisions carried by this shape:

- **Date only, no time of day.** Publishing a timestamp alongside merchant and date would let anyone regroup the lines of a single shopping basket, which reconstructs a shopping profile even without a name. Dropping the time is a privacy invariant of the ledger, not a data gap.
- **Merchant as brand + city + country.** The observation names a brand string at city granularity; store and address level identity is never published.
- **No user linkage.** The row carries no username, wallet, receipt id, or per-row trust score. Quality control happens upstream: only lines from verified receipts enter the epoch build, so the published set does not need a per-observation score.
- **Product identity is self-describing.** The leaf preimage includes the product name, brand, and pack size so a third party can use the record without a lookup service.

This record powers:

1. **User price memory** — "you paid 23.50 TL for Pınar süt at Migros; the recent median is 22.10 TL."
2. **Open price history** — anyone can rebuild the dataset from the published manifests and query brand + city + country price series.
3. **Aggregate indices** — the anonymised aggregate layer (5.8) is computed over the same observations.

---
