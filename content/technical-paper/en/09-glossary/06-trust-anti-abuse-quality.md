# Trust, anti-abuse, and quality

## Trust, anti-abuse, and quality

- **Trust score** — A per-receipt score in [0, 1] derived from OCR confidence, reconciliation checks, merchant consistency, temporal plausibility, device signals, and historical user quality. *See: 03.*
- **Health score** — A per-user score in [0, 1] summarising recent contribution quality through time-weighted signals. Modulates the daily bINT ceiling. *See: 03.*
- **Level** — A user progression index computed from cumulative high-quality contribution. Smart Agent access and in-product progression attach to this index. *See: 03, 04.*
- **Canonical product** — The Yumo Yumo-internal normalised identity for a SKU. Multiple raw line-item strings ("COCA COLA 330ML KUTU", "C.COLA 33CL TENEKE") resolve to the same canonical product. *See: 02, 05.*
- **Merchant resolution** — The process of mapping a receipt to a merchant entity (chain, location, tax ID). *See: 02.*
- **Coordinated abuse attempt** — A pattern where multiple accounts or wallets act together to manipulate contribution rewards. *See: 03.*
- **k-anonymity** — In the B2B data product, a shared aggregate record falls into the same quasi-identifier group as at least *k - 1* other records. *See: 05, 08.*
