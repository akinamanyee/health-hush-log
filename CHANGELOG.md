# Changelog

What changed, when, and why. Newest first. Times are Hong Kong Time (UTC+8).
Once this file passes ~100 entries, the older half moves to `changelog-archive.md`
(append-only). Entries here are written when the change is made, not reconstructed later.

## 2026-09-19 23:58 — Cover page: spacing and privacy button refinement
- Increased bottom padding from `pb-12` to `pb-24` so the "進入" button sits further from the image icons above it.
- Moved the "私隱與資料使用" dialog trigger from top-right to bottom-right, reduced to ~40% of its former size (`text-xs`, `size-3.5` icon, no background or shadow), styled as a subtle `muted-foreground/70` ghost button.
- Why: the enter button was too close to the cover image's icons; the privacy link should be discoverable but unobtrusive.

## 2026-09-19 23:32 — Cover page: full-viewport image, no phone frame
- Removed the card-like Button wrapper (`rounded-[2rem] border border-border bg-card shadow-2xl`) that made the cover image appear inside a phone frame.
- The cover image now fills the entire viewport as an absolute-positioned background with `object-cover`; a simple "進入" button sits at the bottom and the "私隱與資料使用" dialog button floats top-right.
- Why: the cover should show the supplied image edge-to-edge, not inside a device frame.

## 2026-09-19 23:07 — M18 audit cleanup: SSOT, perf, dead code, living docs
- `interpretCard()` now calls `gradeEntry()` internally instead of duplicating grading logic — `gradeEntry` remains the single grading authority. ([ADR 0008](adr/0008-single-reader-single-grader.md))
- Added `tone` to `CardInterpretation`; summary.tsx uses it directly, eliminating the duplicated `gradeTone()` function.
- Hoisted `interpretCard` computation out of the render `.map()` loop into a `cardMap` computed once during `generate()`.
- Removed dead `gradeEntry` import from summary.tsx.
- Removed dead `generateHealthSummary`, `SummaryInput` and `groundingFailure` from ai.functions.ts (replaced by `generateRichSummary`).
- PRD privacy boundary updated to reflect that M18 sends readings alongside grades. ([ADR 0018](adr/0018-summary-sends-readings-with-grades.md))
- Updated ARCHITECTURE.md (data flow, SSOT docs, privacy model), Product_Roadmap.md (M18 entry, status line), and this changelog.

## 2026-09-19 — M18: Rich structured health summary with government-sourced tips
- Replaced the free-text health summary with a structured report: each metric gets a plain-language interpretation card (value, grade badge, AI-written explanation), followed by 3–5 actionable health tips with clickable source links to Hong Kong government health articles.
- Distilled 16 government articles into a bundled `TIPS_REFERENCE` constant (6 topic blocks covering cardiovascular disease, BMI, hypertension, visceral fat, diet and exercise); tips are pre-filtered by the user's grades before reaching the AI. ([ADR 0019](adr/0019-bundled-government-health-tips.md))
- Added `interpretCard()` as the deterministic card-data builder for the summary, returning structured data with name, value, grade, tone, range, and action.
- Source URL validation filters out AI-hallucinated URLs against the known valid set from bundled articles.
- The AI now receives formatted values alongside grade labels (no dates, age or gender). ([ADR 0018](adr/0018-summary-sends-readings-with-grades.md))
- Why: the summary should read like a clinic leaflet — every claim traceable to its source, every tip backed by a government article.

## 2026-09-19 21:34 — Multi-photo UX: smarter toast and progress counter
- The toast after each AI photo read no longer says "請核對數值後儲存" when more screens remain. For modules with optional fields (currently Tanita), the toast now shows how many of the module's fields are filled and suggests continuing if any remain empty.
- A "已填 X / Y 項" progress counter appears above the save button once at least one field is filled, so the user can see at a glance how complete the record is across multiple photos.
- No data-model, grading, storage or API changes — both additions are gated behind the existing `optional` field flag and only activate for Tanita.

