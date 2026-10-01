# M44 — Lock 體重 to the primary Tanita screen; non-primary OCR must not overwrite it

**Status:** approved 2026-10-01

## Origin

User-reported bug (2026-10-01): on `/tanita`, every one of the 7 screens
lists `weight` in its fields. TANITA shows weight at the top of each
screen, so OCR on screens 2–7 returns a weight too, and `onImage` at
`useRecordState.ts:113` was merging it unconditionally — overwriting the
user's screen-1 weight by ±0.1-0.5 kg of scale drift each time the user
photographed another screen.

## Fix

Single file: `src/components/health/useRecordState.ts`, `onImage` only.
Three added lines inside the merge loop skip `weight` when the OCR ran on
a non-primary Tanita screen.

```ts
const isPrimaryWeightScreen =
  mod.id !== "tanita" || !screenId || screenId === mod.screens![0]!.id;
for (const [k, v] of Object.entries(res.values)) {
  if (v == null) continue;
  if (k === "weight" && !isPrimaryWeightScreen) continue;
  filled[k] = String(v);
}
```

- `mod.screens[0].id` not literal `"bodyFat"` — invariant moves with the array.
- `mod.id !== "tanita"` short-circuit keeps the guard a no-op for BP /
  grip / sitreach, which call `onImage` without `screenId`.
- Only `weight` is stripped; every other field merges normally.

No UI change — the disabled-display pattern for weight on screens 2–7
still mirrors `values["weight"]`.

## Behaviour matrix (verified by simulation)

| Case | Before | After |
|---|---|---|
| screen=muscle, weight=70.5, OCR returns weight=70.3 | weight becomes 70.3 ❌ | weight stays 70.5 ✓ |
| screen=bodyFat (primary), OCR returns weight=70.3 | weight becomes 70.3 | weight becomes 70.3 (unchanged) |
| screen=water, weight empty, OCR returns weight=70.4 | weight becomes 70.4 | weight stays empty — M36 ready check catches it at save |
| BP module (no screenId) | all merged | all merged (short-circuit) |
| screen=asm, weight set, OCR returns weight + 4 limbs | weight overwritten, limbs set | weight preserved, limbs set ✓ |
| screen=bmi, weight set, OCR returns weight + height | both overwritten | weight preserved, height merged |

Standalone 6-case simulation on `/tmp/verify-m44.mjs`: all match spec.

## PRD alignment

| PRD | Verdict |
|---|---|
| L47/L48 | ✓ in-memory state only |
| L50 wire | ✓ OCR payload unchanged; strip is client-side after response |
| L51 deterministic + Exception | ✓ grader untouched; derived values (BMI/ASM/SMI) now reflect user intent |
| L52 grounded AI | ✓ AI layer untouched |
| L55 繁中 / L57 50+ friendly | ✓ no copy / UI change |
| USER JOURNEY 3-4 (photo → review → save) | ✓ user still reviews before save; only weight on screens 2+ no longer twitches |

## Risks + decided fixes

| Risk | Fix |
|---|---|
| User photographs only screens 2–7, never screen 1 → no weight | M36 `ready` check already catches missing weight and `queueMicrotask` auto-scrolls to the first `aria-invalid="true"` input (screen 1's weight). |
| Future screen reorder in `modules.ts` | Rule reads `mod.screens[0].id` dynamically; invariant moves with the array. |
| Lenient alternative (fill when screen-1 empty) not chosen | Strict rule matches user's explicit "do not make changes" wording; avoids silently anchoring weight to a photo not intended as authority. |
| Non-tanita modules | Short-circuit makes guard inert. |
| `mod.screens![0]!.id` non-null assertions | Reached only when `mod.id === "tanita"` AND `screenId` is set — both imply `screens` exists and `screens[0]` is defined. TypeScript clean. |

## Duplicated state / data

None. `values["weight"]` has always been single-source. M44 tightens *when* that source accepts writes from OCR.

## Breaking an existing flow

None. Bug fix only. `derived` memo (BMI/ASM/SMI), `ready` memo, `submit`,
stored shape, CSV, calendar, summary — all read the same `values["weight"]`
and see the user-intended weight going forward.

## Data / storage / migration

Nothing to migrate. No table/schema/envelope touched.

## Files touched

1. `src/components/health/useRecordState.ts`
2. `plan/48-m44-weight-locked-to-primary-screen.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`

## Non-goals

- No UI change to the disabled-display pattern.
- No generalisation to "lock any field across screens" — scope is 體重.
- No voice / grader / AI / CSV / calendar / storage change.
- No new ADR — merge-rule tightening within existing patterns.

## Acceptance

1. `bunx tsc --noEmit` clean ✓; `bun run build` clean ✓.
2. 6-case simulation of the merge logic passes ✓.
3. Deployed on `/tanita` with real TANITA session → weight on logbook /
   summary matches screen-1's value regardless of which other screens
   were photographed afterwards. **[Awaits deploy + user test.]**
