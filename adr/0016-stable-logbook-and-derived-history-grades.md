# 0016 — Stable logbook destination and derived history grades

Date: 2026-09-19 (HKT) · Status: accepted

## Decision
The cover stays at `/`, while `/logbook` is the stable four-module destination. Module, summary
and error returns point there. Historical grades are recalculated through `gradeEntry()` when
displayed rather than duplicated in storage. All four modules share the same photo-reading path,
and the supplied illustrations use contained, equal-sized presentation.

## Why
The user must not lose either the grade or their place after saving. Deriving grades preserves
one grading authority and keeps all existing local records valid without migration.

## Consequences
The local entry schema and storage keys remain unchanged. Privacy terms move into a cover link,
and the interior palette follows the supplied mint-and-navy cover.