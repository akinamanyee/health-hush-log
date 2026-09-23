# ADR 0023 — Gender-neutral health tips and reference leaflet

**Date:** 2026-09-23 HKT
**Status:** Accepted
**Supersedes (partially):** ADR 0019's append-only constraint on `TIPS_REFERENCE` sources

## Context

The app does not collect gender (ADR 0015). However, `REFERENCE_LEAFLET` contained male/female
body-fat percentage ranges, and `TIPS_REFERENCE` carried three gender-specific source articles:
a women's-health cholesterol PDF (`fhs.gov.hk/tc_chi/health_info/woman/…`) and two articles
titled「男士健康」. Because the AI summary draws from these materials and the health tips appear
in the structured report, a user of any gender could receive tips traceable to a gendered source,
which is inconsistent with the no-gender-collection policy and potentially embarrassing.

## Decision

Remove all gender-specific content from `REFERENCE_LEAFLET` and `TIPS_REFERENCE` sources:

1. **REFERENCE_LEAFLET body fat**: replace male/female percentage ranges with "正常範圍因性別而異，
   需對照檢查機構提供的性別對照表" — consistent with `gradeEntry()` already returning
   「無適用參考標準」 for body fat.
2. **TIPS_REFERENCE sources**: replace the 3 gendered articles with gender-neutral articles already
   used in other topics (reuse, no new external sources).

This partially overrides ADR 0019's append-only rule for `TIPS_REFERENCE`: sources that conflict
with ADR 0015's no-gender policy are removed rather than kept.

Waist-circumference thresholds that mention both genders together (e.g. "男性腰圍<90厘米、
女性<80厘米") are retained — they present inclusive factual information rather than targeting
one gender.

## Options rejected

1. **Collect gender to apply gendered ranges.** Rejected: breaks ADR 0015, the privacy promise
   ("不會傳送日期、年齡或性別"), and the cover-page wording. Would require UI, storage, and
   grading changes across the app.
2. **Keep gendered sources but hide the source title from users.** Rejected: the source title
   is shown in the structured summary's clickable links — hiding it defeats traceability.
3. **Remove waist-circumference gender mentions too.** Rejected: those thresholds present both
   genders together as factual WHO data and are not embarrassing; removing them loses clinically
   useful information.

## Consequences

- The AI summary can no longer quote specific body-fat percentage ranges (they are not in the
  leaflet). This is correct — the app cannot grade body fat without gender.
- `richGroundingFailure()` has a smaller `allowedNumbers` set, tightening the grounding check.
- Three source URLs are removed from `TIPS_REFERENCE`; all replacements are URLs already proven
  working in other topic blocks.
