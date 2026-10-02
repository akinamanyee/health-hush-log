# M45 — Make 男性 / 女性 headers on every gender-split reference table impossible to miss

**Status:** approved 2026-10-02

## Origin

User-reported risk on `/summary` (iPhone Safari 2026-10-01). Each of
the six self-lookup card disclosures renders a 男性 table above a 女性
table, both introduced by `<caption className="mb-2 text-xs
text-muted-foreground">`. The caption is barely louder than a footnote
— a 女性 user scanning for the ★-marker could land on the first (male)
table and read the wrong row.

Scope: six identical caption sites in `summary.tsx` (BodyFatMatrixTable,
BmrReferenceTable, WaterMatrixTable, SmiMatrixTable, HandGripMatrixTable,
SitReachMatrixTable).

## Fix

New module-level constant at the top of `summary.tsx`:

```ts
const GENDER_CAPTION =
  "mb-3 pb-2 border-b border-border text-left text-base font-semibold text-foreground";
```

Then six single-line changes — each `<caption>` className becomes
`{GENDER_CAPTION}`.

Rendered effect per caption:

| Property | Before | After |
|---|---|---|
| Size | `text-xs` (12px) | `text-base` (16px) |
| Weight | regular | `font-semibold` |
| Colour | `text-muted-foreground` | `text-foreground` |
| Alignment | centred (default) | `text-left` |
| Separator | none | `border-b border-border pb-2` |
| Margin below | `mb-2` | `mb-3` |

Caption **content unchanged** (「男性 標準脂肪量（%）」, 「女性 體內水分比例」, etc.).

## Decisions

1. Typographic-only, no icons / no colours — stronger type carries the
   signal; icons risk inconsistent rendering, colour-coding would drift
   the navy/teal palette into a semantic role.
2. No wrapper component — each inner matrix component has a different
   cell renderer (★ overlay / delta / 2-tier / 5-tier×age); the pattern
   we DO share is the caption, so we share THAT via a string constant.
3. No border/background around each table — the caption's own underline
   already bounds the header; adding a surrounding box would nest three
   borders deep on narrow iPhone screens.
4. No reorder / no gender presumption — PRD L13 forbids collection; the
   symmetric 男→女 order stays.

## PRD alignment

| PRD | Verdict |
|---|---|
| L13 anonymous | ✓ no new input |
| L48 local-only | ✓ UI only |
| L50 wire | ✓ no wire change |
| L51 + Exception | ✓ grader untouched; app still does not classify |
| L52 grounded AI | ✓ AI untouched |
| L55 繁中 | ✓ copy unchanged |
| **L57 Japanese-minimalist, 50+ friendly** | **directly served** — 16px, semibold, foreground contrast |
| ADR 0025 | ✓ caption labels static reference; permitted |

## Verification

- `bunx tsc --noEmit` clean ✓
- `bun run build` clean ✓
- Grep confirms 6 captions all use `{GENDER_CAPTION}`; no stale
  `mb-2 text-xs text-muted-foreground` captions remain.

## Risks + fixes

| Risk | Fix |
|---|---|
| Taller disclosures on small iPhone screens | ~16px extra per table — negligible against the matrices themselves. |
| `text-left` misaligned vs centred cells | Caption sits ABOVE the table; left-align matches other `/summary` section headers. |
| Future contributor adds a 7th table and forgets | Comment above the constant tells them to reuse it. |
| User still misreads despite stronger caption | Residual risk; M45a could promote the footer legend to top-of-disclosure if the field reports it. |

## Files touched

1. `src/routes/summary.tsx` — new `GENDER_CAPTION` constant + 6 className swaps.
2. `plan/49-m45-prominent-gender-headers.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`

## Non-goals

- No icons / colour accents / wrapper component / inner-matrix refactor.
- No new ADR (operates within PRD L57 + ADR 0025).
- No AI / grader / storage / wire / CSV / calendar change.

## Acceptance

1. `bunx tsc --noEmit` clean ✓; `bun run build` clean ✓.
2. Deployed `/summary` → each of the six self-lookup card disclosures
   renders prominent 男性 / 女性 captions with underline. **[Awaits deploy.]**
3. User who reported the risk reads the 女性 table and reports the
   heading no longer feels missable. **[Awaits user feedback.]**
