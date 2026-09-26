# M34 — 摘要延時可見: server-side wall-clock diagnostics

**Status:** approved 2026-09-27

## Goal

After M33 confirmed the summary handler returns HTTP 200 successfully
every time (three POST 200 lines in Cloud Run logs), yet iPhone Safari
still shows 「Load failed」, the failure is mid-flight (mobile
carrier / proxy drops the TCP connection before the response body
finishes arriving; server never knows). Latency-reduction fixes are
gated on measurement. M34 adds per-phase and total wall-clock
duration logs so we can name the actual number and pick the right
Step-2 fix without guessing.

## What we build

**File:** `src/lib/health/ai.functions.ts`.

### `generateRichSummary`

- Handler-level total: bookend the handler body with `Date.now()`;
  log `[generateRichSummary] total <ms> cards=<N>` at exit and
  `[generateRichSummary] total <ms> cards=<N> (errored)` when a
  throw escapes.
- Per-phase timing on the `run(prompt, phase)` helper (M33 wrapper):
  add `t0 = Date.now()` at entry, log
  `[generateRichSummary] <phase> ok <ms>` on success,
  `[generateRichSummary] <phase> failed <ms>:` prefix on the M33
  `console.error`.

### `extractFromImage`

- Same treatment on the single `generateText(...)` call:
  `[extractFromImage] ai ok <ms> module=<mod> screen=<id|all>` on
  success, `[extractFromImage] ai failed <ms>:` prefix on failure.

Nothing else changes — Zod schemas, prompts, grounding logic,
retry structure, wire payload, storage, client all untouched.

## Design decisions

1. `console.log` at INFO for success, `console.error` for failure
   (M33 already sets the error convention).
2. `Date.now()` — integer ms accuracy suffices for 15–60 s spans.
3. `cards=N`, `module=`, `screen=` capture shape, never values.
4. No prompt, card value, or AI response ever logged.
5. `(errored)` suffix on total lets us tell a 62 s timeout apart
   from a 62 s success.
6. Client toast unchanged; diagnostic lives in Cloud Run logs.

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ no user identifier logged |
| L23 NORTHSTAR | ✓ moves 「Load failed」 mystery toward a named cause |
| L48 local-only | ✓ no storage change |
| L50 wire payload | ✓ byte-identical |
| L52 grounded AI + failed generation | ✓ M33 繁中 errors preserved |
| L55 繁中 throughout | ✓ user-facing text unchanged |
| L56 disclaimer | ✓ unchanged |
| L57 Japanese-minimalist | ✓ no UI change |

## Risks + fixes

| Risk | Fix |
|---|---|
| Log noise | Acceptable — 2–4 lines/request, removable after M35 pins the fix. |
| Health data in logs | Only handler name, phase, ms, card count, module, screen ID; failure error text does not include our payload. |
| Race on rapid taps | Cloud Run one-request-per-invocation, logs interleave safely. |

## Files to touch

1. `src/lib/health/ai.functions.ts`
2. `plan/37-m34-summary-latency-diagnosis.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`

## Non-goals

No latency reduction, no Cloud Run timeout change, no model change,
no retry-count change, no client change, no wire change, no new ADR,
no PRD change. The diagnostic IS the deliverable.

## What we do with the numbers (informs M35)

- Total <30s and Load failed persists → client-side (SW / PWA / CORS).
- Total 30–60s → borderline; M35 raises Cloud Run `--timeout=300s`, adds progressive UI.
- Total >60s consistently → split into per-card server calls; consider skipping 合規重試 when all cards are self-lookup.
- `total (errored)` at ~60s → Cloud Run terminated the container.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. One 生成健康摘要 attempt produces at minimum:
   - one `[generateRichSummary] 初次 ok Nms` (or `... failed Nms:`) line
   - one `[generateRichSummary] total Nms cards=M` line
4. One `/tanita` photo drop produces one `[extractFromImage] ai ok Nms module=tanita screen=<id>` line
5. Zero user-visible behaviour change
6. No card values, prompts, or AI outputs in the logs
