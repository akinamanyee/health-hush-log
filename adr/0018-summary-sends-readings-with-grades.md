# ADR 0018 — The AI summary receives readings alongside grade labels

**Date:** 2026-09-19 HKT
**Status:** Accepted — supersedes [ADR 0007](0007-summary-sends-grade-labels-only.md)

## Context

ADR 0007 established that the AI summary receives only grade labels — no readings, dates, age
or gender. M18's rich summary needs the AI to write per-card interpretations that reference the
user's actual values (e.g. "您的 BMI 為 24.5，屬偏高範圍"). Without the values, the AI can only
repeat the grade name, producing a less useful summary.

## Decision

`generateRichSummary` sends a structured card array containing each metric's name, formatted
value string (e.g. "130/85 mmHg"), grade label, reference range, and recommended action.
Dates, age, and gender are still never sent. The server function remains stateless (`store: false`).

## Options rejected

1. **Keep grade-labels-only** — the AI would produce vague text ("您的血壓屬高血壓第一期")
   without being able to reference the actual numbers, making the summary less readable and
   less trustworthy for the user who can see the numbers on their own screen.
2. **Send raw field values as numbers** — the AI would need to know field semantics. Sending
   pre-formatted strings with units is safer (no unit confusion) and the `interpretCard()`
   output already provides them.

## Consequences

- PRD NORTHSTAR, version history, and hard constraints updated to reflect the new boundary.
- PrivacyNotice component updated for `summary` and `dashboard` contexts.
- The allow-list for the grounding check now includes the user's own values, so the AI can
  cite them without triggering a false grounding failure.
- ADR 0007's "grade labels only" rule no longer holds for the summary path; the photo-read
  path is unchanged.
