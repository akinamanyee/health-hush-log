# ADR 0020 — Direct Google Gemini provider and generateText over streamText

**Date:** 2026-09-22  
**Status:** Accepted

## Context

The app was ejected from Lovable's platform to deploy on Google Cloud Run. Lovable's AI gateway (`@ai-sdk/openai` pointed at a managed proxy) is not available outside the Lovable editor. Separately, `streamText` was causing `NoOutputGeneratedError` on Cloud Run — the SSE stream opened but produced zero content before closing, even though the same code worked on Lovable's infrastructure.

## Decision

1. **Provider**: Use `@ai-sdk/google` (`createGoogleGenerativeAI`) with a direct `GEMINI_API_KEY`, replacing `@ai-sdk/openai` pointed at Lovable's gateway. Model changed from `openai/gpt-6-astra` (Lovable proxy name) to `gemini-3.6-flash` (direct Google model).

2. **SDK function**: Use `generateText` instead of `streamText` for both `extractFromImage` and `generateRichSummary`. Both calls consume the full result server-side, so streaming adds no user-facing benefit — the client waits for the complete response either way.

## Options rejected

- **Keep `streamText` with error handling**: Could wrap `streamText` in a try/catch and fall back, but the root cause (empty SSE stream on Cloud Run) would remain; `generateText` eliminates the failure mode.
- **Upgrade `@ai-sdk/google`**: The installed v2.0.97 already supports `gemini-3.x` model names via passthrough — no version bump needed.
- **Use `generateObject`**: Would enforce JSON output at the SDK level, but the existing `extractJson` + Zod parse + retry flow already handles malformed output with Chinese error messages.

## Consequences

- API errors now surface directly instead of the generic "No output generated" message — better for debugging, though the error text may be in English (pre-existing issue; the app already showed English errors from `streamText`).
- The `ai` package's `streamText` export is no longer imported — tree-shaking removes the streaming code path from the server bundle.
- The `GEMINI_API_KEY` environment variable must be set on Cloud Run; there is no fallback.
