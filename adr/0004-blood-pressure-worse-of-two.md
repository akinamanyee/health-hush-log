# 0004 — Blood pressure graded worse-of-two, plus an isolated-systolic flag

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
Systolic and diastolic are each matched to a tier independently and the **worse** tier is
reported. When systolic ≥140 while diastolic <90 (and not crisis level), the label gains
「・單純收縮期高血壓」.

## Rejected
- **Grading on systolic alone.** Rejected: hides isolated diastolic hypertension.
- **Averaging the two, or using a combined score.** Rejected: not how the official charts
  read, and it would soften a genuinely high reading.

## Why
It matches the reference charts and surfaces the pattern most common in the 50+ audience.

## Consequences
A reading like 152/78 correctly reads 高血壓（第一期）・單純收縮期高血壓 — the demo case.
