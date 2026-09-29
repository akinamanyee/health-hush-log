# M41 — Dynamic card-name whitelist in summary prompt

**Status:** approved 2026-09-29

## Goal

Fix the 「摘要未通過內容核對（卡片解讀未對應項目名稱），已停止顯示」
red banner on `/summary`. Root cause: the base prompt at
`ai.functions.ts:270` hardcoded 6 card names from the M21 era
(「血壓」、「BMI」、「體脂率」、「內臟脂肪」、「手握力」、「坐地前伸」
六者其一) but M27/M28/M29 added 3 more Tanita cards to
`interpretCard`'s output. When a full Tanita record (now unblocked
by M40's grounded SMI derivation) produced 6 Tanita cards + BP,
Gemini obeyed the whitelist and refused to emit `name` for the 3
non-listed cards → `parseOutput` filtered them → grounding-failure
toast.

## What we build

**File:** `src/lib/health/ai.functions.ts` — single prompt-string
change. Build `cardNameList` from `Array.from(validCardNames)` (the
same Set already computed at line 265 that `parseOutput` filters on)
and interpolate into the base-prompt whitelist sentence, replacing
the hardcoded 6-name list with a dynamic list that stays in sync
with whatever `data.cards` actually contains.

Before: `照抄「血壓」、「BMI」、「體脂率」、「內臟脂肪」、「手握力」、「坐地前伸」六者其一`
After: `照抄以下之一：${cardNameList}` — 「照抄以下之一：」 has no
count word to go stale; the list is data-derived.

Both retries (parse-retry, grounding-retry) inherit via basePrompt
interpolation.

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ prompt content only |
| L23 NORTHSTAR (trustworthy) | ✓ restores summary generation |
| L48 local-only | ✓ no storage change |
| L50 wire | ✓ card shape byte-identical |
| L51 grading + Exception | ✓ SELF_LOOKUP_CARD_NAMES wire sanitize unchanged |
| L52 grounded AI | ✓ **directly served** — grounding check `output.cards.length === expectedCardCount` now achievable for all card shapes |
| L55 繁中 | ✓ 繁中 sentence pattern preserved |

## Design decisions

1. Reuse the `validCardNames` set already at line 265 — same authority as `parseOutput` filter; can never drift.
2. `Array.from(Set)` preserves insertion order from `data.cards`; prompt list matches sent order.
3. 「照抄以下之一：」 replaces 「照抄⋯六者其一」 — no count word to ossify.
4. Keep the whitelist sentence — redundant with `cardsText`, but redundancy is why the grounding check works. Belt-and-braces.
5. No change to grounding-check logic (`richGroundingFailure`) — the check was correct; the prompt was misleading the AI.

## Risks + fixes

| Risk | Fix |
|---|---|
| Card name with delimiter chars 「」、 | All card names are static constants in interpretCard; none contain delimiters. |
| Empty validCardNames | `summary.tsx:690` blocks generation with `allCards.length === 0` before reaching server. |
| Very long list | 12 cards × ~5 chars = ~60 chars — negligible. |
| Retry cascade | Both retries append to basePrompt; dynamic list flows through. |

## Files to touch

1. `src/lib/health/ai.functions.ts`
2. `plan/44-m41-dynamic-card-name-whitelist.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`

## Non-goals

No storage / wire / JSON-shape / grounding-check / retry-structure
change. No new ADR. No PRD change.

## Acceptance

1. `bunx tsc --noEmit` clean; `bun run build` clean.
2. Deployed: `/summary` with full Tanita + BP (7+ cards) → 生成健康摘要 succeeds; no 「卡片解讀未對應項目名稱」 toast.
3. M34 timing logs show `[generateRichSummary] total Nms cards=7` (or larger).
4. Each card renders name / value / grade badge / date / interpretation (M21 invariant).
5. BP-only summary still works (prompt reads 「照抄以下之一：「血壓」」).
6. Partial-Tanita entry (e.g. BMI + 體脂率 only) still works — whitelist shrinks to 2 names.
