# M27a — Wire-payload card cap bump: 6 → 12

**Status:** approved 2026-09-24 · hotfix caught in M27 peer review

## Bug

`RichSummaryInput.cards.max(6)` in `src/lib/health/ai.functions.ts:136`
rejects payloads with more than 6 cards. M27 added 3 potential new Tanita
cards (基礎代謝率, 體內水分, 肌少症指數), taking Tanita alone to 6. Any
user with a full Tanita reading plus BP or grip or sitreach recorded ends
up with 7-9 cards → Zod rejects → `/summary` generate fails silently
with a toast error. Directly blocks NORTHSTAR and SUCCESS.

## Fix

Two files, one number, one prose update.

### `src/lib/health/ai.functions.ts`
`cards: z.array(z.object({…})).max(6)` → `.max(12)`.

12 = 9 (worst case today: 6 Tanita + BP + grip + sitreach) + 3 slack for
future card additions without another cap discussion.

### `ARCHITECTURE.md` L103
「`{ name, value, grade, range, action }[]`, capped at 6 cards」 →
「capped at 12 cards」.

### `plan/29-m27a-card-cap.md`
This file.

### `Product_Roadmap.md`
Append M27a entry (short — hotfix).

### `CHANGELOG.md`
Add M27a delivery entry linking back to M27 peer review.

## Untouched

- Storage schema (no on-disk change)
- `allowedNumbers` / grounding logic (still iterates cards linearly)
- Wire-payload sanitize from M27 (set-based; scales with card count)
- Other Zod caps (`name.max(20)`, `value.max(80)` etc. all unchanged —
  per-card field caps still enforce sane sizes)
- Any behaviour for users with ≤6 cards (no regression path)
- PRD: does not mention a 6-card cap; nothing to amend

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. Post-deploy, `/summary` generate succeeds for a user with 7-9
   cards worth of recorded data
4. Existing users with ≤6 cards see no change

## No migration
Pure wire-schema cap adjustment. Nothing on disk touched.
