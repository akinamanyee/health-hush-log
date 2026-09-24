# M27 — TANITA reference completion: BMR + 體內水分 + SMI

**Status:** approved 2026-09-24 · builds on M25/M26

## Goal

Complete the TANITA reference pattern for the three remaining metrics that
lack in-app self-lookup tables: 基礎代謝率 (BMR), 體內水分 (body water %),
and 肌少症指數 (SMI, 骨骼肌指數). SMI is a new field entirely — it joins
the Tanita record flow as an optional metric extractable from the muscle
screen. All three cards follow the M25 value-overlay + M26 badge-omission
pattern.

## Non-goals

- New AI grounding numbers in `REFERENCE_LEAFLET` (TANITA specifics stay
  in JSX only — ADR 0025 preserved).
- New tips topics in `TIPS_REFERENCE` (out of scope for a reference-
  completion milestone).
- Grip / sit-reach reference tables (different sources, separate future).
- Changing existing card badges beyond adding the 3 new cards to the
  M26 Exception list.
- Storage schema version bump (envelope stays `{v:1}` — SMI reads as
  undefined on old records, gracefully absent).

## File changes

**`src/lib/health/modules.ts`** — one new field, one screen update:
- `smi` field: `{ key: "smi", label: "肌少症指數（SMI）", unit: "kg/m²", min: 3, max: 12, step: "0.01", optional: true, group: "肌肉" }`
- Add `"smi"` to the `muscle` screen's `fields` array.

**`src/lib/health/ai.functions.ts`**:
- `TANITA_SCHEMA` gains `smi: z.number().nullable()`.
- Add wire-payload sanitize before `cardsText` is built: for cards whose
  name is in `SELF_LOOKUP_CARD_NAMES = new Set(["體脂率", "基礎代謝率", "體內水分", "肌少症指數"])`,
  transform `grade` → `"請自行對照下方對照表"` and clear `note`. Preserves
  local `CardInterpretation` (SSOT) — only the transient wire representation
  is sanitized.

**`src/lib/health/grade.ts`** — add 3 new card producers in `case "tanita":`
after visceral fat, each following body-fat's shape:
- 基礎代謝率: value `${bmrKcal.toLocaleString()} kcal`
- 體內水分: value `${bodyWaterPct}%`
- 肌少症指數: value `${smi} kg/m²` (only if `smi != null`)
All three set `grade: "無適用參考標準"`, `tone: "neutral"`, range
`"需要年齡及性別才能對照標準"`, action `"請對照下方 TANITA 參考表自行對照"`.

**`src/routes/summary.tsx`**:
- Promote to `const CARDS_WITH_SELF_LOOKUP = new Set(["體脂率", "基礎代謝率", "體內水分", "肌少症指數"])`.
- Replace the M26 badge gate: `{!CARDS_WITH_SELF_LOOKUP.has(card.name) && <GradeBadge ...>}`.
- New constants:
  - `BMR_MALE`, `BMR_FEMALE`: 4 age buckets × kcal reference value each.
  - `WATER_MALE`, `WATER_FEMALE`: 2 tiers (適當 / 偏低) with threshold text.
  - `SMI_THRESHOLDS`: `{ 男: 7.0, 女: 5.7 }` kg/m².
- New components:
  - `BmrStandardTable({ userValue })` — 男/女 tables of 4 age×kcal reference
    values with per-cell delta line 「你的 X kcal 較此參考值 (+Y kcal 或 -Y kcal)」
    when userValue defined. No `matchesCell` overlay (BMR is point-value not tier).
  - `WaterStandardTable({ userValue })` — 男/女 2-tier tables reusing
    `matchesCell` + ★ (existing helper handles `≥N%` and `<N%` cell formats).
  - `SmiStandardTable({ userValue })` — 男/女 2-tier tables reusing
    `matchesCell` + ★.
- New helpers:
  - `parseKcalValue(display)`: strips 「 kcal」 and commas, returns number.
  - `parseWaterPercentValue(display)`: reuses body-fat parser semantics.
  - `parseSmiValue(display)`: strips 「 kg/m²」, returns number.
