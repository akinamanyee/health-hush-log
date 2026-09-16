# 0011 — CSV carries a UTF-8 BOM and a grade column

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
Export writes a UTF-8 BOM, quotes every field, and includes a 評級 column. A module-wide
grade (e.g. blood pressure) is written on the module's primary field only; per-metric grades
(BMI, 體脂率, 內臟脂肪等級) sit on their own rows. Ungraded fields leave the cell empty.

## Rejected
- **Plain UTF-8 with no BOM.** Rejected: Excel renders Traditional Chinese as mojibake.
- **Repeating the module grade on every row.** Rejected: it implies 脈搏 was graded when it
  was not.
- **Omitting grades from the export.** Rejected: the grade is the interpretation worth keeping.

## Why
The export must open cleanly in Excel and mean exactly what it says.

## Consequences
Row count equals recorded fields, not entries; a doctor reading the file sees which numbers
carry a grade.
