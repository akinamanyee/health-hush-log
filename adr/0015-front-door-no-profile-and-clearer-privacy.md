# 0015 — Front-door refresh, no profile collection and clearer privacy wording

Date: 2026-09-17 (HKT) · Status: accepted

## Decision
The next product direction adds a cover page before the dashboard, uses the final module labels
血壓、身體成份分析儀、手握力、坐地前伸測試, pairs those labels with user-supplied icons, removes
age and gender collection, shows full recording dates including year, offers camera capture or
photo upload where image reading is available, and makes privacy/data-usage wording visible at
the points of use.

## Rejected
- **Keeping age and gender as a homepage profile gate.** Rejected: the PRD says no profiles, and
  the user explicitly removed the need for age and gender.
- **Guessing age/gender-dependent grades.** Rejected: that would invent a health classification;
  the app must say 「無適用參考標準」 when the bundled chart cannot be applied.
- **Starting from a new roadmap.** Rejected: the roadmap is cumulative, so the new milestones are
  appended after delivered M1–M8.

## Why
The app should feel easier and safer for older users: enter calmly, choose the right test, record
without unnecessary personal details, and understand exactly what data stays local or leaves only
for AI reading.

## Consequences
The PRD becomes Version 1.2 and the roadmap gains M9–M14 before code implementation. Hand grip,
sit-and-reach and gender-specific body-fat grades must fall back to 「無適用參考標準」 unless a future
approved scope provides a non-profile way to apply those charts.