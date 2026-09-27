# M35 — 體脂率 grader hotfix

**Status:** approved 2026-09-27

## Goal

The Tanita grader in `src/lib/health/grade.ts` still pushes a synthetic
`{metric: "體脂率", label: "無適用參考標準"}` whenever `bodyFat` is
filled. Every downstream consumer of `grades[]` — the `/tanita` record
form grades section, the `/logbook` row list, and the CSV grade column
— stamps 「無適用參考標準」 next to 體脂率. This directly contradicts
the TANITA 5-tier × 3-age × 2-gender self-lookup reference matrix
M23–M26 landed on the 體脂率 summary card, and PRD L51's Exception
clause explicitly names 體脂率 as one of six cards whose badge is
skipped precisely because a reference IS present. M35 removes the
synthetic push, mirroring the exact pattern M28a and M29 already
applied to grip and sit-reach.

## What we build

**File:** `src/lib/health/grade.ts` — remove the 4-line 體脂率 push
in the `case "tanita"` block; add an 8-line comment explaining the
same reasoning as M28a / M29 (co-located on the tanita case).

Nothing else changes. `interpretCardCore` (line 170-182) still reads
`gradeByMetric.get("體脂率")` and falls back to
`?? "無適用參考標準"`, so summary card + wire-sanitize behaviour are
byte-identical.

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ no data collected or moved |
| L23 NORTHSTAR | ✓ removes a self-contradiction |
| L34 USER JOURNEY 3 | ✓ record path unchanged |
| L35 USER JOURNEY 4 | ✓ 體脂率 never had a tier — before M35 it lied about having one |
| L48 local-only | ✓ no storage change |
| L50 wire payload | ✓ byte-identical |
| **L51 grading rule + Exception** | ✓ directly honoured — extends M26/M28a/M29 pattern to 體脂率 record/logbook/CSV |
| L52 grounded AI | ✓ unchanged |
| L55 繁中 | ✓ no label change |
| L56 disclaimer | ✓ unchanged |
| L57 Japanese-minimalist | ✓ one less noise badge |

## Design decisions

1. Remove, not silence — cleaner than an empty label.
2. Comment style mirrors M28a/M29 for future readers.
3. ADR 0025 Source change history gains one line.
4. No PRD change — this brings code into compliance with existing L51.

## Risks + fixes

| Risk | Fix |
|---|---|
| Historical entries lose 體脂率 badge | Correct — the badge was always misleading. Value still renders in history list. |
| CSV 體脂率 grade column becomes empty | Intended — matches grip/sit-reach post-M28a/M29. |
| Summary card 體脂率 badge changes | Zero change — M26's CARDS_WITH_SELF_LOOKUP already hides it; interpretCard fallback keeps grade payload identical. |
| Downstream consumers of gradeEntry | Grepped — all handle empty entries (grip/sit-reach already return `[]`). |
| Blast radius on other tanita cards | Zero. BMR/水分/SMI never had graders; BMI/內臟脂肪 have real deterministic graders, untouched. |

## Files to touch

1. `src/lib/health/grade.ts`
2. `plan/38-m35-body-fat-grader-fix.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`
5. `adr/0025-static-reference-vs-ai-advice.md` — one line in Source change history

## Non-goals

No storage migration, no PRD change, no wire change, no summary card change, no M36 work.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/tanita` after filling 體脂率 → grades section no longer shows 體脂率 badge (BMI + 內臟脂肪 badges still render)
4. `/logbook` Tanita rows no longer stamp 體脂率 · 無適用參考標準
5. CSV 體脂率 grade column empty
6. `/summary` 體脂率 card unchanged
7. Wire payload byte-identical
