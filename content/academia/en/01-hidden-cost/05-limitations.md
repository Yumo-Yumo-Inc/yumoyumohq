# Limits & honesty

A method is only trustworthy if it is clear about where it is weak. This section
states the known limits of the hidden-cost estimate and draws the line between a
sourced figure and an engineering parameter.

## 5.1 What the estimate is weak at

- **Single purchases.** The estimate is a modelled reference, not a measured cost.
  For one line on one receipt it is directional; its value is in aggregate and over
  time, where product-specific quirks average out.
- **Thin categories.** Some categories have richer published statistics than others.
  Where a category's cost composition or price reference is sparse, the estimate is
  coarser, and the fallback model is used rather than a precise one.
- **Imported and fast-moving goods.** For goods dominated by import cost or rapid
  price movement, the reference period matters a great deal; the estimate is most
  reliable close to a fresh statistical release.

## 5.2 A known gap

The highest-volume category, everyday groceries, currently rests on an internal
cost-composition estimate rather than a fully external source. It is marked as
unverified in the [source registry](04-source-registry.md): it continues to inform
the calculation, but it is not presented as externally sourced, and it is excluded
from the public source list until an external reference is assigned. This is the
honest state — the gap is shown, not filled.

## 5.3 Sourced figures vs engineering parameters

This paper draws a firm line:

- **Sourced figures** — average prices, tax rates, producer markups, cost-composition
  weights — come from named institutions with effective dates, and are listed in the
  registry.
- **Engineering parameters** — the thresholds, blend ratios, reference margin, and
  routing cutoffs that operate the models — are calibrated in production. They are
  not research findings, and the paper does not present them as such. They are not
  published, because publishing the exact calibration would expose operational
  detail without adding to the method's transparency.

The mechanism is described in full; the dials are set in production. That boundary
is deliberate, and it is the same boundary applied across Yumo Yumo's technical
writing.

## 5.4 How limits get smaller

Each limit has a path to improvement: a thin category gains precision when a sourced
cost composition is added; the grocery gap closes when an external reference is
verified; the period sensitivity eases as statistics are refreshed on schedule. The
draft-to-verified pipeline is the mechanism by which these improvements reach the
estimate without a redeploy.
