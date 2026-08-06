# Token classes

## 4.1 The three classes

Yumo Yumo operates with three asset classes, each with a distinct role. Two are on-chain tokens; one is an off-chain record — the bINT accounting layer. Hidden-cost insight is computed and shown per verified receipt as an analytics result; it is not an asset class or a credit.

| Class | Form | Transfer model | Role |
|---|---|---|---|
| **INT** | SPL token on Solana | Market-transferable | Protocol-level coordination, staking, ecosystem incentives. Supply parameters live in the Vision Paper. |
| **bINT** | Off-chain accounting unit (operations layer) | Settles to INT through a defined lifecycle | Contribution accounting layer between work and reward. |
| **Proof-of-expense SBT** | Token-2022 non-transferable asset | Non-transferable | Marks a wallet as a verified expense contributor, minted once per account. |

### Why three classes

The Vision Paper explains the user-experience reason. The mechanism reason is separation of concerns:

- INT moves through markets and exchanges; it is transferable and fungible.
- bINT measures contribution and settles to INT; it is an off-chain unit, so accounting can evolve without an on-chain migration.
- The proof-of-expense SBT carries contributor identity as a non-transferable Token-2022 asset, one per wallet.

## 4.2 Authority structure

Authority differs by whether a class is on-chain or off-chain.

- **INT mint authority** — held only until the full supply is minted at genesis, then closed. After genesis no INT can be minted; distribution is a treasury transfer through the audited distributor (4.15).
- **INT treasury and burn** — held by the Squads multisig, with separated approvals for distribution-root signing, treasury movement, and reserve clawback.
- **bINT** — off-chain accounting unit in the operations layer. It has no on-chain mint or freeze authority; its balances settle to INT through the lifecycle in 4.4.
- **Proof-of-expense SBT** — Token-2022 with the non-transferable extension, minted by the backend one time per wallet. Non-transferability is enforced at the token-program layer.

Keeping bINT off-chain removes per-event on-chain authority from the contribution path; the only INT-level authority that persists after genesis is the multisig over treasury, distribution roots, and burns.
