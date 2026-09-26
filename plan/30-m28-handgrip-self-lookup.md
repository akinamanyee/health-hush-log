# M28 — 手握力 self-lookup card (職安局 5-tier × 5-age × 2-gender)

**Status:** approved 2026-09-26 · builds on M25/M26/M27

## Goal

The 手握力 summary card gains an in-app self-lookup reference table from
職安局 (Occupational Safety and Health Council) — 5 tiers (欠佳 / 尚可 /
常 / 良好 / 優異) × 5 age bands (20-29, 30-39, 40-49, 50-59, 60-69) × 2
genders (男/女), with a ★ overlay on cells matching the user's recorded
L+R combined grip value. Same M25/M27 pattern extended to a 5th card.

## What we build (every piece)

1. Classifier utility `classifyHandGrip(age, gender, combinedKg)` in a new
   file — the utility you explicitly asked for.
2. Full 職安局 matrix encoded verbatim from your JSON.
3. `<details>` disclosure under the 手握力 summary card with 男 + 女 tables
   (5 rows × 5 cols each), ★ overlay via `matchesCell` on the user's value.
4. Record-form field label 「手握力」 → 「手握力（左右合計）」 so users
   know to enter combined L+R.
5. AI extraction prompt hint updated with L+R clarification.
6. Wire-payload sanitize: 「手握力」 joins `SELF_LOOKUP_CARD_NAMES` (M27
   pattern) so Gemini sees `"請自行對照下方對照表"` instead of
   `"無適用參考標準"`.
7. Badge omission: 「手握力」 joins `CARDS_WITH_SELF_LOOKUP` (M26 Exception).
8. Leaflet 【手握力參考】 gains source-neutral pointer sentence to the new
   table. No 職安局 numbers enter `REFERENCE_LEAFLET`.
9. Card `action` string in `grade.ts` updated to point at the table.
10. Footer notes: 「數值為左右手合計 (kg)」, 「本表涵蓋 20-69 歲，70 歲以上
    請以 60-69 歲欄作參考並諮詢醫生」, 「資料來源：職業安全健康局
    （職安局）」.
11. `matchesCell` regex gains a `≤` branch so cell strings like `"≤61 kg"`
    (poor-tier lower bound) participate in the ★ overlay.

## Non-goals

- 坐地前伸 (sit-reach) — separate future milestone (M29 candidate).
- Age input widget / dropdown — user visually picks row (M25/M27 pattern).
- New agency in `Agency` union — 職安局 already present.
- Storage schema bump — envelope stays v1; `grip` field key + numeric
  shape unchanged.
- New AI grounding numbers — 職安局 kg values stay in JSX only.

## PRD alignment (item by item)

| PRD | Check |
|---|---|
| L13/L50 no age/gender collected | ✓ Static matrix; user visually picks row |
| L51 grade + M26 Exception | ✓ 手握力 joins Exception list; badge omitted; `gradeEntry` still returns `"無適用參考標準"` at SSOT layer |
| L52 grounded AI advice | ✓ No new numbers in leaflet or tips text |
| ADR 0019 government source | ✓ 職安局 already in `Agency` union |
| ADR 0024 sensitive-word filter | ✓ New leaflet content contains none of 男士/女士/長者/學生 |
| ADR 0025 numbers-in-JSX-only | ✓ 職安局 values live in `handgrip.ts` + `summary.tsx` only |
| Traditional Chinese | ✓ All labels 繁中 |

## File changes

- **NEW** `src/lib/health/handgrip.ts` — matrix + classifier + boundary
  helpers. Header comment: runtime callers = none (ADR 0025); function
  kept for future PRD-authorised paths or build-time tests.
- `src/lib/health/modules.ts` — grip field label to 「手握力（左右合計）」.
- `src/lib/health/ai.functions.ts` — extraction hint + `SELF_LOOKUP_CARD_NAMES`
  gains `"手握力"`.
- `src/lib/health/grade.ts` — grip card's `action` string updated.
- `src/lib/health/charts.ts` — 【手握力參考】 sentence appends pointer.
- `src/routes/summary.tsx` — `matchesCell` `≤` branch; `HAND_GRIP_MALE` /
  `HAND_GRIP_FEMALE` display matrices; `HandGripMatrixTable` +
  `HandGripStandardTable` components; `parseHandGripValue` alias; render
  gate; `CARDS_WITH_SELF_LOOKUP` gains `"手握力"`.
- `PRD.md` L51 — Exception list extended.
- `adr/0025-static-reference-vs-ai-advice.md` — Source change history:
  M28 entry.
- `Product_Roadmap.md` — M28 entry.
- `CHANGELOG.md` — M28 delivery entry.

## Design decisions

1. **Classifier ships but no runtime caller** — ADR 0025. Documented in
   file header. You explicitly asked for the function; kept.
2. **Cell display format**: 欠佳 `"≤N kg"`, 尚可/常/良好 `"lo-hi kg"`,
   優異 `"≥N kg"`. `matchesCell` handles all three via existing regex
   plus new `≤` branch.
3. **L+R clarification** appears in record-form label, AI prompt hint,
   static-table caption, and footer sentence. Users see it at every
   entry point.
4. **≥70 users** — no matching row → no ★. Footer explicitly notes to
   use 60-69 column and consult a doctor.
5. **Old records with single-hand values** — will land in 欠佳 against
   L+R norms; footer + CHANGELOG document the L+R expectation so users
   can re-record. Old numeric values remain valid and exportable
   (no data loss).
6. **`HAND_GRIP_NORMS` lives in `handgrip.ts`** — keeps `charts.ts`
   focused on AI-grounded material; UI-only reference data isolated.

## Risks + already-decided fixes

| Risk | Fix |
|---|---|
| Old single-hand records misclassified | Label + caption + footer + CHANGELOG surface the L+R expectation; users can re-record. Nothing dropped. |
| ≥70 users | Footer notes 60-69 as reference + doctor consult. |
| CSV column header renamed | External tools do not consume our CSV per PRD; user-download only. Acceptable. |
| `matchesCell` `≤` branch may break existing tables | Additive alternative; no existing TANITA/water/SMI cell uses `≤`. Regression tests re-run. |
| Two mirrored Sets grow to 5 members each | Pre-existing 🟡 SSOT-drift risk (documented in M27 peer review); not blocking today. |
| Wire cap 12 (M27a) still enough? | 手握力 already produces 1 card; count unchanged (max 9). |
| Handgrip matrix is 5×5 (wider than TANITA 5×3) — could overflow narrow phones | Reuse `overflow-x-auto` wrapper already on matrix tables; short cell strings (`"62-69 kg"` = 8 chars) fit. |

## No storage migration
- Envelope stays v1
- Field key `grip` unchanged
- Numeric shape unchanged
- Old records read as before

## Acceptance

1. `bunx tsc --noEmit` clean.
2. `bun run build` clean.
3. Node unit test `classifyHandGrip` boundary cases — pass.
4. Node regression test `matchesCell` for M25 body-fat + M27 water + SMI — pass.
5. Phone `/summary` on a device with grip recorded:
   - Card has no badge (M26 Exception).
   - `<details>` 「查看標準參考表（職安局）」 opens.
   - 男 + 女 tables render 5×5 each.
   - ★ in each row's tier containing user's value.
   - Footer: L+R clarification + 70+ note + 「資料來源：職安局」.
6. Record form label reads 「手握力（左右合計）」.
7. AI-generated grip prose no longer echoes 「無適用參考標準」.
