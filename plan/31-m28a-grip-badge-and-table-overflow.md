# M28a — hotfix: grip 「無適用參考標準」 across record/logbook + summary card overflow on mobile

**Status:** approved 2026-09-26 · caught in M28 post-deploy phone testing

## Bugs

**Bug 1 (data-flow).** `/handgrip` record page shows 「無適用參考標準」
above 儲存紀錄; same label surfaces on `/logbook` grip rows + CSV grade
column. Source: `grade.ts` returns `[{label:"無適用參考標準"}]`
unconditionally for grip; RecordModule renders it. After M28 gave grip
a 職安局 self-lookup table under the summary card, the label is now
factually wrong on every non-summary page that reads `gradeEntry` output.

**Bug 2 (CSS).** Summary matrix tables — most notably the M28 handgrip
5-col table — bleed past the white card's right edge on narrow phones.
Wrapper has `overflow-x-auto` but its parent flex child (`flex-1` at
`summary.tsx:705`) has default `min-width: auto`, so the div expands to
the table's intrinsic width and drags the overflow wrapper outside the
card's `p-5` padding.

## Fixes

### `src/lib/health/grade.ts`
Split the grip/sitreach shared case; grip returns `[]`:
```
case "grip":
case "sitreach": {
  const key = mod.id === "grip" ? "grip" : "distance";
  const v = values[key];
  if (v == null) return [];
  if (mod.id === "grip") return [];   // M28 self-lookup via 職安局
  return [{ label: "無適用參考標準", tone: "neutral" }];
}
```

Ripple (all intentional, consistent with the M28 Exception):
- RecordModule: no grade preview under grip input
- Logbook: no badge on grip rows
- CSV: grade column blank for grip
- **Summary card: byte-identical** — `interpretCard`'s grip branch
  falls back to hardcoded `"無適用參考標準"` when `grades[0]` is undefined;
  wire-sanitize (M27) still transforms it for Gemini; CardInterpretation
  SSOT preserved
- Sit-reach: unchanged (still no self-lookup table there)

### `src/routes/summary.tsx`
Add `min-w-0` to the flex child at line ~705:
```
<div className="flex-1">   →   <div className="flex-1 min-w-0">
```
Standard Tailwind flexbox trick: overrides default `min-width: auto`
on flex children so they honour their calculated share instead of
expanding to intrinsic content width. The inner `overflow-x-auto`
wrapper then properly clips + scrolls. Applies to every summary card,
not just handgrip — any card with wide body content is now bounded.

## Non-goals

- No new milestone concept — this is a hotfix on M28's Exception coverage
- No sit-reach changes (self-lookup for sit-reach is a separate future
  milestone; its `無適用參考標準` label remains accurate for now)
- No storage / schema / wire / grounding changes

## PRD alignment

| PRD clause | Check |
|---|---|
| L13/L50 no age/gender collected | ✓ No new inputs |
| L51 grade rule + Exception (5 cards) | ✓ Grip already in Exception; this fix propagates the Exception's spirit consistently to non-summary pages |
| L52 grounded AI advice | ✓ No leaflet or tips text change |
| L55 Traditional Chinese | ✓ Label just disappears; no new copy |
| ADR 0019 government source | ✓ No source change |
| ADR 0024 sensitive-word filter | ✓ No AI-output surface changed |
| ADR 0025 static-reference vs AI advice | ✓ Extends the M26/M28 Exception ripple |

**PRD L51 「grader itself is unchanged」** — grader now returns `[]` for
grip. Returning empty is an *absence* of grade (which the Exception
already promises); the clause forbids re-grading with different rules,
which we do not do. Compliant.

## No migration
- Storage envelope v1 unchanged
- Field key `grip` unchanged
- Numeric shape unchanged
- Old records read as before
- CSV column header (「手握力（左右合計）」) unchanged from M28; only the
  grade *cell content* for grip rows changes (was 「無適用參考標準」, now
  blank — same as any other ungraded field)

## No new SSOT violation
- Grip's `"無適用參考標準"` string now lives in exactly one place — the
  hardcoded fallback in `interpretCard`'s grip branch, which drives
  wire-sanitize. Simpler than pre-M28a (was in both `gradeEntry` and
  `interpretCard`).

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/handgrip` after data entry: no 「無適用參考標準」 label / no grade
   preview above 儲存紀錄
4. `/logbook` grip rows: no grade badge; date + value still render
5. CSV export: grip rows' grade column blank
6. `/summary` grip card unchanged from M28 (no badge; 職安局 table + ★
   overlay intact)
7. `/summary` on iPhone SE (375px): handgrip 5-col table scrolls
   horizontally inside card border; never bleeds past white card's
   right edge
8. Other cards (body-fat, BMR, water, SMI, BP, BMI, 內臟脂肪, 坐地前伸)
   also fit inside card bounds; nothing shifts for them
9. Sit-reach unchanged (still shows 「無適用參考標準」 badge on
   record/logbook/summary)
