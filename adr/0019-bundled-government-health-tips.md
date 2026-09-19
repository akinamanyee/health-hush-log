# ADR 0019 — Health tips distilled from government articles and bundled as constants

**Date:** 2026-09-19 HKT
**Status:** Accepted

## Context

M18's rich summary needs actionable health tips with credible source links. The app must not
fetch external content at runtime (local-first, no network dependency beyond the AI call),
and the AI must not invent URLs or medical advice outside the bundled reference material.

## Decision

Distil 16 Hong Kong government health articles (from CHP, Change4Health, StudentHealth, FHS,
OSHC) into a `TIPS_REFERENCE` constant in `charts.ts`: 6 topic blocks, each with a ~150-word
tips string and a sources array of `{ title, url }`. The topics are: cardiovascular disease /
stroke, BMI / weight management, hypertension, visceral fat, healthy diet, and daily exercise.

`selectRelevantTips()` pre-filters topics by the user's grades before sending to the AI, so
the prompt stays focused and within token budget. Source URLs are validated after generation:
any URL the AI returns that is not in the known set is stripped.

## Options rejected

1. **Fetch articles at runtime** — adds a network dependency, latency, and the risk of link
   rot or content changes breaking the grounding check. Contradicts the local-first principle.
2. **Let the AI choose tips freely** — the AI would hallucinate URLs and invent advice outside
   the reference material, violating the grounding constraint.
3. **Store articles in a database** — there is no database; all reference material is bundled.

## Consequences

- `TIPS_REFERENCE` is append-only: new articles are added, existing ones are not removed.
- Source URLs must be re-checked periodically (government sites do restructure).
- The AI prompt receives only the pre-filtered subset, keeping token usage proportional to
  the number of relevant topics rather than the full library.