- New render gates:
  - `{card.name === "基礎代謝率" && <BmrStandardTable userValue={parseKcalValue(match?.value)} />}`
  - `{card.name === "體內水分" && <WaterStandardTable userValue={parseWaterPercentValue(match?.value)} />}`
  - `{card.name === "肌少症指數" && <SmiStandardTable userValue={parseSmiValue(match?.value)} />}`

**`src/lib/health/charts.ts`**:
- 【身體水分參考】 sentence appends 「本應用程式在體內水分卡片下方展示標準參考供用家自行對照。」
- 【基礎代謝率參考】 sentence appends 「本應用程式在基礎代謝率卡片下方展示 TANITA 參考值供用家自行對照。」
- New 【肌少症指數參考】 block: 「肌少症指數（SMI）由 TANITA 身體組成分析儀量度，反映骨骼肌質量相對身高的比例。本應用程式在卡片下方展示標準參考供用家自行對照。」
- No specific numbers enter leaflet.

**`PRD.md` L51** — Exception clause list: 「currently 體脂率, 基礎代謝率, 體內水分, 肌少症指數」.

**`adr/0025-static-reference-vs-ai-advice.md`** — Source change history: M27
entry recording extension to BMR + water + SMI and the wire-payload sanitize.

**`Product_Roadmap.md`** — M27 entry.

**`CHANGELOG.md`** — M27 delivery entry.

## Design decisions (disclosed)

1. **BMR shows reference points, not tier ranges.** TANITA publishes single
   kcal values per age×gender, not ranges. Per-cell delta rather than ★ overlay
   is the honest representation.
2. **Wire sanitize bundled**: with 4 self-lookup cards, 「無適用參考標準」 in
   the AI prompt 4× makes echo likely; sanitize once.
3. **Predicate refactor now**: 3+ callers of the "self-lookup card" concept
   (badge gate, table render gates, wire sanitize) — promote to a Set.
4. **SMI screen placement**: `muscle` screen (TANITA typically shows SMI
   alongside muscle mass on the muscle screen).
5. **CSV**: SMI joins as new column at end; old records show empty for it.
   No migration.
6. **Card names**: 「基礎代謝率」, 「體內水分」, 「肌少症指數」 — matches
   existing 中文 conventions in `interpretCard`.
7. **Storage envelope stays v1**: SMI is nullable, undefined reads gracefully.

## Data (structure locked; exact values from user's TANITA sheet at code time)

- BMR ~ male 18-29: 1550, 30-49: 1500, 50-69: 1350, ≥70: 1220; female
  18-29: 1210, 30-49: 1170, 50-69: 1110, ≥70: 1010.
- Water: 男 ≥55% 適當 / <55% 偏低; 女 ≥50% 適當 / <50% 偏低.
- SMI: 男 ≥7.0 kg/m² 正常 / <7.0 肌少症風險; 女 ≥5.7 正常 / <5.7 風險.

## Acceptance

1. `bunx tsc --noEmit` clean.
2. `bun run build` clean.
3. On `/summary` (phone), for a user with BMR / water / SMI recorded:
   - Body-fat card unchanged from M26.
   - BMR card: value kcal, date, AI prose, TANITA 8-cell reference disclosure
     with per-cell delta, no badge.
   - 體內水分 card: value %, date, AI prose, 男/女 2-tier disclosure with ★
     overlay, no badge.
   - 肌少症指數 card: value kg/m², date, AI prose, 男/女 2-tier disclosure
     with ★ overlay, no badge.
   - Other cards: unchanged badges.
4. SMI recordable via Tanita muscle-screen photo extraction and manual entry.
5. CSV export includes `smi` column (blank for old records).
6. Wire-payload sanitize confirmed: server-side `cardsText` for self-lookup
   cards shows 「請自行對照下方對照表」 instead of 「無適用參考標準」.
