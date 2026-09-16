# 0008 — One reader and one grader

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
`readEntries()` / `useLocalData()` in `store.ts` are the only code that reads stored data,
and `gradeEntry()` in `grade.ts` is the only code that grades. Forms, CSV export and the
summary all go through them.

## Rejected
- **Local inline `localStorage.getItem` parsing plus a local grading helper per screen** (the
  first implementation). Rejected: the export and the summary skipped the version envelope
  and duplicated the grading rules, so the same reading could be graded differently on two
  screens.

## Why
Single source of truth. A grading rule change must land everywhere at once.

## Consequences
New surfaces must import these functions; adding another reader is a defect, not a shortcut.
