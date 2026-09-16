# Changelog

What changed, when, and why. Newest first. Times are Hong Kong Time (UTC+8).
Once this file passes ~100 entries, the older half moves to `changelog-archive.md`
(append-only). Entries here are written when the change is made, not reconstructed later.

## 2026-09-16 23:08 — Living docs established
- Added `ARCHITECTURE.md`, `DECISIONS.md` with `adr/0001`–`0014`, this changelog, and the
  `plan/` folder with the build plans behind the work so far.
- Rewrote `README.md` so it points at these documents instead of contradicting them.
- Recorded blood-pressure photo reading in the PRD, which the code already shipped.
- Why: intent, structure, rationale and history each need one authoritative home.
  ([ADR 0014](adr/0014-living-docs-structure.md))

## 2026-09-16 23:04 — PRD reconciliation fixes (six items)
- The health summary now sends **grade labels only** — no readings, dates, age or gender.
  Verified in the live network payload. ([ADR 0007](adr/0007-summary-sends-grade-labels-only.md))
- Body composition is now graded: BMI, 體脂率 and 內臟脂肪等級 each get their own badge,
  using Asian cut-offs. ([ADR 0013](adr/0013-asian-bmi-cutoffs.md))
- Added `gradeEntry()` as the single grader and `readEntries()` as the single stored-data
  reader; removed the duplicated inline copies in the form, the export and the summary.
  ([ADR 0008](adr/0008-single-reader-single-grader.md))
- The 「僅供參考，不能取代醫生診斷」 and 「資料只存在此裝置」 notices now sit permanently on all
  four module pages and the summary page, instead of appearing only as a passing toast.
- CSV export gained a 評級 column and keeps its UTF-8 BOM; grades sit only on graded fields.
  ([ADR 0011](adr/0011-csv-bom-and-grade-column.md))
- The daily AI counter now increments only after a successful call, so a failure no longer
  burns the user's allowance. ([ADR 0010](adr/0010-best-effort-daily-ai-cap.md))
- Form inputs are now properly linked to their labels, which also helps screen readers.
- Restored `PRD.md` to the project root as the single source of truth for scope.
- Plan: [plan/09-prd-reconciliation.md](plan/09-prd-reconciliation.md)

## 2026-09-16 — Initial build: milestones M1–M8
- Design system and Traditional Chinese 50+ friendly shell; dashboard with four module cards.
- Blood pressure module with worse-of-two grading and the isolated-systolic flag, local
  history and trend chart. ([ADR 0004](adr/0004-blood-pressure-worse-of-two.md))
- Re-check dates by tier with `.ics` download and Google Calendar link; crisis readings show
  即時就醫 instead. ([ADR 0006](adr/0006-crisis-tier-no-calendar.md))
- Body composition, grip strength and sit-and-reach modules with age × gender matrices and
  honest 無適用參考標準. ([ADR 0005](adr/0005-no-extrapolation-outside-charts.md))
- Photo drag-and-drop read by a server-side AI call into an editable review form, confirmed
  before saving; image downscaled in the browser first.
  ([ADR 0002](adr/0002-ai-credential-in-own-server-layer.md), [ADR 0012](adr/0012-review-before-save.md))
- Voice dictation where the browser supports Chinese recognition.
  ([ADR 0009](adr/0009-capability-gated-voice-input.md))
- One-click CSV export and a deliberate two-step clear-all.
- Grounded health summary built strictly from the bundled reference leaflet.
- All data kept in browser storage; no database. ([ADR 0001](adr/0001-local-first-browser-storage.md))
- Plan: [plan/01-08-initial-build.md](plan/01-08-initial-build.md)
