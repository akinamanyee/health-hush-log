# M39 — SMI 及 BMI 改為推算值，改而記錄身高

**Status:** approved 2026-09-29

## Goal

TANITA displays neither SMI nor BMI on a dedicated screen on the user's
model. SMI is a downstream interpretation of muscle info; BMI is a
straight calculation from weight and height. Stop treating them as raw
inputs. Add height as a single new raw field; derive BMI and SMI on
save; keep all downstream consumers (grader, summary card, CSV,
history) reading by key without change.

## What we build

### `src/lib/health/modules.ts`

- `ScreenDef` gains optional `supportsPhoto?: boolean` (defaults true).
- Tanita `fields` rewritten (12 → 11):
  - Removed: `smi`, `bmi`.
  - Added: `height` (身高, 厘米, min 120, max 230, step 1).
  - Order: weight, bodyFat, fatMass, muscleMass, muscleRatio,
    bodyWaterPct, bodyWaterKg, visceralFat, bmrKcal, bmrKj, height.
- Screens:
  - muscle: fields `["muscleMass", "muscleRatio", "weight"]` (smi dropped).
  - bmi: label 「身高與 BMI」, fields `["height", "weight"]`,
    `supportsPhoto: false`, description updated to name auto-calculation.
  - Other 4 screens unchanged.

### `src/lib/health/ai.functions.ts`

- `TANITA_SCHEMA`: drop `smi` and `bmi` keys.
- Whole-module `EXTRACTION_FIELDS.tanita` prompt: drop `smi` and `bmi`.
- `TANITA_SCREEN_PROMPTS.muscle`: drop `smi`. Keep 3 keys.
- `TANITA_SCREEN_PROMPTS.bmi`: entry removed (screen no longer supports
  camera).

### `src/components/health/useRecordState.ts`

- `derived` memo — for tanita only, augments `numeric` with computed
  `bmi = weight / (height/100)²` (1 decimal) and
  `smi = muscleMass / (height/100)²` (2 decimals) when the raw inputs
  are present. Non-tanita modules pass numeric through unchanged.
- `gradeEntry(mod, derived)` — grader sees derived values live in the
  record page.
- `submit()` calls `makeEntry(derived, date)` — entries carry the
  derived values in the same `values.bmi` / `values.smi` keys old raw
  entries used, so history / CSV / summary read by key unchanged.
- Height pre-fill useEffect — on mount, if module is tanita, hydrated,
  and current `values.height` is empty, seeds it from the most-recent
  entry that has `height`. Returning users don't re-type.
- `derived` exposed in the hook return.

### `src/components/health/TanitaRecord.tsx`

- Consume `derived` from `useRecordState`.
- `<ImageDrop>` render guarded by `screen.supportsPhoto !== false`.
- On the bmi screen, below the field grid: two lines —
  「身高一次輸入即可，下次記錄會自動填入。BMI 會由體重及身高自動計算。」
  and 「推算 BMI：<value>」 (live from `derived["bmi"]` when both raw
  inputs are present).

### `src/routes/summary.tsx`

- SMI disclosure gains one `<p className="text-xs text-muted-foreground">`
  after the M38 caption:
  「註：本應用程式以總肌肉量 ÷ 身高平方（kg/m²）推算 SMI，與部分
  TANITA 儀器所顯示的 SMI 讀數（以四肢肌肉量計算）可能略有差異。」

## PRD alignment

| PRD | Check |
|---|---|
| L13 anonymous — no age/gender | ✓ height is a body measurement, not age or gender |
| L47 anonymous | ✓ |
| L23 NORTHSTAR (trustworthy) | ✓ no lie that BMI/SMI are read off Tanita display |
| L34 USER JOURNEY 3 (record) | ✓ preserved; one less screen with camera |
| L35 USER JOURNEY 4 (shows the tier) | ✓ BMI grader still fires on derived bmi |
| L48 local-only | ✓ no envelope bump; height stored per-record |
| L50 wire | ✓ height never enters summary card list; interpretCard reads bmi/smi by key |
| L51 Exception | ✓ SMI still on 6-card list; card + matrix + ★ overlay preserved |
| L52 grounded AI | ✓ REFERENCE_LEAFLET / TIPS_REFERENCE / allowedNumbers byte-identical |
| L55 繁中 | ✓ 身高, 推算 BMI, 註… all 繁中 |
| L57 Japanese-minimalist + 50+ | ✓ same UX; one screen loses camera correctly |

## Storage / migration

Envelope stays `{v:1, data}`. No migration.

- Old entries retain their raw `bmi` and `smi` values in `e.values` —
  displayed on `/summary` (interpretCard reads by key), but not in
  `/tanita` history row summary line (which filters by `mod.fields`,
  which no longer contains bmi/smi keys). Acceptable — historical
  numbers still viewable on the summary card.
- New entries have `values.bmi` and `values.smi` populated by the
  `derived` memo alongside `values.height`. Shape identical to old
  raw entries + one new `height` key.

## Design decisions

1. Both BMI and SMI derived from a single new raw field (height).
2. Height per-record with pre-fill from last entry — not a profile.
3. `supportsPhoto?: boolean` on ScreenDef — one-liner extension,
   single call site.
4. SMI caveat note on summary card — honest disclosure that our
   derivation uses total muscle vs TANITA's appendicular.
5. `.strip` Zod default drops any stale AI-echoed smi/bmi keys safely.
6. Ready memo (M36) unchanged — walks mod.fields (11 keys, all
   required); bmi/smi not gated since derived.

## Risks + fixes

| Risk | Fix |
|---|---|
| User's derived SMI differs from their TANITA scale reading | Caveat note explains the calculation basis difference. |
| Height entered in metres (1.75) not cm (175) | Range 120–230 → 1.75 out of range → M36 red validation. |
| Old entries' bmi/smi drop from /tanita history row summary line | Values remain in storage; summary card renders them. Acceptable. |
| First tanita record after M39 has no prior height | Type once; subsequent records auto-fill. |
| Zod schema drops smi/bmi keys | `.strip` silently drops stale AI responses. |

## Files to touch

1. `src/lib/health/modules.ts`
2. `src/lib/health/ai.functions.ts`
3. `src/components/health/useRecordState.ts`
4. `src/components/health/TanitaRecord.tsx`
5. `src/routes/summary.tsx`
6. `plan/42-m39-smi-bmi-derived.md` (this)
7. `Product_Roadmap.md`
8. `CHANGELOG.md`
9. `adr/0025-static-reference-vs-ai-advice.md` — one line

## Non-goals

No envelope bump, no PRD change, no wire change, no new AI grounding
numbers, no profile/gender/age, no new ADR, no grader change.

## Acceptance

1. `bunx tsc --noEmit` clean; `bun run build` clean.
2. `/tanita`: 11 fields across 6 screens (bodyFat 3 / muscle 3 / water 3 / visceral 2 / bmr 3 / 身高與BMI 2).
3. Muscle screen photo prompt lists no SMI.
4. 身高與 BMI screen: no `<ImageDrop>`; explanatory lines + live BMI preview when weight + height present.
5. weight=70, height=170 saved → `entry.values.bmi ≈ 24.2`; BMI grader still emits 「偏高」.
6. muscleMass=30, height=170 saved → `entry.values.smi ≈ 10.38`.
7. `/summary` SMI card shows M38 caption + new caveat + ★ overlay on derived SMI.
8. Second tanita record: 身高 field pre-filled from last entry.
9. Old localStorage entries still show their raw bmi/smi on `/summary`.
10. Other 3 modules untouched.
