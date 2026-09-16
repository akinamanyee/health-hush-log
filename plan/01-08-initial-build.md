# Plan 01–08 — Initial build (M1 … M8)

Date: 2026-09-16 (HKT) · Status: delivered

Milestones M1 through M8 of `Product_Roadmap.md` were built in a single pass, in roadmap
order, each leaving the app usable.

## Work, in order
1. **Shell (M1)** — design tokens and `glass-card` in `src/styles.css`; Noto Sans/Serif TC via
   the root route head; 18px base type, min-h-14 touch targets; dashboard `src/routes/index.tsx`
   with profile inputs and four module cards; standing privacy and disclaimer notices.
2. **Blood pressure (M2)** — `charts.ts` tiers with the worse-of-two rule and the
   isolated-systolic test; `store.ts` versioned storage with a hydration gate;
   `RecordModule.tsx` as the shared record-and-review form with history and a trend chart.
3. **Calendar (M3)** — `calendar.ts`: tier → interval, `.ics` builder and download, Google
   Calendar link; crisis tier renders 即時就醫 with no calendar block.
4. **Remaining modules (M4)** — grip and sit-and-reach matrices plus body composition fields
   in `modules.ts`; thin route wrappers per module.
5. **Photo reading (M5)** — `ImageDrop.tsx` downscales to ≤1600px JPEG in the browser;
   `ai.functions.ts` `extractFromImage` validates the data URL and module, uses a strict zod
   schema with nullable fields, and returns Traditional Chinese errors; values land in the
   review form for confirmation.
6. **Voice (M6)** — `VoiceButton.tsx` feature-detects speech recognition and maps spoken
   numbers into the form fields in order.
7. **Export (M7)** — `csv.ts` with a UTF-8 BOM; two-step clear-all on the dashboard.
8. **Summary (M8)** — `summary.tsx` plus `generateHealthSummary`, grounded strictly in
   `REFERENCE_LEAFLET`, failing visibly instead of inventing advice.

## Verification
Type check clean; build OK; browser-verified: 152/78 grades 高血壓（第一期）・單純收縮期高血壓
with a 6-month re-check, a synthetic Tanita screen photo fills all five fields, CSV opens with
legible Traditional Chinese, and the summary reflects the actual records.

## Follow-ups found afterwards
See [plan/09-prd-reconciliation.md](09-prd-reconciliation.md).
