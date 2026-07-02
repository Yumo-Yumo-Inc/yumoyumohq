# Design goals

## 3.1 Goals of the trust layer

The trust layer optimises for four properties, in tension.

| Goal | What it means | Why it matters |
|---|---|---|
| **Honest receipts pass quickly** | A genuine household receipt clears the layer with full bINT in the same request that produces the verified preview. | Retention. Honest users are the protocol's mass; friction here drops MAU. |
| **Reward quality is protected** | Coordinated multi-account farming, duplicated receipts, and synthetic images route to reduction, review, or rejection. | Economic safety. Every bINT minted off an abusive upload erodes the value for every honest user. |
| **Borderline cases get a second look** | Receipts that look unusual but plausible enter a review queue for a second look. | False-positive cost. Reviewing a genuine receipt protects user trust. |
| **The user feels in control** | A user can see why a receipt was downgraded or held and what to do about it. | Trust. Clear explanation preserves the contribution loop. |

The layer balances these four goals with a calibrated scoring model rather than a hard rule set; the model is re-tuned on observed outcomes rather than fixed at design time.

## 3.2 Where trust attaches

Trust scoring runs at two granularities:

1. **Receipt-level** — every receipt that exits the pipeline (02 Stage 6) is scored exactly once before bINT settlement. Re-scoring is possible (e.g. after a successful appeal) but each version supersedes the previous one.
2. **User-level** — every user has a rolling health snapshot that reflects the recent quality of their contributions. Health changes slowly and is bounded so that a single bad receipt has limited effect on a long-standing good record.

Receipt-level scoring is synchronous; user-level health is recomputed in the daily batch tier (01 §1.5).
