# 0013 — Body composition uses Asian BMI cut-offs

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
BMI bands: <18.5 過輕, 18.5–22.9 正常, 23–24.9 偏高, ≥25 過高. Visceral fat: ≤9 正常,
10–14 偏高, ≥15 過高. Body-fat percentage keeps the bundled gender bands in the reference leaflet,
but the live app returns 「無適用參考標準」 for that badge because age/gender collection was removed.

## Rejected
- **WHO international cut-offs (25 overweight / 30 obese).** Rejected: they understate risk
  for the Hong Kong and Taiwan audience this product is for.
- **Leaving Tanita readings ungraded** (the first implementation). Rejected: a module that
  only stores numbers gives the user nothing to act on.

## Why
The grade must be right for the actual user population.

## Consequences
Chart and leaflet stay in lockstep: changing a band means changing both, in `charts.ts`. Gender-dependent bands cannot be applied unless a future approved scope provides a non-profile way to do so.
