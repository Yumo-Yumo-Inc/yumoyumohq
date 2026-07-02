# Reward ceilings

## 4.22 Per-receipt and daily ceilings

Two behavioral ceilings protect the emission pool from concentration and spam. Both are enforced at the application layer before bINT is credited to the user's off-chain balance. A third, global ceiling applies at settlement (the soft-cap pro-rata in 4.24).

### Per-receipt ceiling

Each verified receipt produces at most a level-dependent maximum bINT credit. The ceiling prevents a single high-value receipt from consuming a disproportionate share of the user's daily budget. The system supports 50 user levels, with the per-receipt ceiling increasing monotonically across levels. The exact per-level values are calibrated in production and not published.

### Daily ceiling

Each user has a daily bINT budget that caps the total reward earned across all receipts in a UTC day. The ceiling scales with user level across the same 50-level range, increasing monotonically. The exact per-level values are calibrated in production and not published.

Once a user's daily total reaches the ceiling, additional receipts are processed and recorded but produce no incremental bINT for that day. The ceiling resets at UTC midnight. These values are overridable through configuration per level and are re-tuned as the user base grows and the level distribution evolves.

## 4.23 Target architecture: formula-based ceiling

The long-term ceiling model replaces the flat per-level table with a continuous formula:

```
effective_daily_ceiling = base_cap × level_multiplier × health_score
```

| Factor | Source | Range |
|---|---|---|
| `base_cap` | Protocol-level constant | Calibrated in production and not published |
| `level_multiplier` | Cumulative contribution (03 §3.6) | Increases with level |
| `health_score` | Recent contribution quality (03 §3.5) | Bounded scalar, calibrated in production and not published |

Under this model, a low-level user with neutral health earns a fraction of the base ceiling (`base_cap × level_multiplier × health_score`), while a high-level user with strong health approaches the upper end of the ceiling range. The exact constants are calibrated in production and not published. The formula lets the protocol re-tune any of the three factors independently while preserving the overall economic envelope.

### Transition path

The MVP table and the target formula coexist during the pre-TGE and early post-TGE phases. The MVP table provides deterministic, easily auditable ceilings during the period when the health scoring system and level distribution are still maturing. The formula-based model activates when the trust layer's health and level signals reach sufficient calibration depth. The transition is a protocol configuration change, not a smart-contract migration.
