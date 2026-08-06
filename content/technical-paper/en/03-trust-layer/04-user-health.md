# User health and level

## 3.5 User-level health

Every user carries a **health** standing that reflects the quality of their contributions. Health moves gradually: a sequence of clean, complete receipts pushes it up; a sequence of low-quality or inconsistent receipts pulls it down. Health acts as a multiplier on the **per-receipt reward rate**, so the same receipt can earn different bINT amounts for users with different standing.

Health has three properties worth naming:

- **Bounded.** It stays inside a configured range that lets a recovering user climb back. New users start at a neutral mid-point.
- **Synchronous.** It is updated as each receipt is processed, in the same pass that assesses receipt quality (3.3).
- **Decayed** *(planned)*. A time-decay component, under which older contributions matter less than recent ones, is planned and not active in the current release.

The health range, the rate bands, and the mapping from health into the reward rate are managed in the internal operations layer.

## 3.6 Level

Health is behaviour-horizon; **level** is contribution-horizon. Level is an integer that grows with cumulative high-quality contribution. Levels unlock product surfaces.

Level is monotonic. A user who pauses contribution keeps their level while health drifts toward the neutral mid-point.

Level and health act on different parts of the reward computation: **level sets the daily bINT ceiling** (04 §4.22), and **health multiplies the per-receipt reward rate** within that ceiling.

## 3.7 The daily ceiling, in plain terms

A user can earn bINT every day up to a ceiling set by their account level, which reflects how active they have been on the protocol. Within that ceiling, the amount each individual receipt earns is shaped by the user's health standing. New users get a modest ceiling that grows with level. The ceiling is communicated to the user in the product surface as a progress indicator; the values are re-tuned over time and across markets.