## 2026-09-19 — M17: Complete Tanita body composition data (21 fields)
- Expanded the Tanita module from 5 to 21 fields to capture every metric the 身體組成分析儀 displays across its 6 screens: body fat mass, muscle ratio, body water (% and kg), BMR (kcal and kJ), and segmental fat % and muscle mass for trunk, arms and legs.
- All 16 new fields are optional — a record is valid with just the original 5. The form groups related fields under Chinese headings; segmental groups (部位脂肪率, 部位肌肉量) are collapsed by default to keep the form approachable.
- AI photo extraction schema and prompt updated to read all 21 values; fields not visible on the photographed screen return null. Multi-photo merge preserves earlier values.
- Added body water and BMR reference text to the bundled leaflet for grounded health summaries.
- No changes to grading (new fields have no universal chart without age/gender), storage format, CSV export, or voice input.

## 2026-09-19 17:08 — Living docs reconciled and completed
- Added the missing build plans for the last two milestones and recorded M16 in the roadmap, so every delivered milestone has its own small plan file.
- Wrote the project's working constitution (the rules any AI assistant must follow: local-first, deterministic grading, no invented numbers, review before save, server-side credentials, Traditional Chinese, docs updated in the same pass) into AGENTS.md and linked it from the README.
- Cleared the stale internal task list and noted the changelog's own archive rule in the README.
- Timestamp fetched live (Sat, 19 Sep 2026 09:08:32 GMT → 2026-09-19 17:08 HKT), not guessed.

## 2026-09-19 17:01 — Truthful privacy wording, checked summaries, honest dates
- Restated the NORTHSTAR as no health record stored off the device, matching the PRD's own transient photo-read and grade-label allowance.
- The health summary is now checked after it is written: any number not in the bundled leaflet, or a missing medical reminder, triggers one strict retry and then a plain refusal instead of ungrounded advice.
- Named one official source per grading table and removed the unreachable age/gender norm tables the app can never apply.
- Record dates and the daily AI count now follow the device's local calendar, so an early-morning reading no longer saves to yesterday; re-check dates clamp at month end.
- Voice input understands spoken Chinese numerals and decimals, not only digits.
- Any past blood-pressure record can now produce its own re-check reminder from the history list.
- Logbook tuning for older eyes: smaller phone illustrations, stronger secondary text, shorter guidance, and 清除所有資料 moved into its own clearly-marked area.
- Why: close the real drift found in the PRD reconciliation. ([ADR 0017](adr/0017-grounding-check-local-dates-named-sources.md))

## 2026-09-19 15:56 — Dashboard illustrations and core-journey corrections
- Replaced all four broken dashboard images with the supplied blood-pressure, scale, hand-grip and stretching illustrations, shown uncropped at equal visual size.
- Restored grade badges in saved history by deriving them from the existing single grader; no health-record schema or stored data changed.
- Extended camera and upload reading to hand grip and sit-and-reach, with module-specific validated values and the existing editable confirmation step.
- Added `/logbook` as the stable dashboard destination; module, summary, 404 and failure returns now go there instead of replaying the cover.
- Moved cover privacy terms behind a visible link, translated error experiences, and aligned the interior palette with the supplied mint-and-navy cover.
- Why: close the blockers found in the PRD reconciliation without introducing parallel data or changing the local-only privacy boundary. ([ADR 0016](adr/0016-stable-logbook-and-derived-history-grades.md))

## 2026-09-17 23:53 — Front-door build, no profile gate, icons and clearer privacy wording
- Added the supplied 護心計劃 front page image as the first screen and paired the four dashboard choices with the uploaded placeholder images.
- Removed age/gender collection from the live app and purge the legacy profile key; charts that need those details now show 「無適用參考標準」 while still saving the number.
- Renamed the user-facing modules to 血壓、身體成份分析儀、手握力、坐地前伸測試.
- Added camera-or-upload controls for photo reading, kept review-before-save, and made every saved record show a full date with year.
- Replaced scattered notices with plain privacy/data-usage wording on the cover, dashboard, module pages and summary.
- Added one small build plan for each M9–M14 milestone and linked them from the roadmap.
- Why: implement the approved Version 1.2 roadmap update. ([ADR 0015](adr/0015-front-door-no-profile-and-clearer-privacy.md))

## 2026-09-17 23:36 — Product roadmap update: front door, labels, dates and privacy wording
- Updated the PRD to Version 1.2 with the approved direction: cover page, no age/gender
  collection, full date/year on records, camera-or-upload photo entry, clearer privacy/data
  wording, and final module names.
- Added M9–M14 to `Product_Roadmap.md`, after the delivered M1–M8 sequence.
- Why: the next product direction must live in the PRD and roadmap before any build work.
  ([ADR 0015](adr/0015-front-door-no-profile-and-clearer-privacy.md))

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
