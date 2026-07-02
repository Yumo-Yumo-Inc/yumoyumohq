# Class & tribe

The six traits describe a person. Two further layers describe where that person sits
among others: a **class** that names their dominant pattern, and a **tribe** of
people who share it.

## 3.1 Class — the two strongest traits

A person's class is named by their two highest-scoring traits, strongest first — for
example an *Explorer-Hunter* or a *Planner-Loyalist*. The class is a label composed
from evidence, not a category a person is sorted into from outside. Because it is
built from the two strongest signals, it foregrounds what most defines a person's
spending while leaving the full six-trait profile visible behind it.

A class is named only when there is enough data to read one. Below that point the
identity reports that it cannot yet name a class, rather than guessing.

## 3.2 Tribe — shared class and city

A tribe is everyone who shares a person's **primary trait** and **city**. It is the
social layer of the identity: real cohort counts, a class-based standing, and the
places the cohort frequents.

Two design rules keep the tribe honest:

- **Counts are real.** Every number is an actual count of people, shown even when the
  cohort is small. A tribe of two is shown as a tribe of two, never inflated.
- **Place, not distance.** The city comes from where a person actually shops, read
  from their receipts, with the profile city only as a fallback. Discovery is by city
  and class, never by physical distance, because merchant coordinates are not used.

## 3.3 Why the city signal comes from receipts

A profile field is filled in once and rarely updated; a receipt history shows where
a person genuinely spends. Taking the tribe's city from the most frequent merchant
city in a person's receipts ties the social layer to behaviour rather than to a
stale form field. When no receipt carries a city, the profile city is used as a
fallback.

## 3.4 What the social layer does not do

The tribe surfaces aggregate counts and shared places. It does not expose any other
person's individual purchases; discovery shows merchants frequented by the cohort as
counts, never as one person's basket. The privacy boundary is set out in the
[ethics section](05-ethics.md).
