# Ethics

Reading an identity from a person's spending carries obligations. Three rules bound
the layer.

## 5.1 No fabrication

Every trait maps to one concrete signal, and a trait with no supporting data returns
empty — the interface shows an honest "not enough data yet" state rather than a
made-up number. The same holds for the social layer: cohort counts are real counts,
shown even when small, never inflated to suggest a larger community than exists. The
identity grows from real spending or it stays blank.

## 5.2 Honest empty states

A new person, or one with few receipts, will not yet have a readable identity. Rather
than fill the gap, the layer says so and explains what unlocks it: more receipts, or
receipts at different times for the timing signal, or repeat visits for the loyalty
signal. The empty state is part of the design, not a failure of it — it keeps the
identity tied to evidence.

## 5.3 Privacy

- **Aggregate, not individual.** The tribe surfaces counts and shared places. It
  never exposes another person's individual basket; discovery is a count of how many
  in the cohort visit a merchant, not a window onto anyone's purchases.
- **Behaviour, not coordinates.** Place is read as a city from receipts. Merchant
  coordinates are not used, and there is no distance- or location-tracking layer.
- **The person owns the reading.** The identity is presented as something a person
  sees about themselves, framed in the language of self-knowledge rather than
  judgement — the stance the [wider literature](04-wider-literature.md) on
  self-determination and non-judgmental data informs.

## 5.4 Calibration stays private

As with the hidden-cost layer, the mechanism is described here in full while the
thresholds that score each trait remain in production. This is not a gap in the
method's transparency — the method is fully stated — but a boundary that keeps
operational calibration out of public view. The same boundary is applied across
Yumo Yumo's technical writing.
