# Architecture — 健康紀錄簿

Describes how the code is actually built. The code is the SSOT for behaviour; this file
describes it. Last reconciled against the code: **2026-09-22 22:04 HKT**.

## Shape in one paragraph

A single-page, sign-in-free TanStack Start app. Every health reading is created, graded,
stored, exported and erased **inside the browser**. There is no database and no user table.
Two stateless server functions exist for one reason only: to hold the AI credential
server-side. Grading is pure local computation over bundled reference tables.

## Stack

- TanStack Start v1 (React 19, Vite 8), file-based routes in `src/routes`
- Tailwind CSS v4 via `src/styles.css` (design tokens in `@theme`, `glass-card` utility)
- `sonner` for notices, `recharts` for trend lines, `lucide-react` icons, the supplied cover image and four supplied module illustrations
- AI SDK (`ai` v7 + `@ai-sdk/google` v4) calling Google Gemini (`gemini-3.6-flash`) directly via `generateText`
- Storage: `localStorage` only

## Modules

| Concern | Home |
| --- | --- |
| Module definitions (id, title, fields, units, min/max, route, storage key, optional `infoText`, optional `screens`) | `src/lib/health/modules.ts` |
| Reference tables + leaflet text (one named source per table) | `src/lib/health/charts.ts` |
| Local calendar dates and clamped month arithmetic | `src/lib/health/dates.ts` |
| Spoken-number parsing (Arabic + Chinese numerals) | `src/lib/health/voice.ts` |
| Grading entry point + card interpretation for summary | `src/lib/health/grade.ts` |
| Storage envelope, hydration gate, AI usage counter, clear-all | `src/lib/health/store.ts` |
| Re-check date, `.ics`, Google Calendar link | `src/lib/health/calendar.ts` |
| CSV export | `src/lib/health/csv.ts` |
| Server-side AI (image read, summary) | `src/lib/health/ai.functions.ts` |
| Gateway client + per-IP backstop | `src/lib/ai-gateway.server.ts` |
| Shared record state and behaviour hook | `src/components/health/useRecordState.ts` |
| Shared record-and-review form for bp/grip/sitreach (with optional info popover per module) | `src/components/health/RecordModule.tsx` |
| Six-screen Tanita recorder (per-screen photo extraction, no voice) | `src/components/health/TanitaRecord.tsx` |
| Photo drop (client-side downscale), voice, grade badge | `src/components/health/{ImageDrop,VoiceButton,GradeBadge}.tsx` |
| Cover entrance, dashboard, four module pages, summary page | `src/routes/*.tsx` and `src/components/health/Dashboard.tsx` |

Three module routes (`/blood-pressure`, `/grip`, `/sit-and-reach`) pass a `ModuleDef` into
`RecordModule`. The `/tanita` route passes its `ModuleDef` into `TanitaRecord`, which renders
six labelled sections matching the physical analyser's screens, each with its own `ImageDrop`
for per-screen photo extraction. Both components consume the `useRecordState` hook, which holds
all record state and behaviour once.
The cover remains `/`; the stable dashboard destination is `/logbook`, so module, summary and
error returns do not replay the cover.

## Data flow

```text
camera/upload photo ──▶ ImageDrop (downscale ≤1600px, JPEG)
             │
             ▼  data URL + optional screen id
       extractFromImage  (server fn, credential server-side, nothing stored)
             │  Tanita per-screen: narrow prompt (3–8 fields) + screen-specific
             │  Zod schema (keys derived from ScreenDef.fields SSOT).
             │  Other modules: full-field prompt.
             │  strict zod values, nulls allowed
voice ──▶ ─┐ ▼  (voice not available on Tanita — per-screen photo replaces it)
type  ──▶ ─┴ review form (RecordModule / TanitaRecord) ── user confirms ──▶ localStorage
                     │
                     │  Multi-photo merge: each photo overwrites only non-null
                     │  AI values, preserving earlier reads. A progress counter
                     │  and context-aware toast guide the user through the flow.
                     │
                     ├─▶ gradeEntry()  ── deterministic tables ──▶ badges
                     ├─▶ recheckDate() ──▶ .ics / Google Calendar link
                     └─▶ exportAllToCsv() ──▶ 健康紀錄.csv (UTF-8 BOM)

latest readings + grades ──▶ generateRichSummary (server fn, leaflet-grounded)
                                ──▶ structured JSON (per-card interpretation, tips tagged by topic, agencies list, disclaimer)
```

## Single sources of truth in code

