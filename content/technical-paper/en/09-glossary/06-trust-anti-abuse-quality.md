# Trust, anti-abuse, and quality

## Trust, anti-abuse, and quality

- **Trust score** — A per-receipt quality assessment produced by the pipeline's verification checks. Each assessment feeds a cumulative per-user trust standing maintained by a background worker. The specific signals and their weights are calibrated in production and are not published. *See: 03.*
- **Trust standing** — The cumulative per-user measure of contribution quality built up from per-receipt assessments. It influences the reward rate applied to each receipt. Time-based decay of standing is a planned mechanism and is not active in the current release. *See: 03.*
- **Level** — A user progression index computed from cumulative high-quality contribution. In-product progression, cosmetic unlocks, and reward ceilings attach to this index. *See: 03, 04.*
- **Canonical product** — The Yumo Yumo-internal normalised identity for a SKU. Multiple raw line-item strings ("COCA COLA 330ML KUTU", "C.COLA 33CL TENEKE") resolve to the same canonical product. *See: 02, 05.*
- **Merchant resolution** — The process of mapping a receipt to a merchant entity (chain, location, tax ID). *See: 02.*
- **Coordinated abuse attempt** — A pattern where multiple accounts or wallets act together to manipulate contribution rewards. *See: 03.*
- **k-anonymity** — In the B2B data product, a shared aggregate record falls into the same quasi-identifier group as at least *k - 1* other records. *See: 05, 08.*
