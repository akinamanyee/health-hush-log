# M24 — TANITA 標準脂肪量對照表：對齊使用者手上磅的分級

**Status:** approved 2026-09-24 · builds on M23

## Goal

Replace the static 標準脂肪量 table under the 體脂率 summary card. The
source moves from HA (醫管局 2-tier ×2-age table) to TANITA
`身體組成數據參考指標` (5-tier ×3-age ×gender table) so what the
user sees on their own Tanita scale ("消瘦 / 標準健康型 / 標準警戒型 /
微胖 / 肥胖") maps directly onto a cell in the app's reference table.

## Non-goals — untouched by this milestone

- `TIPS_REFERENCE`「體脂率參考標準」 (HA article) — remains the AI
  grounding source; `selectRelevantTips` mapping unchanged.
- `REFERENCE_LEAFLET` body-fat sentence — unchanged.
- `Agency` union in `charts.ts` — unchanged.
- `SENSITIVE_LABEL_PATTERN`, `allowedNumbers`, `richGroundingFailure` —
  unchanged; the pattern still applies to AI output only per ADR 0025.
- `gradeEntry()` / `interpretCard()` — `體脂率` still resolves to
  「無適用參考標準」; static table is reference only.
- Storage, CSV export, logbook display — untouched (table data lives
  in `summary.tsx` and never enters state).
- Other cards (BMI, 內臟脂肪, BMR, 體內水分, blood pressure, gym) —
  no static tables added or removed.

## PRD alignment (item by item)

| PRD clause | Compliant? | Note |
|---|---|---|
| No gender/age collected (L13, L50) | Yes | Table is static reference; nothing is collected. |
| Only photo + readings-with-grades leave device (L50) | Yes | Table is client-side JSX; zero network. |
| 「無適用參考標準」 for uncovered charts, never extrapolate (L51) | Yes | Grade badge unchanged; table is user-facing pointer. |
| Traditional Chinese, 50+ friendly (throughout) | Yes | All labels 繁中; two small tables fit phone width. |
| 醫生免責聲明 on every screen (L56) | Yes | Existing disclaimer chrome untouched. |
| Grounded AI Advice (NORTHSTAR) | Yes | HA article retained in `TIPS_REFERENCE`; AI numbers still sourced from HA/gov. |

## Data (TANITA `身體組成數據參考指標`)

**Numbers below are the standard TANITA 5-tier reference widely published
alongside the 身體組成分析儀 product line. User to verify against their
specific pasted chart at review time; if any cell differs, correct
in `summary.tsx` — the structure below stays.**

### 男性 (%)

| 分級 | 18-39 歲 | 40-59 歲 | ≥60 歲 |
|---|---|---|---|
| 消瘦 | <10 | <11 | <13 |
| 標準健康型 | 10-20 | 11-21 | 13-24 |
| 標準警戒型 | 21-23 | 22-24 | 25-27 |
| 微胖 | 24-27 | 25-28 | 28-30 |
| 肥胖 | ≥28 | ≥29 | ≥31 |

### 女性 (%)

| 分級 | 18-39 歲 | 40-59 歲 | ≥60 歲 |
|---|---|---|---|
| 消瘦 | <20 | <21 | <22 |
| 標準健康型 | 20-27 | 21-28 | 22-29 |
| 標準警戒型 | 28-34 | 29-35 | 30-36 |
| 微胖 | 35-39 | 36-40 | 37-41 |
| 肥胖 | ≥40 | ≥41 | ≥42 |

## File changes

### `src/routes/summary.tsx`

- Delete constants: `BODY_FAT_STANDARD_ROWS`, `BODY_FAT_STANDARD_URL`.
- Add: `TANITA_AGE_BUCKETS`, `TANITA_TIERS`, `BODY_FAT_MALE`,
  `BODY_FAT_FEMALE` (typed matrices).
- Rewrite `BodyFatStandardTable()` to render two stacked tables
  (男性 then 女性), each 5 rows × 3 cols, inside the same
  `<details>` disclosure shell.
- `<summary>` text: 「查看標準脂肪量對照表（TANITA）」.
- Footer citation: `資料來源：TANITA〈身體組成數據參考指標〉。體脂率
  標準因性別及年齡而異，本應用程式因不收集性別及年齡而不進行分級，
  用家可對照上表自行參考。` (no external link — no stable public URL.)
- Update inline comment header: swap HA reference for TANITA; drop the
  「Athlete row deliberately omitted」 note (obsolete); keep the
  ADR 0025 / ADR 0024 pointers.

### `adr/0025-static-reference-vs-ai-advice.md`

- Append a **Source change history** section noting the 2026-09-24
  move from HA to TANITA for the static table, with rationale (scale
  alignment), and reaffirming that HA remains the AI-grounding source.
  Principle itself unchanged.

### `Product_Roadmap.md`

- Append M24 entry after M23, matching M20-M23 format.

### `CHANGELOG.md`

- Add M24 entry noting: static-only source swap; AI grounding
  untouched; no storage or grading changes.

## Design decisions (disclosed)

1. **Two tables (男性 / 女性), rows = 分級, cols = 年齡段.** Fits
   phone width without horizontal scroll; matches how a Tanita user
   thinks (they know their gender & age, then look up their %).
2. **No external link in footer.** TANITA's published reference sheet
   has no stable citable URL; a broken link would be worse than a
   plain text citation.
3. **`≥` U+2265** consistent with `REFERENCE_LEAFLET`'s existing
   convention (e.g. `≥15` for visceral fat).
4. **`<details>` shell reused verbatim** (rounded-xl border, muted
   bg, same padding) to keep visual continuity with the M23 version.
5. **Numbers live in `summary.tsx` JSX only**, never in
   `REFERENCE_LEAFLET` or `allowedNumbers` — prevents AI from
   echoing a gender-specific number without qualifier (ADR 0025
   consequence).

## Acceptance

1. `bun run typecheck` (or `tsc --noEmit`) — clean.
2. `bun run build` — clean.
3. Manual: `/summary` on phone → 體脂率 card → 「查看標準脂肪量
   對照表（TANITA）」 → both tables render, 5×3 cells each, footer
   cites TANITA (no link), disclaimer chrome intact.
4. `體脂率` AI-generated card still cites 「資料來源：醫管局」 (HA
   grounding preserved).
5. Dark mode borders + text tokens render correctly.
