# M32 — Tanita 每項必填、部位測量下架

**Status:** approved 2026-09-26

## Goal

The Tanita module drops the two segmental sections (部位脂肪率 ×5,
部位肌肉量 ×5) entirely, and elevates the remaining 7 previously-optional
fields (體脂量, 肌肉比率, 肌少症指數, 身體水分率, 身體水分量,
基礎代謝率 kcal, 基礎代謝率 kJ) to required. Net: 22 fields → 12,
all 必填. Removes the 選填 tag and collapsed `<details>` block from the
record page. Wire payload and Zod extraction schema trimmed to match.

## Field list — `tanita.fields[]` becomes exactly these 12, in this order

All entries: **no** `optional`, **no** `group`.

| # | key | label | unit | min | max | step |
|---|---|---|---|---|---|---|
| 1 | weight | 體重 | 公斤 | 20 | 300 | 0.1 |
| 2 | bodyFat | 體脂率 | % | 1 | 70 | 0.1 |
| 3 | fatMass | 體脂量 | 公斤 | 0.1 | 200 | 0.1 |
| 4 | muscleMass | 肌肉量 | 公斤 | 5 | 120 | 0.1 |
| 5 | muscleRatio | 肌肉比率 | % | 1 | 80 | 0.1 |
| 6 | smi | 肌少症指數（SMI） | kg/m² | 3 | 12 | 0.01 |
| 7 | bodyWaterPct | 身體水分率 | % | 10 | 80 | 0.1 |
| 8 | bodyWaterKg | 身體水分量 | 公斤 | 5 | 200 | 0.1 |
| 9 | visceralFat | 內臟脂肪等級 | (空) | 1 | 59 | 1 |
| 10 | bmrKcal | 基礎代謝率 | kcal | 500 | 5000 | 1 |
| 11 | bmrKj | 基礎代謝率 | kJ | 2000 | 21000 | 1 |
| 12 | bmi | BMI | (空) | 10 | 60 | 0.1 |

## Screen changes

| Screen | Before | After |
|---|---|---|
| bodyFat | `["bodyFat","fatMass","weight","fatTrunk","fatArmR","fatArmL","fatLegR","fatLegL"]` | `["bodyFat","fatMass","weight"]` |
| muscle | `["muscleMass","muscleRatio","smi","weight","muscleTrunk","muscleArmR","muscleArmL","muscleLegR","muscleLegL"]` | `["muscleMass","muscleRatio","smi","weight"]` |
| water, visceral, bmr, bmi | unchanged | unchanged |

M31 descriptions preserved verbatim on all 6 screens.

## `TanitaRecord.tsx` changes

1. Delete `segmentalGroups` / `collapsedGroups` / `collapsedGroupOrder` block — dead code.
2. Delete the `<details>` / `<summary>` render — nothing to collapse.
3. Simplify `mainFields` back to `screenFields`.
4. Remove the `{f.optional && <span>選填</span>}` render.
5. Preserve the `weight` disabled-repeat pattern (weight still appears on all 6 screens).

## `ai.functions.ts` changes

1. `TanitaExtracted` Zod schema — drop the 10 segmental keys; keep other 12 as `.nullable()`.
2. Whole-module extraction prompt — drop the 10 segmental key descriptions.
3. Per-screen prompts `bodyFat` and `muscle` — drop the segmental key descriptions.
4. `SELF_LOOKUP_CARD_NAMES` — unchanged.

## PRD alignment

| PRD | Check |
|---|---|
| L13 anonymous | ✓ no user model |
| L23 NORTHSTAR | ✓ improved (no 必填/選填 ambiguity) |
| L34 USER JOURNEY 3 | ✓ manual + photo paths preserved |
| L47 anonymous | ✓ |
| L48 local-only | ✓ no storage schema bump |
| L50 wire payload | ✓ segmental keys leave schema; other 12 unchanged |
| L51 grading + Exception | ✓ no grader change; Exception list unchanged |
| L52 grounded AI | ✓ REFERENCE_LEAFLET / TIPS_REFERENCE byte-identical |
| L55 繁中 | ✓ no label change |
| L56 disclaimer | ✓ chrome preserved |
| L57 Japanese-minimalist | ✓ cleaner page |
| Roadmap M17 「16 fields optional」 | superseded — noted in M32 entry |

## Design decisions

1. 必填 is enforced by the save button (existing `!f.optional` gate in `useRecordState.submit`).
2. Segmental fields removed from Zod schema + prompts, not just UI.
3. No storage migration; orphan keys in old entries are harmless.
4. `ScreenDef.description` (M31) unchanged.
5. No PRD change; roadmap M32 entry supersedes M17's "optional" language.

## Risks + fixes

| Risk | Fix |
|---|---|
| SMI-less devices can't save | User's explicit call; SMI stays required. |
| Orphan keys in old localStorage entries | Reader path filters by `mod.fields`; invisible. No migration. |
| CSV loses segmental columns | Acceptable — user asked to drop the section. |
| Save now blocked on any empty field | This IS the requested clarity. Inline 「請輸入數值」 shows. |
| Photo of one screen fills 3–4 fields only | Existing multi-shot flow (M19) handles it; toast reads N / 12 now. |
| Stale AI response with removed key | Zod default `.strip` drops unknowns silently. |

## Files to touch

- `src/lib/health/modules.ts`
- `src/components/health/TanitaRecord.tsx`
- `src/lib/health/ai.functions.ts`
- `plan/35-m32-tanita-required-fields.md` (this file)
- `Product_Roadmap.md`
- `CHANGELOG.md`

## Non-goals

No storage migration, no schema version bump, no PRD change, no grading
change, no AI grounding change, no other module change, no new ADR.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/tanita` shows 12 fields across 6 screens (bodyFat 3, muscle 4, water 3, visceral 2, bmr 3, bmi 2 — with weight disabled-repeat)
4. Zero 「選填」 label anywhere on `/tanita`
5. Zero `<details>` collapsed section on `/tanita`
6. Empty required field shows inline 「請輸入數值」 on save
7. Old entries with `fatTrunk` etc. open cleanly in history (values hidden)
8. Other 3 record pages unchanged
9. `/summary` cards render as before
