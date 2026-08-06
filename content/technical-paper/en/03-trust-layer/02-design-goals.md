# Design goals

## 3.1 Goals of the trust layer

The trust layer optimises for four properties, in tension.

| Goal | What it means | Why it matters |
|---|---|---|
| **Low-risk receipts do not wait** | A receipt with sufficient verification signals receives a preview and reward-eligibility outcome without manual review. | The review queue is reserved for ambiguous or conflicting records. |
| **Ineligible credit is limited** | Multi-account, duplicate-receipt, and synthetic-image signals route to reduction, review, or rejection. | Ineligible credits distort reward accounting and distribution ceilings. |
| **Borderline cases are reviewed again** *(planned)* | Receipts that look unusual but plausible enter a review queue for a second look. The review queue is a planned mechanism; the current release resolves each receipt automatically. | False rejections require a second assessment and an appeal path. |
| **Decisions and options are clear** | A user can see why a receipt was downgraded or held and which options are available. | The user can understand next steps such as re-uploading or appealing. |

The layer balances these four goals with a calibrated scoring model rather than a hard rule set; the model is re-tuned on observed outcomes rather than fixed at design time.

## 3.2 Where trust attaches

Trust scoring runs at two granularities:

1. **Receipt-level** — every receipt that exits the pipeline (02 Stage 6) is scored exactly once before bINT settlement. Re-scoring is possible (e.g. after a successful appeal) but each version supersedes the previous one.
2. **User-level** — every user carries a cumulative trust standing that reflects the quality of their contributions over time. Standing moves gradually and is bounded so that a single bad receipt has limited effect on a long-standing good record.

Both granularities update synchronously: the receipt-level quality assessment runs as the receipt exits the pipeline, and the user-level standing is updated in the same processing pass.
