# M38 — SMI 解說移至健康摘要

**Status:** approved 2026-09-29

## Goal

Tanita record-page muscle screen loses its M31 generic description (too
general to bind SMI into the reader's mental model; users felt the
screen was 「about 肌少症」 without the description saying so). The
SMI-specific explanation with gender thresholds moves to the 肌少症指數
card on `/summary`, rendered as a caption inside the SMI reference
disclosure, above the male / female matrix tables.

## What we build

### `src/lib/health/modules.ts`

- Drop `description` key from the `muscle` `ScreenDef`. Fields
  unchanged: `["muscleMass", "muscleRatio", "smi", "weight"]`.
- Other 5 screens' M31 descriptions preserved (bodyFat, water,
  visceral, bmr, bmi).

### `src/routes/summary.tsx`

- Inside `SmiStandardTable` (the `<details>` disclosure of the SMI
  card), between the `<summary>` heading and the first
  `<SmiMatrixTable>`, add:
  ```
  肌少症指數（SMI）反映骨骼肌相對身高的比例。
  男（肌少症指數 <7.0 kg/m²）為肌肉質量不足
  女（肌少症指數 <5.7 kg/m²）為肌肉質量不足
  ```
- Renders as a `<div>` with `space-y-1 text-base leading-relaxed`
  wrapping three `<p>` lines. Matches the visual idiom of the existing
  disclosure footer text.
- Numbers 7.0 and 5.7 already live in `SMI_MALE` / `SMI_FEMALE` matrix
  arrays and are already in `allowedNumbers`; the caption re-uses those
  same values in a new visual form. Zero AI grounding surface change.

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ no data collected |
| L23 NORTHSTAR (readable) | ✓ SMI explanation binds numbers to card |
| L34 USER JOURNEY 3 | ✓ record path cleaner |
| L38 USER JOURNEY 7 | ✓ SMI card gets the explanation |
| L48 local-only | ✓ no storage change |
| L50 wire | ✓ byte-identical |
| **L51 grading + Exception** | ✓ extends the Exception UI (matrix + caption) without changing the grader |
| L52 grounded AI | ✓ REFERENCE_LEAFLET / TIPS_REFERENCE / allowedNumbers byte-identical |
| L55 繁中 | ✓ verbatim from user's reference material |
| L57 Japanese-minimalist + 50+ | ✓ `text-base leading-relaxed` matches existing disclosure idiom |
| **ADR 0025** | ✓ gender-structured thresholds may appear in UI; AI wire-sanitize (SELF_LOOKUP_CARD_NAMES) still rewrites SMI grade to 「請自行對照下方對照表」 |

## Risks + fixes

| Risk | Fix |
|---|---|
| Muscle screen becomes barren | Matches grip / sit-reach / BP record pages — no inline description. Consistent. |
| Caption duplicates numbers already in matrix | Intended — prose caption for plain-language read; matrix for self-lookup. |
| Wire leakage | Zero — caption is JSX-only; wire sanitize preserved. |
| ADR 0024 sensitive-word (男/女) | UI reference text may name gender (matrix headings already do); only AI-generated content is filtered. |

## Files to touch

1. `src/lib/health/modules.ts`
2. `src/routes/summary.tsx`
3. `plan/41-m38-smi-explanation-relocated.md` (this)
4. `Product_Roadmap.md`
5. `CHANGELOG.md`
6. `adr/0025-static-reference-vs-ai-advice.md` — one line in Source change history

## Non-goals

No storage / wire / grader / AI change. No PRD change. No change to
the 5 other screen descriptions. No change to SMI matrix data or
footer. No new ADR.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/tanita`「2. 肌肉量」: NO description between heading and photo-drop
4. `/summary` SMI card disclosure: 3-line caption above the male / female matrix tables
5. Other 5 Tanita screens' descriptions preserved
6. SMI matrix, ★ overlay, footer unchanged
7. Wire byte-identical
