# M16 build plan — 可信的數字與日期

Delivered 2026-09-19 17:08 HKT · [ADR 0017](../adr/0017-grounding-check-local-dates-named-sources.md)

## Intent
Everything the app asserts must be checkable: the summary's numbers, the grading source, the
recording date, and the re-check reminder.

## Build
- `src/lib/health/ai.functions.ts`: validate the generated summary against the bundled leaflet —
  every Arabic number must appear there and the 醫生 reminder must be present; one strict retry,
  then withhold with a plain Chinese message. Model stays `openai/gpt-6-astra`.
- `src/lib/health/charts.ts`: name one authoritative source per table (2017 ACC/AHA blood-pressure
  categories, WHO Asia-Pacific BMI cut-offs, Tanita visceral-fat scale) and delete the unreachable
  age/gender norm tables.
- `src/lib/health/dates.ts` (new): local calendar dates and month addition clamped at month end;
  used by `store.ts` (records, daily AI count) and `calendar.ts` (re-check dates).
- `src/lib/health/voice.ts` (new): parse spoken Chinese numerals and decimals as well as digits;
  wired into `VoiceButton.tsx`.
- `RecordModule.tsx`: any past blood-pressure record can produce its own re-check reminder.
- `Dashboard.tsx`: 45+ legibility — smaller phone illustrations, stronger secondary contrast,
  shorter guidance, 清除所有資料 isolated in its own warning area.
- `PRD.md`: NORTHSTAR restated as "no health record stored off the device".

## Verify
- Unit-level: Chinese numerals parse (「一百五十二」→152, 「二十五點三」→25.3); 31 Aug + 6 months → 28 Feb.
- In-browser: 152/78 saves under the local date, grades 高血壓（第一期）・單純收縮期高血壓, and the
  re-check reminder 2027年3月19日 rebuilds from history after reload. Stored data unchanged.
