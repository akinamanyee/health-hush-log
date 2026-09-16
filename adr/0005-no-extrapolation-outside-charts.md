# 0005 — No extrapolation outside chart coverage

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
When age or gender falls outside a matrix (or the profile is incomplete), the app shows
「無適用參考標準」 and still saves the raw reading.

## Rejected
- **Extending the nearest age band.** Rejected: an invented grade is the one unacceptable
  failure in a health logbook — worse than no grade.
- **Refusing to save the reading.** Rejected: the number itself is still the user's record.

## Why
Honest silence beats a confident wrong tier.

## Consequences
Users without a filled-in profile see a prompt to add age and gender rather than a grade.
