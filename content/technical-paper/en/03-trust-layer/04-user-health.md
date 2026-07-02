# User health and level

## 3.5 User-level health

Every user has a **health** value in `[0, 1]` that reflects recent contribution quality. Health changes slowly: a long sequence of clean receipts pushes it up; a sequence of held or rejected receipts pulls it down. Health acts as a multiplier on the user's daily contribution ceiling, so it directly affects how much bINT the same receipt can earn for different users.

Health has three properties worth naming:

- **Bounded.** It stays inside a configured range that lets a recovering user climb back. New users start at a neutral mid-point.
- **Lagged.** It is recomputed in the daily batch tier. Individual receipt effects spread over time.
- **Decayed.** Older contributions matter less than recent ones through the contribution window.

The decay window, floor and ceiling values, and band boundaries that map health into daily caps are managed in the internal operations layer.

## 3.6 Level

Health is short-horizon; **level** is long-horizon. Level is an integer that grows with cumulative high-quality contribution. Levels unlock product surfaces and, at the milestone defined in *Vision Paper — Yumbie Product Surface*, the user's Foundation NFT evolves into the Smart Agent (a one-way mint event).

Level is monotonic. A user who pauses contribution keeps their level while health drifts toward the neutral mid-point.

Level and health together set the effective daily bINT ceiling. The current MVP implementation uses per-level tables (04 §4.22); the target architecture uses a formula-based ceiling with `base_cap × level_multiplier × health_score` (04 §4.23).

## 3.7 The daily ceiling, in plain terms

A user can earn bINT every day up to a ceiling that reflects (a) how active they have been on the protocol and (b) how clean their recent contributions are. New users get a modest ceiling that grows with level. The ceiling is communicated to the user in the product surface as a progress indicator; the value is re-tuned over time and across markets.
