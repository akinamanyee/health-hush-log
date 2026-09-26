# M29 — 坐地前伸 self-lookup card (5-tier × 5-age × 2-gender norms)

**Status:** approved 2026-09-26 · mirrors M28 handgrip; extends M28a
Exception-ripple to sit-reach.

## Goal

The 坐地前伸 summary card gains a 職安局 5-tier × 5-age × 2-gender
reference matrix with a ★ overlay on cells containing the user's
recorded distance (cm). `gradeEntry` for sit-reach returns `[]` (mirrors
M28a grip) so `/sitreach` record page, `/logbook` rows, and CSV grade
column stop showing the now-inaccurate 「無適用參考標準」 label.

## Data quirk (verbatim, not patched)

Source has 2 structural gaps where adjacent tiers skip an integer:
- 男 30-39: Normal 25-29 · Good 31-34 → value **30** unclassified
- 男 60-69: Normal 17-21 · Good 23-29 → value **22** unclassified

Transcribed as given. Reading of 30 or 22 shows no ★ (fails safe);
footer explicitly names the two values so users know to consult
neighbours. `classifySitReach` returns `undefined` for both.

## Non-goals

- No new agency in `Agency` union (職安局 already present — same as M28)
- No storage schema bump — `distance` field key + numeric shape unchanged
- No new AI grounding numbers — matrix stays in JSX only
- No changes to grip / body-fat / BMR / water / SMI / other cards
- No `matchesCell` regex change (M28's `≤N`, `N-M`, `≥N` branches already cover)

## PRD alignment

| PRD | Check |
|---|---|
| L13/L50 no age/gender collected | ✓ Static matrix; user visually picks row |
| L51 grade + Exception (5 cards → 6) | ✓ 坐地前伸 joins; grader "unchanged" preserved (absence-of-grade is what Exception already promises) |
| L52 grounded AI advice | ✓ No leaflet number change |
| L55 Traditional Chinese | ✓ All labels 繁中 |
| ADR 0019 government source | ✓ 職安局 already accepted |
| ADR 0024 sensitive-word filter | ✓ No 男士/女士/長者/學生 in new content |
| ADR 0025 numbers-in-JSX-only | ✓ Values in `sitreach.ts` + `summary.tsx` |
| Handles negative distance | ✓ `matchesCell`'s `≤N` handles negatives correctly (-5 ≤ 21 → true → poor) |

## File changes

- **NEW** `src/lib/health/sitreach.ts` — matrix constants + `classifySitReach` utility. Runtime callers = none (ADR 0025). Header comment documents the 2 gaps.
- `src/lib/health/grade.ts` — `case "sitreach":` returns `[]` (drops the `[{label:"無適用參考標準"}]` return). `interpretCard` sit-reach `action` string updated to 「請對照下方 職安局 參考表自行對照」.
- `src/lib/health/ai.functions.ts` — `SELF_LOOKUP_CARD_NAMES` gains `"坐地前伸"` (grows 5→6).
- `src/lib/health/charts.ts` — leaflet 【坐地前伸測試參考】 sentence appends 「本應用程式在坐地前伸卡片下方展示 職安局 標準參考供用家自行對照。」.
- `src/routes/summary.tsx` — imports from `sitreach.ts`; `buildSitReachDisplay` derives display cells from `SIT_REACH_NORMS`; new `SitReachMatrixTable` + `SitReachStandardTable` components; `parseSitReachValue = parseLeadingNumber`; render gate; `CARDS_WITH_SELF_LOOKUP` gains `"坐地前伸"`.
- `PRD.md` L51 — Exception list extended to 6.
- `adr/0025-static-reference-vs-ai-advice.md` — M29 Source change history entry (extension + 2-gap decision).
- `Product_Roadmap.md` — M29 entry.
- `CHANGELOG.md` — M29 delivery entry.

## Design decisions

1. Verbatim transcription — no silent patch of the 2 source gaps; fails safe.
2. `gradeEntry` returns `[]` for sit-reach — mirrors M28a grip pattern.
3. `matchesCell` unchanged — its 3 branches cover all cell formats.
4. Card name string `"坐地前伸"` — matches `interpretCard`'s hardcoded name.
5. Field label 「前彎距離」 unchanged — single value, no L+R issue.
6. Source assumed 職安局 (same shape as M28); footer single-line editable if wrong.
7. Cell display: `"≤21 cm"`, `"22-26 cm"`, `"≥37 cm"` — mirrors handgrip.

## Risks + fixes

| Risk | Fix |
|---|---|
| 2 source gaps (30 and 22) | Verbatim; footer named; classifier returns undefined |
| Negative distance | `≤N` regex handles correctly |
| Sit-reach record/logbook now show no badge | Consistent with M28a Exception ripple |
| ≥70 users no ★ | Footer note (same as M28) |
| Two Sets grow 5→6 | Pre-existing 🟡 SSOT drift (M27 note); non-blocking |
| CSV grade blank for sit-reach | Accepted per M28a precedent |

## No migration
- Envelope v1, field key `distance`, numeric shape all unchanged.
- Old records read as before.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. Node unit tests: classifier boundaries × all 10 rows + explicit gap tests (30 → undefined; 22 → undefined) + negative reading → 欠佳 + ≥70 → undefined + matchesCell regression
4. `/summary` sit-reach card: no badge; disclosure with 男/女 5×5 tables; ★ overlay; footer with cm/negative/gap/70+/職安局 notes
5. `/sitreach` record page: no 「無適用參考標準」 label / no grade preview
6. `/logbook` sit-reach rows: no badge
7. CSV: sit-reach grade cell blank
8. Table fits inside card border on iPhone SE (M28a's `min-w-0` applies)
9. All other cards unchanged
