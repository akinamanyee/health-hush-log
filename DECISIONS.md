# Decisions — index

One dated line per decision. The reasoning, the options rejected and the consequences live
in the linked ADR file under `adr/`. This index never holds the argument itself.

| Date (HKT) | ADR | Decision |
| --- | --- | --- |
| 2026-09-16 | [0001](adr/0001-local-first-browser-storage.md) | Health data lives only in browser storage; no database |
| 2026-09-16 | [0002](adr/0002-ai-credential-in-own-server-layer.md) | AI credential sits in this app's own server functions, not a separate Supabase project |
| 2026-09-16 | [0003](adr/0003-deterministic-grading-not-ai.md) | Grading comes from bundled reference tables, never from AI |
| 2026-09-16 | [0004](adr/0004-blood-pressure-worse-of-two.md) | Blood pressure graded worse-of-two, with an isolated-systolic flag |
| 2026-09-16 | [0005](adr/0005-no-extrapolation-outside-charts.md) | Outside chart coverage the app says 無適用參考標準 and still saves the number |
| 2026-09-16 | [0006](adr/0006-crisis-tier-no-calendar.md) | Crisis-level readings show 即時就醫 instead of a re-check date |
| 2026-09-16 | [0007](adr/0007-summary-sends-grade-labels-only.md) | The AI summary receives grade labels only — no readings, dates, age or gender |
| 2026-09-16 | [0008](adr/0008-single-reader-single-grader.md) | One reader and one grader for stored data |
| 2026-09-16 | [0009](adr/0009-capability-gated-voice-input.md) | Voice input appears only where the browser supports Chinese dictation |
| 2026-09-16 | [0010](adr/0010-best-effort-daily-ai-cap.md) | Daily AI cap is best-effort per device, counted only on success |
| 2026-09-16 | [0011](adr/0011-csv-bom-and-grade-column.md) | CSV carries a UTF-8 BOM and a grade column on the primary field |
| 2026-09-16 | [0012](adr/0012-review-before-save.md) | AI-extracted values are always reviewed and confirmed before saving |
| 2026-09-16 | [0013](adr/0013-asian-bmi-cutoffs.md) | Body composition uses Asian BMI cut-offs |
| 2026-09-16 | [0014](adr/0014-living-docs-structure.md) | Living docs split into PRD, Architecture, Decisions, Changelog, Roadmap and per-milestone plans |
| 2026-09-17 | [0015](adr/0015-front-door-no-profile-and-clearer-privacy.md) | Next product direction adds a cover entrance, removes age/gender collection, renames modules, and clarifies privacy/data usage |
