# 0002 — The AI credential sits in this app's own server layer

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
Photo reading and the health summary run through two stateless TanStack server functions
(`src/lib/health/ai.functions.ts`) that call a managed AI gateway. The credential is read
from the server environment inside the handler and never reaches the browser.

## Rejected
- **Supabase Edge Functions on a separate project holding a Google AI Studio key** (the
  original request). Rejected: the app has no Supabase project connected and needs no
  database; a second project adds deployment, keys and drift for no added guarantee.
- **Calling the model from the browser with a public key.** Rejected outright: it exposes
  the credential.

## Why
The requirement is "the browser never sees the key". This satisfies it with one moving part
instead of two, inside the app already being deployed.

## Consequences
AI runs on the managed gateway's models and quota rather than a personal free-tier key.
Nothing is persisted server-side (`store: false`, no payload logging).
