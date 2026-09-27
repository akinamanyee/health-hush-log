# M36 — 儲存前一目了然: ready-when-teal button + toast + auto-scroll

**Status:** approved 2026-09-27

## Goal

All 4 record pages gain three coordinated save-time signals so a 50+ user
knows both (a) whether the form is ready to save before tapping and (b)
what to fix when it isn't — without hunting through the page for red text.

## What we build

### A. `src/components/health/useRecordState.ts`

- **`ready: boolean` memo.** True when every `mod.fields` entry has a
  non-empty raw that parses inside `[min, max]`. Post-M32 all fields are
  required so no `f.optional` gate is needed.
- **`submit()` failure path.** After `setErrors(errs)` and before the
  early return: `toast.error(\`尚有 N 項未填或超出範圍，已標紅，請補上再儲存。\`)`
  plus `queueMicrotask(() => document.querySelector('[aria-invalid="true"]')?.scrollIntoView({behavior:"smooth", block:"center"}))`.
- Expose `ready` in the return object.

### B. `src/components/health/TanitaRecord.tsx`

- Import `Check` from `lucide-react`; pull `ready` from `useRecordState`.
- Button: teal (`bg-accent text-accent-foreground hover:bg-accent/90`)
  with `<Check className="size-5" />` + 「儲存紀錄（已填齊）」 when `ready`;
  navy 「儲存紀錄」 otherwise.

### C. `src/components/health/RecordModule.tsx`

- Same button treatment as B.
- Drop the stale `mod.fields.some((f) => f.optional)` gate on the counter
  block — post-M32 every field is required so the gate always evaluated
  false and the counter never rendered on BP/grip/sit-reach. Now it
  renders uniformly across all 4 pages.

## Design decisions

1. Ready = filled AND in-range. A teal button that then fails on submit
   would be a worse lie than today's silent grey.
2. Icon + text swap alongside colour honours WCAG SC 1.4.1.
3. Toast on submit-failure only, not on `values` change.
4. `queueMicrotask` runs after React commits `errors` → `aria-invalid`
   is on the DOM before the query runs.
5. First `[aria-invalid="true"]` is the scroll target.
6. `bg-accent` design-system token, not raw hex. Teal shade is the PRD
   L57 palette's positive accent.

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ no data collected |
| L23 NORTHSTAR | ✓ readable — form tells its state before tap |
| L35 USER JOURNEY 4 | ✓ "confirms" gains cue, "saves" gains incomplete signal |
| L48 local-only | ✓ no storage change |
| L50 wire | ✓ no wire change |
| L51 grading + Exception | ✓ no grader change |
| L52 grounded AI | ✓ no AI-touching change |
| L55 繁中 | ✓ button label + toast all 繁中 |
| L57 Japanese-minimalist + 50+ | ✓ teal is palette accent; min-h-14 / text-lg / full-width preserved |

## Risks + fixes

| Risk | Fix |
|---|---|
| Teal contrast <4.5:1 dark mode | Verify at build; tune `--accent` or `text-white` if thin |
| Flicker on rapid typing | Existing `transition-colors` gives soft fade |
| Old iOS Safari no smooth scroll | Silent fallback to jump-scroll |
| Stale aria-invalid | queueMicrotask fires after React commit |
| iOS keyboard covers scrolled field | `block: "center"` keeps it above the keyboard |
| Counter suddenly appears on BP/grip/sit-reach | Matches TanitaRecord — helpful, not confusing |

## Files to touch

1. `src/components/health/useRecordState.ts`
2. `src/components/health/TanitaRecord.tsx`
3. `src/components/health/RecordModule.tsx`
4. `plan/39-m36-save-ready-ux.md` (this)
5. `Product_Roadmap.md`
6. `CHANGELOG.md`

## Non-goals

No storage / wire / grader / AI / summary / PRD change. No new ADR.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/blood-pressure`: fill 3 values in range → teal button 「✓ 儲存紀錄（已填齊）」; clear one → back to navy
4. `/blood-pressure`: 「已填 N / 3 項」 counter now renders (previously hidden)
5. `/tanita`: tap 儲存紀錄 with empty field → toast + scroll to first bad input
6. Fill 12 in-range → tap → happy-path save + success toast
7. Out-of-range value → button stays navy → tap → toast + scroll
8. Dark mode teal contrast visually acceptable