- **Stored entries**: `readEntries()` / `useLocalData()` in `store.ts` are the only readers.
  Nothing else parses `localStorage`; both honour the `{ v: 1, data }` envelope.
- **Grades**: `gradeEntry(mod, values)` in `grade.ts` is the only grader. Forms,
  CSV and the summary all call it, so they cannot disagree. `interpretCard()` calls
  `gradeEntry()` internally and layers on range/action/value for the rich summary.
- **Field metadata**: `modules.ts` only — labels, units and limits are never retyped in a route.
- **Field-to-screen mapping** (Tanita): `ScreenDef.fields` in `modules.ts` is the single
  source. `TanitaRecord` filters fields by it for rendering; `ai.functions.ts` derives Zod
  schema keys and screen-hint labels from it, keeping only AI-specific prompt text locally.
- **Reference numbers**: `charts.ts` only, and the same leaflet text both grounds the AI and is the allow-list the generated summary is checked against after generation (fails → one strict retry → withheld).
- **Static reference tables** (M29: 6 cards — 體脂率, 基礎代謝率, 體內水分, 肌少症指數 under TANITA matrices; 手握力 and 坐地前伸 under 職安局 5-tier × 5-age × gender matrices): rendered as JSX literals inside `src/routes/summary.tsx` only. Source data for 手握力 lives in `src/lib/health/handgrip.ts` and for 坐地前伸 in `src/lib/health/sitreach.ts` (matrices + `classifyHandGrip` / `classifySitReach` utilities, whose runtime callers are intentionally zero — ADR 0025). They may contain gender/age-structured data per ADR 0025 (the app never programmatically classifies the user with them; users self-identify). Their specific numeric values deliberately do NOT enter `REFERENCE_LEAFLET` or `TIPS_REFERENCE` — that would let the AI cite gender-specific ranges without qualifier. The AI-side text may point to the table with source-neutral wording (「卡片下方之對照表」); it must not name a specific agency that could disagree with what the JSX renders. Each `*StandardTable` component receives the user's own recorded value via a shared `parseLeadingNumber` helper and highlights (`bg-primary/10` + ★) the cell whose range contains it (body-fat / water / SMI / handgrip / sit-reach); BMR uses per-cell delta rather than tier ★ since TANITA publishes point values, not ranges. `matchesCell` handles `<N`, `≤N`, `≥N`, and `N-M` cell display formats — negative distance readings pass through cleanly since `≤N` inequality naturally admits negatives. All are UI-only visual lookups, never a grade — `gradeEntry` for these metrics either returns `"無適用參考標準"` in the CardInterpretation payload (體脂率) or is silent: BMR / water / SMI produce cards directly in `interpretCard` without a `GradeResult`; **grip (M28a) and sit-reach (M29) are silent** (`gradeEntry` returns `[]`) so the misleading 「無適用參考標準」 label no longer surfaces on `/handgrip` or `/sitreach` record pages, `/logbook` rows, or CSV grade column, while `interpretCard`'s branches keep the hardcoded `"無適用參考標準"` fallback so summary-card payload + wire-sanitize are byte-identical. Classifiers explicitly return `undefined` for uncovered ages (< 20 or ≥ 70) and, in sit-reach's case, for the 2 verbatim source gaps (男 30-39 @ 30 cm; 男 60-69 @ 22 cm) — footer text on the disclosure names both so users know to look at neighbours. Summary card omits the grade-badge chip for all 6 cards (`CARDS_WITH_SELF_LOOKUP` Set gate in `summary.tsx`, mirrored by `SELF_LOOKUP_CARD_NAMES` in `ai.functions.ts` for wire-payload sanitize). Summary card body wrapper carries `min-w-0` on its `flex-1` div (M28a) so wide matrix tables scroll horizontally inside the card border on narrow phones instead of bleeding past it. PRD L51 Exception; M26 introduced the pattern for 體脂率, M27 extended to 4 cards + added wire-sanitize, M28 added 手握力 + 職安局, M28a made grip's non-grade behaviour consistent across pages + fixed mobile table overflow, M29 added 坐地前伸 (last of the initial 6) — closing the reference-completion program for all four record modules.

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
  (`{ name, value, grade, range, action }[]`, capped at 12 cards — raised from 6 in M27a to accommodate the M27 additions BMR + 體內水分 + 肌少症指數 on top of BMI + 體脂率 + 內臟脂肪 + BP + grip + sitreach; every card the user has recorded reaches the AI without truncation).
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
