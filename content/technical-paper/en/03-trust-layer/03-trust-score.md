# Trust score

## 3.3 Per-receipt trust score

The trust score for a receipt is a number in `[0, 1]` derived from a weighted combination of signals. Higher is better. The score is written to the receipt record (see 05 §5.3) alongside the list of signals that contributed.

### Signal families

The score draws on four families of signals. Each family produces one or more individual signals; the layer composes them into the final score.

| Family | What it observes |
|---|---|
| **Pipeline confidence** | How confident the upstream pipeline was in the extraction (OCR confidence, LLM confidence, rule-layer reconciliation). |
| **Merchant consistency** | Whether the merchant, branch, and receipt template match what we have seen before from this merchant. |
| **Temporal plausibility** | Whether the receipt's date, time, and the user's upload pattern are consistent with normal behaviour. |
| **User history** | The user's recent contribution quality, scoped to a rolling window. |

Within each family, individual signals are recorded with their observed value and a contribution flag (`signal_used` / `signal_skipped`). The exact weighting, family thresholds, and skip rules are managed in the internal operations layer.

### Score bands

The final score is bucketed into bands for downstream use:

- **High** — receipt clears for full bINT credit.
- **Medium** — receipt clears for reduced bINT credit. The user is shown the verified preview and the bINT amount; no friction.
- **Low** — receipt is held for review (see 3.7). The user is told it's being checked.
- **Reject** — receipt enters rejected state. The user sees a plain-language reason category.

The band boundaries are calibrated periodically against observed outcomes and managed in the internal operations layer.

## 3.4 What the receipt record carries

The receipt's trust block lists the signal families that contributed and the resulting band. Individual signal values, weights, and score live in the internal trust configuration. The user-facing surface communicates the **outcome** (bINT amount, hold, reject) and the **reason category** when relevant.

This is intentional: public bands provide outcome clarity while internal scores preserve the calibration surface.
