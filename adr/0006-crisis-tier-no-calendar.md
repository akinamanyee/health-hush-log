# 0006 — Crisis-level readings show 即時就醫 instead of a re-check date

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
Re-check intervals are 2 years (normal), 1 year (elevated), 6 months (hypertensive). At
crisis level the app shows 「即時就醫」 and offers no calendar entry.

## Rejected
- **A very short re-check date, e.g. one week.** Rejected: it implies waiting is safe.
- **Offering the calendar link anyway.** Rejected: a diary reminder competes with the only
  message that matters at that reading.

## Why
The correct action for a crisis reading is now, not a future appointment.

## Consequences
The calendar block is intentionally absent for that tier.
