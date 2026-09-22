# ADR 0021 — Upgrade @ai-sdk/google to v4 for ai v7 compatibility

**Date:** 2026-09-22  
**Status:** Accepted

## Context

Photo extraction (`extractFromImage`) sends a user's photo to Gemini as a multipart message with
an image part. The image arrives from the browser as a base64 data URL (`data:image/jpeg;base64,...`).

`ai` v7 core (`@ai-sdk/provider-utils` v5) converts image parts into tagged file-part objects:
`{ type: "file", data: { type: "data", data: <Uint8Array or base64 string> }, mediaType }`.
`@ai-sdk/google` v2 (`@ai-sdk/provider-utils` v3) passes `part.data` directly to `convertToBase64()`,
which only unwraps `Uint8Array` — the tagged `{ type: "data", data: ... }` wrapper passes through
as a JSON object, and the Gemini API rejects it: "Invalid value at 'contents[0].parts[1].inline_data'
(data), Starting an object on a scalar field".

## Options

1. **Pre-process the data URL to `Uint8Array` ourselves** before passing to `generateText`.
   Rejected: the v7 core re-wraps `Uint8Array` in the same tagged structure, so the provider
   still receives a tagged object it cannot unwrap.
2. **Upgrade `@ai-sdk/google` to v4** which uses `@ai-sdk/provider-utils` v5, matching `ai` v7.
   The v4 provider accesses `contentPart.data.data` (the inner value) instead of `contentPart.data`
   (the tagged wrapper), so `convertToBase64` receives a `Uint8Array` or string.
3. **Call the Gemini API directly** without the AI SDK for image extraction. Rejected: loses
   the shared gateway, rate limiting, and retry logic.

## Decision

Option 2: upgrade `@ai-sdk/google` from `^2.0.0` to `^4.0.0`. The `createGoogleGenerativeAI`
export is preserved as an alias of `createGoogle`. No code changes required in `ai.functions.ts`
or `ai-gateway.server.ts`.

## Consequences

- Photo extraction works with the current `ai` v7 core.
- `@ai-sdk/provider-utils` is no longer duplicated at two major versions in `node_modules`.
- The upgrade brings new capabilities (file search, speech, video models) that we don't use
  but that are harmless.
- If `ai` is later upgraded past v7, the Google provider should stay in sync.
