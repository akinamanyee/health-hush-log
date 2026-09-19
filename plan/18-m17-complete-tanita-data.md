# M17 — 完整身體成份分析儀數據: every Tanita reading, one record

The Tanita module captures all 21 metrics the 身體組成分析儀 produces across its six display
screens (per the 護心計劃 PDF page 2), up from the current 5. Photo reading extracts whichever
screen is visible; multiple photos merge into one record. The 16 new fields are optional — a
record is valid with just the original 5.

## New fields (16, all optional)

| Group | Key | Label | Unit | Min | Max | Step |
|---|---|---|---|---|---|---|
| 體脂 | `fatMass` | 體脂量 | 公斤 | 0.1 | 200 | 0.1 |
| 肌肉 | `muscleRatio` | 肌肉比率 | % | 1 | 80 | 0.1 |
| 身體水分 | `bodyWaterPct` | 身體水分率 | % | 10 | 80 | 0.1 |
| 身體水分 | `bodyWaterKg` | 身體水分量 | 公斤 | 5 | 200 | 0.1 |
| 基礎代謝 | `bmrKcal` | 基礎代謝率 | kcal | 500 | 5000 | 1 |
| 基礎代謝 | `bmrKj` | 基礎代謝率 | kJ | 2000 | 21000 | 1 |
| 部位脂肪率 | `fatTrunk` | 軀幹脂肪率 | % | 1 | 70 | 0.1 |
| 部位脂肪率 | `fatArmR` | 右臂脂肪率 | % | 1 | 70 | 0.1 |
| 部位脂肪率 | `fatArmL` | 左臂脂肪率 | % | 1 | 70 | 0.1 |
| 部位脂肪率 | `fatLegR` | 右腿脂肪率 | % | 1 | 70 | 0.1 |
| 部位脂肪率 | `fatLegL` | 左腿脂肪率 | % | 1 | 70 | 0.1 |
| 部位肌肉量 | `muscleTrunk` | 軀幹肌肉量 | 公斤 | 1 | 60 | 0.1 |
| 部位肌肉量 | `muscleArmR` | 右臂肌肉量 | 公斤 | 0.1 | 15 | 0.1 |
| 部位肌肉量 | `muscleArmL` | 左臂肌肉量 | 公斤 | 0.1 | 15 | 0.1 |
| 部位肌肉量 | `muscleLegR` | 右腿肌肉量 | 公斤 | 0.5 | 30 | 0.1 |
| 部位肌肉量 | `muscleLegL` | 左腿肌肉量 | 公斤 | 0.5 | 30 | 0.1 |

## Files to change

### 1. `src/lib/health/modules.ts`

- Add `optional?: boolean` and `group?: string` to `FieldDef`.
- Append the 16 new fields to the Tanita module's `fields` array, each with `optional: true`
  and its group name.
- The existing 5 fields stay unchanged (required, ungrouped) at their original array positions.

### 2. `src/lib/health/ai.functions.ts`

- Expand `TANITA_SCHEMA` with the 16 new keys, all `z.number().nullable()`.
- Update `EXTRACTION_FIELDS.tanita` to list every field with its Chinese label.
- The prompt already says "讀不到的數值用 null" — fields not on the visible screen come back
  null. The existing merge behavior in RecordModule (`{ ...values }` spread) preserves
  previously filled values from earlier photos.

### 3. `src/lib/health/charts.ts`

- Add to `REFERENCE_LEAFLET`: body water context (adult body water is typically 45–65% of
  body weight; adequate hydration supports metabolism and organ function) and BMR context
  (basal metabolic rate indicates daily energy expenditure at rest; higher muscle mass
  generally corresponds to higher BMR). Sourced from Tanita manual reference text.
- No new grading functions — these metrics have no universal chart without age/gender.

### 4. `src/components/health/RecordModule.tsx`

- **Validation:** If `FieldDef.optional` is true and the value is empty, skip validation.
  Only non-optional fields trigger "請輸入數值".
- **Grouped rendering:** Fields with a `group` render under a Chinese heading with a thin
  separator between groups. The two segmental groups (部位脂肪率, 部位肌肉量) render inside
  native `<details>` elements, collapsed by default.
- **Trend chart:** Stays limited to `.slice(0, 3)` — no change.
- **History list:** Already iterates `mod.fields` and filters nulls — no change.

### 5. No changes to:

- `store.ts` — `Record<string, number>` accepts any keys; old records with 5 keys load fine.
- `grade.ts` — only checks bmi, bodyFat, visceralFat; new fields produce no grade.
- `csv.ts` — iterates `mod.fields` dynamically; new columns appear automatically.
- `voice.ts` — first 5 spoken numbers map to the original 5 fields at positions 0–4.

## Risk register

### Risk 1: 21 fields overwhelm a 50+ user

The 5 original fields appear first, ungrouped, exactly as today. The 6 new standalone metrics
appear under short Chinese headings with thin separators. The 10 segmental fields go inside
two collapsed `<details>` elements. A user who only wants the basics sees the same form as
before plus headings below.

### Risk 2: AI photo prompt length

The field list grows from 5 to 21 descriptions but each is short. Each Tanita screen shows
3–6 values; the AI returns those and nulls the rest. The merge in RecordModule preserves
earlier photo values — the user takes multiple photos and fields accumulate.

### Risk 3: Existing localStorage records missing new keys

No fix needed. `e.values[f.key]` returns `undefined` for missing keys. CSV skips undefined.
History display filters nulls. Grades only check the 3 known keys. Storage envelope version
stays at 1.

### Risk 4: Voice input field ordering

The 5 original fields keep positions 0–4. The 16 new fields are appended at 5–20. First 5
spoken numbers map to the same fields as before.

### Risk 5: Reference leaflet grounding check

Adding body-water and BMR text to `REFERENCE_LEAFLET` puts their reference numbers into the
`allowedNumbers` set. The grounding check passes for those numbers and still catches invented
ones. Check logic is untouched.

## Non-obvious call

The 16 new fields are optional rather than required. The PRD says "records a reading" — a
reading from one Tanita screen is a valid reading. Requiring all 21 would force the user to
photograph all 6 screens or type 21 values to save anything, which is unusable.
