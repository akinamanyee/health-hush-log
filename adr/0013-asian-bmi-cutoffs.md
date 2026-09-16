# 0013 — Body composition uses Asian BMI cut-offs

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
BMI bands: <18.5 過輕, 18.5–22.9 正常, 23–24.9 偏高, ≥25 過高. Body fat is banded by gender
(male 11–22% normal, female 21–33% normal). Visceral fat: ≤9 正常, 10–14 偏高, ≥15 過高.
All three appear as separate badges, and the same numbers are written into the leaflet text
that grounds the AI summary.

## Rejected
- **WHO international cut-offs (25 overweight / 30 obese).** Rejected: they understate risk
  for the Hong Kong and Taiwan audience this product is for.
- **Leaving Tanita readings ungraded** (the first implementation). Rejected: a module that
  only stores numbers gives the user nothing to act on.

## Why
The grade must be right for the actual user population.

## Consequences
Chart and leaflet stay in lockstep: changing a band means changing both, in `charts.ts`.
