# Decision matrix

## 3.11 From score to outcome

Once a receipt has a trust band and a user has a current health snapshot, the layer routes the receipt to one of four outcomes.

| Outcome | What the user sees | What the ledger records |
|---|---|---|
| **Accept — full credit** | Verified preview + full bINT amount for this receipt and this user. | `receipt.status = "verified"`, full credit, signal families listed. |
| **Accept — reduced credit** | Verified preview + a smaller bINT amount. No friction. | `receipt.status = "verified"`, partial credit, downgrade reason category. |
| **Hold for review** | "We're checking this one. Result usually arrives within a day." | `receipt.status = "under_review"`, queued in the appeals workflow (3.12). |
| **Reject** | Clear plain-language message and 0 bINT. | `receipt.status = "rejected"`, reject reason category. |

The fourth outcome is reserved for cases outside the honest-receipt plausibility band — e.g. an image flagged by synthetic-media authenticity checks, a hand-written document, or a duplicate of a receipt already credited to a different user with conflicting evidence.

## 3.12 The appeals queue

A receipt held for review enters a queue under an operational timing target. The reviewer (initially the operating team, later a community pool earning Proof of Contribution) sees:

- The receipt image and the extracted record.
- The band and the list of signal families that contributed.
- The user's recent history at a glance.
- Three actions: **approve full**, **approve reduced**, **uphold rejection**.

The reviewer sees the same signal families the receipt block records. This keeps the reviewer aligned with the layer's design and supports consistent decisions.

If the reviewer overturns the layer's recommendation, the override is recorded and contributes to the next calibration cycle.

## 3.13 What the user can do

A user whose receipt is rejected sees a category-level explanation and, where appropriate, a self-serve path: re-shoot the receipt with better lighting, contact support with a payment confirmation, or accept the rejection. Signal-level reasons stay in the internal trust configuration.

A user whose health has compressed can recover it by contributing clean receipts. Recovery is intentionally gradual; the system rewards sustained good behaviour rather than sudden bursts.
