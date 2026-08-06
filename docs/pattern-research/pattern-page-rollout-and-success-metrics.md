# Pattern Page Rollout and Success Metrics

This note records how we sequence Patterns and how we know it is working.

## MVP order

Ship in this order:

1. **Identity + radar** from real receipt motors, with evidence chips and empty states
2. **Heatmap** for hour × weekday intensity when timestamps exist
3. **One comparison card** (promo vs non-promo, or evening vs daytime)
4. **One soft action** (soft limit or weekly commitment)
5. **Shareable identity card**

Defer until data density exists:

- Tribe / community rankings
- City peer percentiles
- Deep promo genome and weather overlays
- Multi-step coaching flows

## Empty-state policy

Every deferred or thin module has an honest empty state:

- “Not enough evening receipts yet to map your night habits.”
- “Tribe insights unlock when more people in your city share verified receipts.”
- “Time patterns need receipt timestamps — add a few dated receipts to unlock this.”

No fake charts. No placeholder percentiles.

## Success metrics

We judge Patterns on recognition and helpful action, not on scare engagement.

| Metric | What good looks like |
|---|---|
| Self-recognition | Users mark insights as “feels like me” more often than dismiss |
| Action take rate | Soft limits / commitments set from the page |
| Return with purpose | Users reopen Patterns after new receipts land |
| Empty-state honesty | Withheld cards stay withheld when data is thin |
| Share card use | Optional identity shares without leaking private lines |
| Support load | No spike in “this isn't me” complaints from overconfident claims |

Exact numeric targets live in product ops; this note defines the measurement axes.

## Gamification boundaries

Allowed:

- Insight streaks for returning to review new evidence
- Badges for completing a soft commitment
- Weekly delta on the radar when history supports it

Not allowed:

- Punitive streaks that punish quiet weeks
- Fake social proof
- Pressure copy that frames skipping Patterns as failure

## Rollout phases

| Phase | Scope |
|---|---|
| Now | Identity, radar, evidence chips, heatmap, one action |
| Next | Promo radar, mental-account leakage, prediction game |
| Later | Real tribe layer, richer cohort lenses, deeper coaching |

## Definition of done for a Patterns module

- Backed by receipt observations
- Has a confidence / empty path
- Has one plain-language sentence and one optional action
- Does not expose operational security parameters
- Works in English source copy with localized user-facing strings
