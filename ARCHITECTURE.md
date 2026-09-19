# Architecture — 健康紀錄簿

Describes how the code is actually built. The code is the SSOT for behaviour; this file
describes it. Last reconciled against the code: **2026-09-19 HKT**.

## Shape in one paragraph

A single-page, sign-in-free TanStack Start app. Every health reading is created, graded,
stored, exported and erased **inside the browser**. There is no database and no user table.
Two stateless server functions exist for one reason only: to hold the AI credential
server-side. Grading is pure local computation over bundled reference tables.

## Stack

- TanStack Start v1 (React 19, Vite 7), file-based routes in `src/routes`
- Tailwind CSS v4 via `src/styles.css` (design tokens in `@theme`, `glass-card` utility)
- `sonner` for notices, `recharts` for trend lines, `lucide-react` icons, the supplied cover image and four supplied module illustrations
- AI SDK (`ai` + `@ai-sdk/openai`) pointed at the managed AI gateway
- Storage: `localStorage` only

## Modules

| Concern | Home |
| --- | --- |
| Module definitions (id, title, fields, units, min/max, route, storage key) | `src/lib/health/modules.ts` |
| Reference tables + leaflet text (one named source per table) | `src/lib/health/charts.ts` |
| Local calendar dates and clamped month arithmetic | `src/lib/health/dates.ts` |
| Spoken-number parsing (Arabic + Chinese numerals) | `src/lib/health/voice.ts` |
| Grading entry point + card interpretation for summary | `src/lib/health/grade.ts` |
| Storage envelope, hydration gate, AI usage counter, clear-all | `src/lib/health/store.ts` |
| Re-check date, `.ics`, Google Calendar link | `src/lib/health/calendar.ts` |
| CSV export | `src/lib/health/csv.ts` |
| Server-side AI (image read, summary) | `src/lib/health/ai.functions.ts` |
| Gateway client + per-IP backstop | `src/lib/ai-gateway.server.ts` |
| Shared record-and-review form | `src/components/health/RecordModule.tsx` |
| Photo drop (client-side downscale), voice, grade badge | `src/components/health/{ImageDrop,VoiceButton,GradeBadge}.tsx` |
| Cover entrance, dashboard, four module pages, summary page | `src/routes/*.tsx` and `src/components/health/Dashboard.tsx` |

The four module routes (`/tanita`, `/blood-pressure`, `/grip`, `/sit-and-reach`) are thin
wrappers that pass a `ModuleDef` into `RecordModule`; all record behaviour lives once.
The cover remains `/`; the stable dashboard destination is `/logbook`, so module, summary and
error returns do not replay the cover.

## Data flow

```text
camera/upload photo ──▶ ImageDrop (downscale ≤1600px, JPEG)
             │
             ▼  data URL only
       extractFromImage  (server fn, credential server-side, nothing stored)
             │  strict zod values, nulls allowed
voice ──▶ ─┐ ▼
type  ──▶ ─┴ review form (RecordModule) ── user confirms ──▶ localStorage
                     │
                     │  Multi-photo merge: each photo overwrites only non-null
                     │  AI values, preserving earlier reads. A progress counter
                     │  and context-aware toast guide the user through the flow.
                     │
                     ├─▶ gradeEntry()  ── deterministic tables ──▶ badges
                     ├─▶ recheckDate() ──▶ .ics / Google Calendar link
                     └─▶ exportAllToCsv() ──▶ 健康紀錄.csv (UTF-8 BOM)

latest readings + grades ──▶ generateRichSummary (server fn, leaflet-grounded)
                                ──▶ structured JSON (per-card interpretation, tips with sources, disclaimer)
```

## Single sources of truth in code

- **Stored entries**: `readEntries()` / `useLocalData()` in `store.ts` are the only readers.
  Nothing else parses `localStorage`; both honour the `{ v: 1, data }` envelope.
- **Grades**: `gradeEntry(mod, values)` in `grade.ts` is the only grader. Forms,
  CSV and the summary all call it, so they cannot disagree. `interpretCard()` calls
  `gradeEntry()` internally and layers on range/action/value for the rich summary.
- **Field metadata**: `modules.ts` only — labels, units and limits are never retyped in a route.
- **Reference numbers**: `charts.ts` only, and the same leaflet text both grounds the AI and is the allow-list the generated summary is checked against after generation (fails → one strict retry → withheld).

## Storage keys

`hlb:tanita`, `hlb:bp`, `hlb:grip`, `hlb:sitreach`, `hlb:ai-usage`.
Every value is `{ v: 1, data }`; the version gate lets future shapes migrate instead of
being misread. Reads happen after hydration to avoid SSR mismatch. The old `hlb:profile`
key is purged because the product no longer collects age or gender.

## Access and privacy model

There are no accounts, roles or server-side records, so there is nothing to authorise.
The protection that matters is **what leaves the device**, enforced at the two call sites:

- `extractFromImage` receives a downscaled image and a module id — nothing else.
- `generateRichSummary` receives the latest readings with their grade labels
  (`{ name, value, grade, range, action }[]`, capped at 6 cards).
  No dates; age and gender are not collected.
- Both server functions are stateless: no logging of payloads, no persistence, `store: false`.
- The AI credential is read inside the handler from the server environment; the browser
  never receives it.

## Grading rules encoded in `charts.ts` / `grade.ts`

- Blood pressure: systolic and diastolic scored independently, **worse of the two** wins;
  `140+/<90` is additionally flagged 單純收縮期高血壓 (unless crisis).
- Hand grip and sit-and-reach: because age and gender are not collected, the app returns
  「無適用參考標準」 and still saves the raw number. No extrapolation, ever.
- Body composition: Asian BMI cut-offs and visceral-fat bands still grade; body-fat percentage
  returns 「無適用參考標準」 because the bundled bands require gender.
- Re-check interval by tier: normal 2 years, elevated 1 year, hypertensive 6 months,
  crisis → 「即時就醫」 with no calendar entry.

## AI usage limits

Client counter (`hlb:ai-usage`, 20/day) plus a coarse in-memory per-IP backstop (200/day)
in `ai-gateway.server.ts`. Both increment **after** a successful call, so failures never
burn a user's quota. Best-effort by design: the app has no accounts to bind a quota to.

## Known limits

- Voice input only renders where the browser exposes Chinese speech recognition.
- The per-IP backstop is in-memory and resets when the server instance recycles.
- Clearing browser storage deletes the history; CSV export is the user's backup.
