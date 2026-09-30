# M42a — Hotfix: bucket must not fabricate 「全部正常」 when no graded cards were measured

**Status:** approved 2026-09-30

## Origin

Peer review of M42 (this session) Finding #1. `bucketByGrade` at
`ai.functions.ts:209` returned `"normal"` for two semantically
different states: (a) 血壓/BMI/內臟脂肪 all measured and all in-range,
and (b) none of the three measured at all (grip-only, sit-reach-only,
self-lookup-only Tanita session). In state (b), the AI received
「整體情況：三項可評級指標（血壓、BMI、內臟脂肪）全部落在正常範圍」
in its prompt as a factual claim — a fabrication that violates PRD L23
NORTHSTAR (trustworthy) and L52 (grounded AI).

## Fix

**`src/lib/health/ai.functions.ts::bucketByGrade`** — widen
`GradeBucket` union with `"no-graded"` and short-circuit when
`graded.length === 0` BEFORE the `off.length === 0` check (ordering
matters: without the early return, the empty case falls into normal
because `off.length === 0` is also trivially true).

**`src/lib/health/ai.functions.ts::basePrompt::bucketBlock`** — new
first branch of the ternary chain: describes the actual state
(「未包含血壓、BMI 或內臟脂肪等可評級指標，只有自查對照的項目」),
asks for 1–2 neutral daily reminders on what was actually recorded,
and explicitly bans conclusion words (「全部正常」/「全部達標」/
「有健康風險」) so the AI cannot echo the fabricated framing anyway.

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ prompt content only |
| **L23 NORTHSTAR trustworthy** | ✓ **directly served** — no more fabricated 「全部正常」 claim on grip-only / sit-reach-only / self-lookup-only sessions |
| L48 local-only | ✓ no storage change |
| L50 wire | ✓ shape byte-identical |
| L51 grading + Exception | ✓ self-lookup cards still opaque to bucket |
| **L52 grounded AI** | ✓ **directly served** — bucket text now describes only what data actually contains |
| L55 繁中 | ✓ 繁中 sentence pattern preserved |
| L57 minimal | ✓ ~7 lines net code |

## Design decisions

1. **`no-graded` must be first in both the helper's early return AND the ternary chain.** Both places must agree. Verified by simulation (below).
2. **Explicit ban on conclusion words in the branch text.** Belt-and-braces: even if the AI drifts, the prompt itself forbids the specific fabricated framing.
3. **No hard grounding gate for this.** A regex gate would need per-session module-recorded state that the wire doesn't carry. Enforced at prompt layer, same class as M42's ban on 「明天就做」 and 「參考對照表」.
4. **Do not touch `selectRelevantTips`.** Its topic-pool coverage for grip-only / sit-reach-only / self-lookup-only sessions is already handled by the 手握力/坐地前伸 branch and the empty-set fallback; `relevantTips` is never empty on these paths, so `expectTips` gate stays satisfied.
5. **Do not widen `richGroundingFailure`.** No new gate; the four existing gates (invented numbers, sensitive labels, missing 醫生 disclaimer, tip topic coverage, card name coverage) already correctly cover this branch.

## Verification

Standalone simulation of `bucketByGrade` across 8 scenarios (2026-09-30):

| Input | Expected | Actual |
|---|---|---|
| `[]` | `no-graded` | ✓ `no-graded` |
| `[手握力]` | `no-graded` | ✓ `no-graded` |
| `[體脂率, 基礎代謝率]` | `no-graded` | ✓ `no-graded` |
| `[血壓 正常]` | `normal` | ✓ `normal` |
| `[血壓 高血壓（第一期）]` | `few-off` | ✓ `few-off` |
| `[血壓 嚴重偏高]` | `many-or-crisis` | ✓ `many-or-crisis` |
| `[血壓 正常, BMI 正常, 內臟脂肪 正常]` | `normal` | ✓ `normal` |
| `[血壓 正常偏高, BMI 偏高, 內臟脂肪 偏高]` | `many-or-crisis` | ✓ `many-or-crisis` |

`bunx tsc --noEmit` clean; `bun run build` clean.

## Risks + fixes

| Risk | Fix |
|---|---|
| Ordering bug (normal branch catches empty first) | `no-graded` first in helper AND ternary chain; simulated. |
| AI ignores ban and writes 「全部正常」 anyway | Soft constraint at prompt layer; if observed, next milestone can add regex filter. |
| `relevantTips` empty on no-graded session | Impossible: 手握力 / 坐地前伸 branch always adds 日常運動 + 中等強度運動; self-lookup Tanita cards trigger 體脂率參考標準 or the empty-set fallback. |

## Files to touch

1. `src/lib/health/ai.functions.ts`
2. `plan/46-m42a-no-graded-bucket-hotfix.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`

## Non-goals

No storage / wire / JSON-shape / grounding-check-logic / retry-structure / UI / grader / photo-path / CSV / calendar change. No new ADR. No PRD change. Not touching M42's other three branches. Not touching M42 peer-review Findings #2 (duplicated grade strings) or #3 (plan doc drift).

## Acceptance

1. `bunx tsc --noEmit` clean ✓; `bun run build` clean ✓.
2. Simulation of 8 bucket scenarios passes ✓ (see table above).
3. Deployed grip-only session on `/summary` → generated tips read as neutral daily reminders; no 「全部正常」 / 「全部達標」 / 「有健康風險」 language; no fabricated reference to 血壓 / BMI / 內臟脂肪 that weren't measured. **[Awaiting deploy + user test.]**
4. Deployed full-record session (BP + BMI + 內臟脂肪 measured) → M42's existing normal / few-off / many-or-crisis behaviour byte-identical to pre-M42a. **[Awaiting deploy + user test.]**
