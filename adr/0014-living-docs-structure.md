# 0014 — Living docs split by responsibility

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
Four authoritative documents plus the build-planning pair:
`PRD.md` (intent) · `ARCHITECTURE.md` (how the code is built) · `DECISIONS.md` + `adr/NNNN-*.md`
(why) · `CHANGELOG.md` (+ `changelog-archive.md` past ~100 entries) ·
`Product_Roadmap.md` (milestones) + `plan/NN-slug.md` (per-milestone build plans).
README and any other doc are derivative and must never contradict these.

## Rejected
- **One combined document.** Rejected: intent, structure, rationale and history change on
  different rhythms, and a single file grows unbounded and gets skimmed instead of read.
- **A single monolithic decisions file or plan file.** Rejected: at scale they become too
  large to load or maintain; one small file per decision and per milestone stays readable.
- **Leaving history in the assistant's scratch plan files.** Rejected: that store is
  transient and gets overwritten; history belongs in the repository.

## Why
Each fact has exactly one home, and no document grows without bound.

## Consequences
Every change touches the changelog; every non-obvious call gets an ADR and one index line.
