# 0007 — The summary sends grade labels only

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
`generateHealthSummary` accepts `{ items: [{ module, grades[] }] }` — Traditional Chinese
grade labels, capped in length and count. Raw readings, dates, age and gender never leave
the device. The prompt tells the model it will not see numbers and must not invent them.

## Rejected
- **Sending recent entries with values, dates, age and gender** (the first implementation).
  Rejected on review: it shipped a stream of medical readings to a server, contradicting the
  PRD's core promise even though nothing was stored.
- **Sending nothing and writing the summary client-side from templates.** Rejected: loses the
  plain-language warmth that makes the summary worth reading.

## Why
Grades are enough to write useful guidance grounded in the leaflet, and they are not a
medical record.

## Consequences
The summary cannot comment on exact values or trends and says so when relevant.
