# 0010 — Daily AI cap is best-effort, counted only on success

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
A per-device counter in browser storage allows 20 AI calls a day, backed by a coarse
in-memory per-IP limit of 200 on the server. Both increment **after** a successful call.

## Rejected
- **A strict per-user quota.** Rejected: the app has no accounts, by design, so there is no
  identity to bind a quota to.
- **Counting before the call** (the first implementation). Rejected: a network or model
  failure silently consumed the user's daily allowance.

## Why
It protects the shared quota without inventing an account system.

## Consequences
The cap is bypassable by clearing storage; the per-IP backstop resets when the server
instance recycles. Accepted for a sign-in-free app.
