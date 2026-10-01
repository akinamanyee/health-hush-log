# M43 — BMR card: reader guide so users know what their delta means

**Status:** approved 2026-10-01

## Origin

User testing on `/summary` (iPhone Safari screenshot 2026-10-01). The
基礎代謝率 self-lookup card renders `你的-380` / `你的-180` / `你的+60`
under each 性別×年齡 reference value, but the user has no way to tell
whether their landed delta represents a healthy, neutral, or
concerning state.

Root cause: TANITA publishes BMR as **point reference values**, not
tier bands. Five of six self-lookup cards (體脂率 / 體內水分 /
肌少症指數 / 手握力 / 坐地前伸) communicate position through built-in
tier labels. BMR is the only self-lookup card whose source doesn't
publish tier labels.

## Fix

Single file touched: `src/routes/summary.tsx` — `BmrReferenceTable`
and `BmrStandardTable` only.

**A. Delta rendering (`BmrReferenceTable`).** Each cell's user-delta
line changes from `你的-380` to `你的 ↓ 380 kcal` / `你的 ↑ 60 kcal` /
`你的 持平`. Direction arrow + unit, with explicit 持平 for exact
reference-value match. Arrows alone don't classify — they make
direction immediately visible before the user reads the guide below.

**B. Reader guide (`BmrStandardTable`).** New bordered sub-section
inserted between the existing 「你的 X kcal⋯」 line and the source
footer, rendered only when `userValue !== undefined`:

- Headline: 【如何理解你的差距】
- Lead sentence: 「基礎代謝率反映身體在完全靜止時維持生命所需的
  最低熱量，主要與肌肉量相關。」
- Three bullets:
  - 讀數接近或略高於同性別年齡參考值 → 肌肉量充足；維持現狀。
  - 讀數明顯低於參考值 → 肌肉量偏低；配合阻力運動（掌上壓/提舉重物/
    行樓梯）+ 均衡蛋白質（魚/蛋/豆類）。
  - BMR 本身沒有「越高越好」，須配合體脂率、肌肉量、腰圍整體評估。

Qualitative framing only — no invented kcal threshold.

**C. Source-line amendment.** Footer gains explicit provenance for the
guide: 「資料來源：TANITA⋯的參考值；上述方向性解讀整合 TANITA
基礎代謝率解讀原則與衞生署〈能量代謝與肌肉量〉的常識性說明⋯」.

## PRD alignment (item-by-item)

| PRD | Verdict |
|---|---|
| L13 anonymous | ✓ no gender/age collected; user picks own column |
| L48 local-only | ✓ UI only |
| L50 wire | ✓ shape byte-identical |
| L51 deterministic + Exception | ✓ app does not classify; teaches user to classify themselves |
| L52 grounded AI | ✓ AI prompt untouched; guide is static reference |
| L55 繁中 | ✓ |
| L57 50+ friendly minimalist | ✓ bordered sub-section + bullets + mint/navy/teal |

## Verification

- `bunx tsc --noEmit` clean ✓
- `bun run build` clean ✓
- Reader-code review: guide block gated by `userValue !== undefined`
  (same conditional as existing delta line); no fallthrough to empty state.
- `SENSITIVE_LABEL_PATTERN` check on new copy: contains 男性/女性
  (metric labels, not group filters) — not in the pattern
  `/男士|女士|長者|學生/`. Safe.
- Inline JSX comment near the guide block cites ADR 0025 so a future
  grep for 男性 doesn't accidentally delete legitimate metric labels.

## Risks + fixes

| Risk | Fix |
|---|---|
| Guide reads as medical advice | Phrased as 「一般反映⋯」/「可配合⋯」, never 「你應該⋯」; global 「不能取代醫生診斷」 footer still visible. |
| User asks for a numeric threshold on 「明顯低於」 | Deliberately qualitative; TANITA doesn't publish one. Picking one would need a named source. |
| 「越高越好」 bullet surprises readers | Intended — pre-empts common misreading. |
| Card height on small iPhone screens | Guide inside existing `<details>` disclosure; folded by default. |
| Future contributor removes 男性/女性 under misapprehension | Inline comment cites ADR 0025 explicitly. |
| ↑/↓ mistaken for sort indicators | Context (inside each delta cell adjacent to kcal) makes direction reading natural. |

## Files touched

1. `src/routes/summary.tsx` — `BmrReferenceTable` (delta arrow + unit);
   `BmrStandardTable` (reader guide block + source-line amendment).
2. `plan/47-m43-bmr-reader-guide.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`

## Non-goals

- Not touching the other 5 self-lookup cards — their tier labels
  already carry interpretation.
- No numeric band ("差距超過 X kcal 屬偏低") — would invent.
- No AI-generated per-user interpretation — static reference does the job.
- No change to `/tanita` record page — guide belongs where the user
  first MEETS the number in interpretive context.
- No new ADR — operates squarely within ADR 0025.

## Acceptance

1. `bunx tsc --noEmit` clean ✓; `bun run build` clean ✓.
2. Deployed `/summary` with a BMR reading → each cell shows arrow + kcal;
   reader-guide block appears between deltas and source line. **[Awaits deploy + user test.]**
3. BMR card absent for records without BMR; other 5 self-lookup cards
   byte-identical. **[Static review confirms.]**
4. User's reported symptom resolved: looking at the card, the reader
   can tell what their delta means and what to do next.
