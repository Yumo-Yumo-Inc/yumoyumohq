# Token classes

## 4.1 The four classes

Yumo Yumo operates with four asset classes, each with a distinct role. Only two are on-chain tokens; the other two are off-chain records.

| Class | Form | Transfer model | Role |
|---|---|---|---|
| **INT** | SPL token on Solana | Market-transferable | Protocol-level coordination, staking, ecosystem incentives. Supply parameters live in the Vision Paper. |
| **bINT** | Off-chain accounting unit (operations layer) | Settles to INT through a defined lifecycle | Contribution accounting layer between work and reward. |
| **ePoints** | Off-chain, USD-denominated record | In-product insight credit | Record of household-level hidden cost surfaced per verified receipt. |
| **Foundation NFT (Yumbie)** | Token-2022 non-transferable asset | Non-transferable | Persistent identity. Evolves to the Smart Agent at the milestone defined in the Vision Paper. |

### Why four classes

The Vision Paper explains the user-experience reason. The mechanism reason is separation of concerns:

- INT moves through markets and exchanges; it is transferable and fungible.
- bINT measures contribution and settles to INT; it is an off-chain unit, so accounting can evolve without an on-chain migration.
- ePoints carry an economic-insight signal as their own off-chain record, so user analytics can grow while INT supply stays fixed.
- The Foundation NFT carries identity continuity as a non-transferable Token-2022 asset, one per wallet.

## 4.2 Authority structure

Authority differs by whether a class is on-chain or off-chain.

- **INT mint authority** — held only until the full supply is minted at genesis, then closed. After genesis no INT can be minted; distribution is a treasury transfer through the audited distributor (4.15).
- **INT treasury and burn** — held by the Squads multisig, with separated approvals for distribution-root signing, treasury movement, and reserve clawback.
- **bINT and ePoints** — off-chain accounting units in the operations layer. They have no on-chain mint or freeze authority; their balances settle to INT through the lifecycle in 4.4.
- **Foundation NFT** — Token-2022 with the non-transferable extension, minted by the backend one time per wallet. Non-transferability is enforced at the token-program layer.

Keeping bINT and ePoints off-chain removes per-event on-chain authority from the contribution path; the only INT-level authority that persists after genesis is the multisig over treasury, distribution roots, and burns.
