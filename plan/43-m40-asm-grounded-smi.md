# M40 — Re-introduce ASM inputs for AWGS-grounded SMI

**Status:** approved 2026-09-29

## Goal

Fix the M39 SMI-derivation formula, which violated PRD L51
「never extrapolates」 by computing `smi = totalMuscleMass / height²`
against thresholds (AWGS 2019 男 <7.0 / 女 <5.7) derived from
appendicular skeletal muscle mass (ASM). M40 re-introduces the 4
limb muscle inputs the user's TANITA MC-780MA displays on its
segmental-muscle screen, sums them to ASM, and computes the
grounded `smi = ASM / (height/100)²`.

## What we build

### `src/lib/health/modules.ts`

- Re-add 4 raw fields between `muscleRatio` and `bodyWaterPct`
  (TRUNK not added — not needed for AWGS ASM):
  - `muscleArmL` 左臂肌肉量 公斤 0.1–15 step 0.1
  - `muscleArmR` 右臂肌肉量 公斤 0.1–15 step 0.1
  - `muscleLegL` 左腿肌肉量 公斤 0.5–30 step 0.1
  - `muscleLegR` 右腿肌肉量 公斤 0.5–30 step 0.1
- New screen inserted between `muscle` and `water`:
  - `id: "asm"`, `label: "四肢肌肉量"`,
    fields `["muscleArmL", "muscleArmR", "muscleLegL", "muscleLegR", "weight"]`
  - description names ASM = arms + legs and the AWGS 2019 basis.
- Net: 11 → 15 fields; 6 → 7 screens.

### `src/lib/health/ai.functions.ts`

- `TANITA_SCHEMA` regains 4 nullable keys.
- Whole-module `EXTRACTION_FIELDS.tanita` lists all 14 keys.
- New `TANITA_SCREEN_PROMPTS.asm` names the 4 limb keys with the
  device-label hints (L ARM / R ARM / L LEG / R LEG) that appear
  on the segmental-muscle screen photo.

### `src/components/health/useRecordState.ts`

- `derived` memo rewritten. BMI derivation unchanged.
- SMI derivation replaced:
  - `asm = round(muscleArmL + muscleArmR + muscleLegL + muscleLegR, 1)`
  - `smi = round(asm / (height/100)², 2)` — grounded per AWGS 2019.
- Both stored in `values.asm` and `values.smi`.

### `src/components/health/TanitaRecord.tsx`

- New live preview block on the ASM screen:
  - 「四肢肌肉量合計（ASM）：X.X 公斤」 when 4 limbs are present.
  - 「推算肌少症指數（SMI）：X.XX kg/m²」 when ASM + height present.
- Existing BMI preview on the 身高與 BMI screen preserved.

### `src/routes/summary.tsx`

- M39 caveat 「⋯與部分 TANITA 儀器所顯示的 SMI 讀數⋯可能略有差異」
  removed.
- Replaced with grounded source line:
  「SMI 由四肢骨骼肌質量（ASM＝雙臂＋雙腿肌肉量）÷ 身高平方推算，
  對應 AWGS 2019 標準」

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ limb muscle measurements, not age/gender |
| L23 NORTHSTAR (trustworthy) | ✓ SMI formula now matches AWGS threshold source |
| L34 USER JOURNEY 3 | ✓ new screen extraction supported |
| L48 local-only | ✓ no envelope bump |
| L50 wire | ✓ 4 keys stored locally; only `values.smi` reaches AI (byte-identical) |
| **L51 grading + Exception + "never extrapolates"** | ✓ **restored** — grounded SMI matches its threshold source |
| L52 grounded AI | ✓ REFERENCE_LEAFLET / TIPS_REFERENCE unchanged |
| L55 繁中 | ✓ all new labels 繁中 |
| L57 Japanese-minimalist + 50+ | ✓ one more standard screen |

## Old entries

- Pre-M39 entries with raw `smi`: retained; interpretCard reads by key.
- M39-window entries (short-lived) with wrong derived smi: retained
  in storage; self-correct on re-record.
- No migration.

## Design decisions

1. Trunk muscle NOT added — AWGS ASM excludes trunk.
2. Segmental fat NOT re-added — not needed for grounded output.
3. ASM stored alongside SMI for CSV / history / summary display.
4. Screen slotted right after `muscle` — natural grouping.
5. Prompt uses device labels (L ARM etc.) to guide Gemini reading
   the segmental-muscle screenshot.
6. M39 caveat removed — misleading now that formula is correct.

## Risks + fixes

| Risk | Fix |
|---|---|
| Some TANITA models don't show segmental muscle | User's MC-780MA does; add-optional handled if a future user needs it |
| User confused by 「no trunk?」 | Screen description explicitly says ASM = arms + legs |
| Extraction accuracy on 5 numbers in one shot | Same class as existing multi-screen extractions; digits clear |
| Field count 11→15 gates save | Consistent with M32 posture; teal button honestly signals readiness |
| CSV finding #1 from M39 review (bmi/smi/asm not in mod.fields) | Still open, becomes M41 |

## Files to touch

1. `src/lib/health/modules.ts`
2. `src/lib/health/ai.functions.ts`
3. `src/components/health/useRecordState.ts`
4. `src/components/health/TanitaRecord.tsx`
5. `src/routes/summary.tsx`
6. `plan/43-m40-asm-grounded-smi.md` (this)
7. `Product_Roadmap.md`
8. `CHANGELOG.md`
9. `adr/0025-static-reference-vs-ai-advice.md`

## Non-goals

No trunk field; no segmental-fat re-introduction; no CSV fix; no
storage migration; no PRD change.

## Acceptance

1. `bunx tsc --noEmit` clean; `bun run build` clean.
2. `/tanita` shows 7 screens; the new 「3. 四肢肌肉量」 sits between muscle and water.
3. Camera on ASM screen extracts 4 limb muscle values from a TANITA segmental photo.
4. muscleArmL=1.5, muscleArmR=1.5, muscleLegL=7.5, muscleLegR=7.5, height=170 → ASM = 18.0 kg; SMI = 6.23 kg/m² (below 男 <7.0 → matrix ★ in 男 「肌肉質量不足」 cell, matching AWGS).
5. Summary SMI card: M38 caption + matrix + ★ + new AWGS source line. No M39 caveat.
6. BMI derivation unchanged.
7. Other 5 Tanita screens unchanged.
