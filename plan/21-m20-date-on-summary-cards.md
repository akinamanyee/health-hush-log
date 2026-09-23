# M20 — 摘要卡片顯示紀錄日期 (Date on each summary card)

**Milestone value:** every `/summary` card owns its date, so users can tell which
saved reading feeds each card and how fresh that reading is, without leaving the
page. Closes an existing gap between PRD USER JOURNEY 5 / SUCCESS (「full recording
date including year」 on saved records) and the current `/summary` render (which
shows the reading's value + grade but hides its date).

## Traces

- PRD USER JOURNEY 5: 「sees the saved record with the full recording date including year」
- PRD SUCCESS: 「every saved record shows the date with year」
- PRD HARD CONSTRAINTS: Traditional Chinese, 50+ friendly, deterministic display

## Scope

Two files change. No new files. No new format helper. No storage change. No AI change.

| File | Change |
|---|---|
| `src/lib/health/grade.ts` | Add optional `recordedAt?: string` (ISO yyyy-mm-dd) to `CardInterpretation`; extend `interpretCard(mod, values, recordedAt?)` to stamp every returned card with that value. |
| `src/routes/summary.tsx` | Pass `latest.date` when calling `interpretCard`. Import `formatChineseDate` from `@/lib/health/calendar`. Render `「{formatChineseDate(recordedAt)} 記錄」` as a small muted line between the value/grade row and the AI interpretation paragraph. |

## The one new line of UI

Card before:
```
[icon]  血壓  125/82 mmHg  [正常偏高]
        AI interpretation…
```

Card after:
```
[icon]  血壓  125/82 mmHg  [正常偏高]
        2026年9月23日 記錄
        AI interpretation…
```

Tanita's three cards (BMI / 體脂率 / 內臟脂肪) all show the same date — they came
from one recording session; repetition is honest attribution, not duplication.

## Non-obvious calls (disclosed)

- **`HealthEntry.date` (ISO yyyy-mm-dd) over `createdAt` (ms epoch).** PRD promises
  「date with year」, not wall-clock time. `date` is the calendar day the entry was
  recorded against and matches how every other view in the app displays this.
  `createdAt` remains a sort tiebreaker, unchanged.
- **No time-of-day, no relative labels.** PRD asks for date-with-year; anything
  more is scope creep. Concrete dates also help older users cross-reference paper
  logs.
- **Small muted line under the value/grade row, not inline with the name.**
  Preserves the value + grade badge as the visual headline at phone width. Same
  muted styling as source attribution in the tips section, keeping metadata
  visually consistent.
- **`recordedAt` optional on `CardInterpretation`.** Future callers can call
  `interpretCard` without a date; the render simply omits the line.

## PRD/system reconciliation

- **PRD SSOT alignment.** USER JOURNEY 5 and SUCCESS both promise date-with-year
  on saved records; this closes an existing gap in `/summary`. No PRD line
  prohibits date on summary cards.
- **Duplicated state / parallel data.** None. Date lives once in `HealthEntry.date`;
  carried read-only through the render layer. `formatChineseDate` is the sole
  formatter — already imported by `logbook`, `RecordModule`, `TanitaRecord`,
  `useRecordState`.
- **Broken existing features.** None. `interpretCard`'s new param is optional and
  only `summary.tsx` calls it. Cards get one extra line; icons, badges, values,
  interpretations, tips section, empty-tips fallback, cover, logbook, record
  modules, CSV, calendar all untouched.
- **Schema / table changes.** None. `HealthEntry.date` already exists in every
  stored record. No migration.
- **Access model.** No new data leaves the device. AI summary prompt is unchanged
  — still receives grade labels + values only, per ADR 0018 and the hard
  constraint 「Dates never leave the device」. The date is client-render only.
- **HARD CONSTRAINTS** (all preserved): Local-first · AI never grades · No
  extrapolation · Review before save (summary is not a save path) · Credentials
  server-side · Traditional Chinese (「記錄」 and `formatChineseDate` output) ·
  Disclaimer · Deterministic grading · Voice / daily AI cap · Japanese-minimalist
  visual system.

## Edge cases

- **Missing `date` on an entry**: `recordedAt` optional; undefined skips the line
  silently.
- **Invalid ISO string**: `formatChineseDate` returns the input if `Date` parsing
  fails (`calendar.ts:11`). Inherited existing behaviour.
- **SSR hydration**: `Intl.DateTimeFormat("zh-HK", …)` is deterministic; no
  server/client mismatch.
- **Empty-tips fallback**: renders in the tips section, unaffected by card
  changes.

## Verification

1. `npx tsc --noEmit` — must be clean.
2. `bun run build` — must be clean.
3. Runtime sanity: `formatChineseDate("2026-09-23")` returns `"2026年9月23日"`.
4. Post-deploy on phone: record a fresh reading → open `/summary` → generate →
   confirm the card shows `2026年9月23日 記錄` beneath the value/grade row.

## Living-docs impact on ship

- `CHANGELOG.md` — one dated entry.
- `Product_Roadmap.md` — status line advances to 「M1–M20 delivered」.
- ADR — none needed (delivers existing PRD intent via existing helpers).
- `ARCHITECTURE.md` — no data-flow change; no update.
- `PRD.md` — no deviation.
