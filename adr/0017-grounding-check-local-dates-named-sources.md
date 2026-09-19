# 0017 — Grounding check after generation, local dates, named grading sources

Date: 2026-09-19 17:01 HKT · Status: accepted

## Context
The PRD promises strictly grounded advice, strict grading against official charts, and honest
recording dates. The build asked the model to stay grounded but never checked the result; the
grading file described its sources loosely ("ESH/ACC-AHA style"); record dates came from UTC, so a
reading entered before 08:00 HKT was saved to the previous day; re-check dates could overflow a
month end; voice dictation only understood Arabic digits; and a re-check reminder existed only for
the record just saved.

## Decision
- Validate the summary after generation: every number in it must already appear in the bundled
  leaflet and the medical reminder must be present. One strict retry, then the summary is withheld
  with a plain Chinese explanation — never shown ungrounded.
- Name exactly one authoritative source per grading table in `charts.ts` (2017 ACC/AHA blood
  pressure categories, WHO Asia-Pacific BMI cut-offs, Tanita visceral-fat rating scale) and delete
  the unreachable age/gender norm tables, which this app cannot apply since it collects neither.
- All record dates use the device's local calendar (`src/lib/health/dates.ts`), and month addition
  clamps the day so 31 August + 6 months is 28 February.
- Voice dictation parses Chinese numerals and decimals as well as digits, on-device.
- Any past blood-pressure record can produce its re-check reminder from the history list.
- Restate the NORTHSTAR as "no health record stored off the device", which matches the PRD's own
  allowance for a transient photo read and grade-label summary.

## Consequences
A failed grounding check costs the user a regeneration instead of showing invented numbers.
Stored data is unchanged; the removed tables were never reachable from any screen.
