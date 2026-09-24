# M25 — 體脂率讀數視覺定位 + 修正 AI 指路字串

**Status:** approved 2026-09-24 · builds on M24

## Goal

Two things, both tiny, both under the 體脂率 summary card:

1. **User-value overlay on the TANITA chart.** Each of the 30 cells in
   the TANITA 5-tier × 3-age × 2-gender static table gains a highlight
   (background tint + ★ marker) when the user's latest recorded 體脂率
   reading falls within that cell's range. The user then eyeballs the
   column matching their own gender + age and reads their tier from
   the marked cell. **The app never asks for gender or age — the marker
   just shows "your reading falls here in each column"; the user
   self-identifies which column applies.**

2. **AI pointer wording fix.** The leaflet + the 體脂率 tip no longer
   name a specific agency for the table below the card — the pointer
   becomes source-neutral («卡片下方之對照表»). The AI stops telling
   users to look for a 醫管局 table that isn't there.

## Non-goals

- Any user input mechanism (dropdowns, form fields, prompts). Zero
  interactivity beyond `<details>` disclosure.
- `gradeEntry` / `interpretCard` changes. Grade badge stays 「無適用
  參考標準」 (PRD L51 preserved).
- Storage schema, wire payload, CSV — all untouched.
- `Agency` union, sensitive-word filter, `allowedNumbers`, ADR 0019 /
  0023 / 0024 / 0025 principles — all untouched.
- Personalized AI card interpretation. AI still writes source-neutral
  text and does not classify.

## PRD alignment

| PRD clause | Compliant? | Note |
|---|---|---|
| No gender/age collected (L13, L50) | Yes | Highlight uses only the body-fat value the app already stores; no demographic input. |
| Only photo + graded readings leave device (L50) | Yes | Client-side JSX only. Zero server-side change. |
| 「無適用參考標準」 for uncovered charts (L51) | Yes | Grade badge unchanged. Highlight is a visual reference aid, not a classification. |
| Traditional Chinese, 50+ friendly | Yes | Highlight helps 50+ readers find their row without scanning 30 cells. |

## File changes

### `src/routes/summary.tsx`

- Add helper `parseBodyFatValue(display: string): number | undefined` —
  extracts the first numeric token from a display string like `"25%"`.
- Add helper `matchesCell(value: number, cellDisplay: string): boolean` —
  parses the cell's display string (`"<10%"`, `"10-20%"`, `"≥28%"`) into
  a predicate. Integer-inclusive bounds; boundary values 向下取
  (a reading of 20 matches `"10-20%"` not `"21-23%"`).
- `BodyFatMatrixTable` gains a `userValue?: number` prop. Cells whose
  range contains `userValue` render with `bg-primary/10 font-semibold
  text-foreground` and append a `★` marker.
- `BodyFatStandardTable` gains a `userValue?: number` prop; passes it
  down to both matrix tables.
- Add a legend line rendered only when `userValue` is defined:
  「★ = 你的 X% 落此區間。請於男/女表中找你性別及年齡對應之欄，欄中★格
  即為你的參考分級。」
- Call site (line 324): `<BodyFatStandardTable userValue={parseBodyFatValue(match.value)} />`.

### `src/lib/health/charts.ts`

- Line 64 (REFERENCE_LEAFLET body-fat sentence): drop 「醫管局公開的」 —
  「本應用程式在體脂率卡片下方展示**標準脂肪量對照表**供用家自行對照」.
- Line 147 (TIPS_REFERENCE 體脂率參考標準 tip): 「醫管局及世衞太平洋建議
  提供性別和年齡分組的參考範圍」 kept (this is a factual attribution of a
  recommendation, not a pointer). 「宜對照醫管局提供的對照表」 → 「宜對照
  卡片下方之對照表」.
- `sources` array on the tip: **kept** — the article remains the ground
  for the abstract principle; only the in-text pointer is neutralized.
- `Agency` union: **unchanged**.

## Design decisions

1. **Highlight visual**: `bg-primary/10` background + `text-foreground
   font-semibold` + `★` after the range text. Subtle enough to keep the
   table readable, distinctive enough to spot at a glance.
2. **Boundary rule**: value ≤ hi wins (向下取). So a reading of exactly
   20% highlights the 「10-20%」 (標準健康型) cell, not 「21-23%」
   (標準警戒型). Matches TANITA's own convention where the integer
   upper bound belongs to the lower tier.
3. **Non-integer values**: `parseFloat` retains decimals. A reading of
   20.5% falls in neither `10-20` nor `21-23` under integer bounds —
   fine, no cell highlights that column. Rare in practice (TANITA
   scales display integer %); the legend still helps the user read
   nearby cells.
4. **No reading yet**: `parseBodyFatValue` returns undefined → table
   renders exactly as M24 (no highlights, no legend). Graceful fallback.
5. **Two tables both highlight**: 6 cells lit total (one per age
   bucket × gender). User picks their own column visually.
6. **Numbers stay in JSX only** (ADR 0025 consequence preserved). The
   AI still cannot cite these ranges.

## Risks & already-decided fixes

| Risk | Fix |
|---|---|
| Highlight color clashes in dark mode | Use `bg-primary/10` (Tailwind opacity modifier respects both themes) rather than hard-coded hex. |
| Cell text loses contrast when highlighted | `text-foreground font-semibold` instead of `text-muted-foreground`. |
| Non-integer reading falls in a gap between tiers | Accept; no cell highlights that column. The legend still points user to their nearest cells. |
| User has never recorded 體脂率 | `match.value` is undefined → prop undefined → table renders like M24. |
| A future contributor rewrites the range display strings | Range-parser regex covers `<N%`, `≥N%`, `N-M%`. Any other format returns a predicate that never matches. Fails safe (no highlight rather than wrong highlight). |
| Peer-review blocker (M24) not yet fixed | This milestone fixes the two pointer strings in `charts.ts`. |

## Acceptance

1. `tsc --noEmit` clean.
2. `bun run build` clean.
3. Manual: `/summary` on a device with a recorded 體脂率 of e.g. 25% →
   body-fat card → expand disclosure → both matrix tables render →
   6 cells highlighted (one per column) with ★ marker → legend
   line reads 「★ = 你的 25% 落此區間…」.
4. Grade badge on the card still shows 「無適用參考標準」.
5. AI-generated tip mentioning the table now says «宜對照卡片下方之對照表» — no 醫管局 mismatch.
6. Delete all 體脂率 records → same disclosure renders M24-style (no highlights, no legend).
