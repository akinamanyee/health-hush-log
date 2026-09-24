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
| 2026-09-19 | [0016](adr/0016-stable-logbook-and-derived-history-grades.md) | Keep a stable logbook destination and derive saved-history grades from the single grader |
| 2026-09-19 | [0017](adr/0017-grounding-check-local-dates-named-sources.md) | Summaries are grounding-checked after generation; dates are local; grading sources named one-per-table |
| 2026-09-19 | [0018](adr/0018-summary-sends-readings-with-grades.md) | The AI summary receives readings alongside grade labels (supersedes 0007) |
| 2026-09-19 | [0019](adr/0019-bundled-government-health-tips.md) | Health tips distilled from government articles and bundled as constants |
| 2026-09-22 | [0020](adr/0020-direct-gemini-and-generatetext.md) | Direct Google Gemini provider and generateText over streamText |
| 2026-09-22 | [0021](adr/0021-pre-process-image-to-uint8array.md) | Upgrade @ai-sdk/google to v4 for ai v7 compatibility (fixes inline_data bug) |
| 2026-09-22 | [0022](adr/0022-tanita-six-screen-sections.md) | Six-screen Tanita sections with per-screen photo extraction; voice removed from Tanita; ScreenDef.fields is the SSOT for field-to-screen mapping |
| 2026-09-23 | [0023](adr/0023-gender-neutral-tips-and-leaflet.md) | Remove gender-specific content from health tips and reference leaflet; partially overrides ADR 0019 append-only rule |
| 2026-09-23 | [0024](adr/0024-agency-only-attribution-and-sensitive-word-check.md) | Display agency only (not article titles/URLs); AI prompt no longer sees titles; grounding check rejects 男士/女士/長者/學生 |
| 2026-09-24 | [0025](adr/0025-static-reference-vs-ai-advice.md) | Static reference material from an authoritative source may be gender/age structured; AI-generated content may not |
