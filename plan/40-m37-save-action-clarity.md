# M37 — 儲存動作明確化: 「tap to save」 before, 「saved」 after

**Status:** approved 2026-09-27

## Goal

Phone-test feedback on M36: the teal button with ✓ tick reads as
「saved」 rather than 「ready to save」 — ✓ + teal are universal
completion signifiers, so a 50+ user assumes the record is already
stored and doesn't tap. M37 re-vocabularises the button into three
distinct states so icon + text + colour reinforce the current step,
not the next one.

## Three button states

| State | Colour | Icon | Text | Meaning |
|---|---|---|---|---|
| Empty / out-of-range | navy `bg-primary` | — | 儲存紀錄 | Not yet ready |
| Ready to save | teal `bg-accent` | 💾 `<Save />` | 一按儲存 | Action pending; imperative |
| Just saved (~1.6s) | teal `bg-accent` | ✓ `<Check />` | 已儲存 | Action done; reassurance beat |

After 1.6s the third state reverts to navy 「儲存紀錄」 as `values` is
already cleared by `submit()`.

## What we build

### `src/components/health/useRecordState.ts`

- `justSaved: boolean` state — ephemeral UI flag.
- In `submit()` success branch: `setJustSaved(true)` +
  `setTimeout(() => setJustSaved(false), 1600)` after the existing
  success toast.
- Expose `justSaved` in the return.
- Bonus cleanup: drop the pre-M32 `hasOptional` dead branch in the
  photo-extraction success toast. Post-M32 no field is optional so
  the branch was unreachable; keep only the single 「已讀取圖片（已填 N / M 項）」 form.

### `src/components/health/TanitaRecord.tsx`

- Add `Save` to the lucide-react import (alongside `Check`).
- Consume `justSaved`.
- Button: className uses `ready || justSaved` for the teal state;
  children ternary is `justSaved ? Check+已儲存 : ready ? Save+一按儲存 : "儲存紀錄"`.

### `src/components/health/RecordModule.tsx`

Same treatment as TanitaRecord.

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ `justSaved` is UI-only |
| L23 NORTHSTAR | ✓ button no longer lies about state |
| L35 USER JOURNEY 4 | ✓ three distinct visuals for review/confirm/save |
| L48 local-only | ✓ no storage change |
| L50 wire | ✓ no wire change |
| L51 grading + Exception | ✓ no grader change |
| L52 grounded AI | ✓ no AI change |
| L55 繁中 | ✓ all labels 繁中 |
| L57 Japanese-minimalist + 50+ | ✓ same teal token, `min-h-14`, `text-lg`, full-width; icon at size-5 |

## Design decisions

1. `<Save />` (floppy) for pre-tap ready — universal 「save action」 signal.
2. `<Check />` reserved for post-tap done — where ✓ is truthful.
3. Colour stays teal for both ready and just-saved — reverting to navy inside 1.6s would flicker.
4. 1600ms delay = 50+ read-and-comprehend budget for two 繁中 characters.
5. `setTimeout` unref cleanup: React GC warning at most on unmount, no data risk. Not worth AbortController overhead.
6. `ready || justSaved` in className for shared teal; children ternary orders `justSaved` first so the label wins during overlap.
7. Bonus: strip dead `hasOptional` branch in photo-extract toast — same audit surface.

## Risks + fixes

| Risk | Fix |
|---|---|
| Rapid double-tap in the 1.6s window | `values` cleared → second tap fires empty-form validation. Correct. |
| setTimeout after unmount | Dev warning only, no prod effect. Acceptable. |
| Colour-blind users | Icon swap (💾 vs ✓) carries the state distinction — WCAG SC 1.4.1 preserved. |
| Screen reader announces label change | Correct — SR user gets same three-phase signal audibly. |

## Files to touch

1. `src/components/health/useRecordState.ts`
2. `src/components/health/TanitaRecord.tsx`
3. `src/components/health/RecordModule.tsx`
4. `plan/40-m37-save-action-clarity.md` (this)
5. `Product_Roadmap.md`
6. `CHANGELOG.md`

## Non-goals

No storage / wire / grader / AI / summary / PRD change. No new ADR. No animation, no pulse, no sound. No disable-button behaviour.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/blood-pressure`: fill 3 in range → teal 💾 「一按儲存」. Tap → teal ✓ 「已儲存」 for ~1.6s → navy 「儲存紀錄」.
4. `/tanita`: same three-state flow across 12 required fields.
5. Photo extraction toast reads single 「已讀取圖片（已填 N / M 項）」 form (no dead branch).
6. Rapid double-tap on ready button: second tap fires validation, no double-save.
7. Incomplete tap unchanged from M36 — toast + scroll to first red input.
