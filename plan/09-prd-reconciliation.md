# Plan 09 — Reconcile the code back to the PRD

Date: 2026-09-16 (HKT) · Status: delivered

A line-by-line reconciliation of the PRD against the shipped code found six items that broke
either the northstar (no medical data leaving the device) or the success demo. Fixed in this
order, highest risk first.

1. **Restore `PRD.md`** to the project root as the single source of truth for scope.
2. **Stop the summary posting readings.** Replace the `{ entries, age, gender }` payload with
   `{ items: [{ module, grades[] }] }`; tell the model it will not see numbers. Verify by
   reading the actual request body in the browser.
3. **Standing notices on the module pages.** Move the disclaimer and the local-only notice
   into a permanent footer in `RecordModule.tsx`, not a toast.
4. **Grade body composition.** Add `gradeBmi`, `gradeBodyFat`, `gradeVisceralFat` to
   `charts.ts` and extend the leaflet text with the same bands.
5. **One reader, one grader.** Add `readEntries()` to `store.ts` and `gradeEntry()` in a new
   `grade.ts`; route the form, the export and the summary through them.
6. **Don't burn AI quota on failures.** Increment the counters after a successful call.

## Verification
Type check clean; build OK. Browser-verified: the summary request carries only grade labels;
body composition grades as 過高／過高／偏高 for 25.6 BMI, 28% fat, level 12; the export has a
populated 評級 column with a BOM; both notices appear on all four module pages and the
summary page.
