# 0003 — Grading is deterministic, never AI

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
Every grade comes from bundled reference tables in `src/lib/health/charts.ts`, computed
locally by `gradeEntry()`. The AI never grades and never sees a raw reading.

## Rejected
- **Asking the model to grade the reading.** Rejected: a grade is a medical-adjacent
  statement that must be reproducible and auditable; a model can drift or hallucinate a tier.
- **Fetching charts from an API at runtime.** Rejected: adds a network dependency and a
  failure mode to the one thing that must always work offline.

## Why
The same numbers must always produce the same tier, provably, offline.

## Consequences
Chart updates are code changes and land in the changelog, which is the intended audit trail.
