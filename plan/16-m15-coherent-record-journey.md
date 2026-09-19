# M15 build plan — 清楚而連貫的紀錄旅程

Delivered 2026-09-19 15:56 HKT · [ADR 0016](../adr/0016-stable-logbook-and-derived-history-grades.md)

## Intent
The core journey stays understandable after the first save: the grade does not disappear, the
illustrations load, every module accepts a photo, and "back" always means 健康紀錄簿.

## Build
- Add `/logbook` as the dashboard's own destination (`src/routes/logbook.tsx`,
  `src/components/health/Dashboard.tsx`); point module, summary, 404 and failure returns there
  instead of replaying the cover.
- Derive the history grade at display time from the single grader (`gradeEntry()`) inside
  `src/components/health/RecordModule.tsx` — no grade is stored, so no parallel truth.
- Extend validated photo extraction and the editable review step to 手握力 and 坐地前伸測試
  (`src/lib/health/ai.functions.ts`, `modules.ts`).
- Replace the four dashboard illustrations with the supplied images; move the cover's privacy
  terms behind a visible link; translate error shells to Traditional Chinese; align interiors with
  the cover's mint-and-navy palette.

## Verify
- Dashboard shows four uncropped illustrations, saved history shows its grade badge, a module page
  returns to 健康紀錄簿, and 手握力 offers camera/upload. Confirmed in-browser.
