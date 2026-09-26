# M33 — Hotfix: surface AI-call failures as Chinese errors

**Status:** approved 2026-09-26

## Goal

Replace the opaque 「Load failed」 the browser shows when Google's Gemini
API fails (auth, quota, timeout, deprecated model, transient network)
with a diagnosable Chinese error. The server-side handler currently
lets `generateText(...)` throw uncaught → Cloud Run returns 500 with no
CORS body → Safari renders `TypeError: Load failed` verbatim in the
toast. Wrap the AI call, log the underlying reason server-side, and
throw a user-friendly Chinese `Error` the existing
`toast.error(e.message)` path can display.

## Scope

Two server functions, one file: `src/lib/health/ai.functions.ts`.

### A. `generateRichSummary`

Wrap the inner `run(prompt)` helper so any AI call throw becomes a
繁中 error naming the phase. Three call sites tagged: `"初次"`,
`"格式重試"`, `"合規重試"`.

```ts
const run = async (prompt: string, phase: string) => {
  try {
    const result = await generateText({ ... });
    return result.text.trim();
  } catch (err) {
    console.error(`[generateRichSummary] ${phase} failed:`, err);
    throw new Error(`摘要生成暫時未能連線（${phase}）。請稍後再試。`);
  }
};
```

### B. `extractFromImage`

Same wrap around its lone `generateText(...)` call. Message:
`「圖片讀取暫時未能連線，請稍後再試或手動輸入。」`. The existing
JSON-parse `try/catch` around `screenSchema.parse(...)` is untouched
— it catches malformed AI responses, this catch is one layer earlier
at the network/API boundary.

## Design decisions

1. **Log raw error server-side** (`console.error`) so Cloud Run logs
   carry the diagnostic. **Return a generic 繁中 message** to the
   client — never leak Google API error text (may include internal
   endpoints, request IDs) into the toast.
2. **Phase tag in the message** so a repeat report tells us which
   retry died — narrows Google-side vs grounding-retry-timeout vs
   Cloud Run timeout.
3. **No timeout adjustment, no retry, no model change.** Hotfix only
   changes the failure surface. If Cloud Run 60s is the underlying
   cause, a real fix is a separate milestone.
4. **`console.error` is safe** — Cloud Run logs, not browser. No
   wire-payload change, no CORS surface change.

## PRD alignment

| PRD | Check |
|---|---|
| L23 NORTHSTAR (trustworthy) | ✓ improved — no more mystery English error |
| L50 wire payload | ✓ no change to what leaves the device |
| L52 grounded AI + failed generation | ✓ preserves L52's 「a failed generation must show a real error rather than invented advice」 — currently the user sees 「Load failed」, which is not a real error in Chinese; this fixes it |
| L55 繁中 throughout | ✓ replaces English error with 繁中 |
| L56 disclaimer + local-only notice | ✓ unchanged |

## Risks + fixes

| Risk | Fix |
|---|---|
| Swallowing errors makes debugging harder | `console.error` in Cloud Run logs preserves the full trace; only the browser message is genericised. |
| A Google 429 (rate limit) reads the same as a 500 | Acceptable — user action is identical: 「稍後再試」. Logs distinguish. |
| Retry loop could still exceed Cloud Run 60s | Not fixed here (separate milestone). Timeout at least surfaces as a Chinese message. |
| Existing Chinese-throw paths (grounding failed, parse failed) get double-wrapped | No — those throws happen OUTSIDE the `run(...)` closure. |

## Files to touch

1. `src/lib/health/ai.functions.ts`
2. `plan/36-m33-ai-call-error-surface.md` (this)
3. `Product_Roadmap.md`
4. `CHANGELOG.md`

## Non-goals

- No timeout increase, no retry-count change, no model change
- No client-side changes (`summary.tsx` untouched)
- No storage / schema / wire change
- No new ADR

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. Once deployed: with a garbage `GEMINI_API_KEY`, toast reads 「摘要生成暫時未能連線（初次）。請稍後再試。」 in 繁中 rather than 「Load failed」.
4. `/tanita` photo drop with garbage key → toast reads 「圖片讀取暫時未能連線⋯」.
5. Cloud Run logs show `[generateRichSummary] 初次 failed:` with full trace.
6. Happy-path summary generation still works when the key is valid.
