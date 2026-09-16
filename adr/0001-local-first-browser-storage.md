# 0001 — Health data lives only in browser storage

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
All readings, the profile (age, gender) and the AI usage counter are stored in this
browser's `localStorage` under a versioned `{ v: 1, data }` envelope. No database exists.
A visible two-step clear-all action erases everything.

## Rejected
- **A cloud database with accounts.** Rejected: the PRD forbids sensitive medical data
  leaving the device, and accounts would create exactly the store we promised not to keep.
- **IndexedDB.** Rejected: no benefit at this data volume, more code to maintain.

## Why
It is the product's core promise. It also removes authorisation, RLS and breach surface
entirely: there is nothing on a server to protect.

## Consequences
Clearing browser storage loses history, so CSV export is the user's backup, and there is no
cross-device sync (explicitly out of scope).
