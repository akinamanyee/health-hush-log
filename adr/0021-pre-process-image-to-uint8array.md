# ADR 0021 — Pre-process image data URL to Uint8Array

**Date:** 2026-09-22  
**Status:** Accepted

## Context

Photo extraction (`extractFromImage`) sends a user's photo to Gemini as a multipart message with an image part. The image arrives from the browser as a base64 data URL (`data:image/jpeg;base64,...`).

`ai` v7 core (`@ai-sdk/provider-utils` v5) converts data URL strings into tagged objects: `{ type: "data", data: base64Content }`. `@ai-sdk/google` v2 (`@ai-sdk/provider-utils` v3) expects `part.data` to be a plain string or `Uint8Array` and passes it to `convertToBase64()`. When it receives the tagged object, it returns the object as-is, and the Gemini API rejects it: "Invalid value at 'contents[0].parts[1].inline_data' (data), Starting an object on a scalar field".

## Options

1. **Upgrade `@ai-sdk/google` to v3+** to match `ai` v7. Risk: major version jump; untested integration surface; could introduce regressions in text-only paths that already work.
2. **Pre-process the data URL to `Uint8Array` ourselves** before passing it to `generateText`. The Google provider's `convertToBase64(uint8array)` correctly produces a plain base64 string. No package changes.

## Decision

Option 2: add `dataUrlToUint8Array()` in `ai.functions.ts` to decode the data URL into `{ bytes: Uint8Array, mediaType: string }` and pass `{ type: "image", image: bytes, mediaType }` to `generateText`.

## Consequences

- Photo extraction works with the current `ai` v7 / `@ai-sdk/google` v2 combination.
- The workaround becomes unnecessary if `@ai-sdk/google` is later upgraded to match `ai` v7; at that point `dataUrlToUint8Array` can be removed and the data URL passed directly.
- No change to inputs, outputs, error handling, grounding checks, or data flow.
