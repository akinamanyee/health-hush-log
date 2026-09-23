# ADR 0024 — Agency-only source attribution and sensitive-word grounding check

**Date:** 2026-09-23 HKT
**Status:** Accepted
**Extends:** ADR 0017 (grounding check), ADR 0019 (bundled government health tips), ADR 0023 (gender-neutral content)

## Context

`TIPS_REFERENCE` sources carry article titles from Hong Kong government sites. Some titles
across the DH, CHP and OSHC catalogue use group-specific labels — 男士健康, 女士健康,
長者健康, 學生健康 — that are inappropriate to surface in an app that does not collect gender
or age (ADRs 0015, 0023). Even after replacing the 3 gendered sources in ADR 0023, future
additions could reintroduce the risk. Two leak vectors remained:

1. **Display:** the UI showed `source` (article title) as a clickable link, so titles were
   visible in the URL preview even when the shown text was neutral.
2. **AI output:** the prompt sent article titles to the model as grounding material, and the
   model returned the title verbatim as `source`. The grounding check only rejected invented
   numbers, so a model that quoted a title mid-tip ("根據「男士健康」的建議⋯") would pass.

## Decision

Three changes, tightly coupled:

1. **Add `agency` to each source** in `TIPS_REFERENCE` ("衞生防護中心" | "衞生署" |
   "職業安全健康局"). Titles and URLs remain in the data for traceability and audit but
   never reach the user.
2. **Strip source titles/URLs from the AI prompt.** The model receives topic name + tips
   text only, and returns `{ tip, topic }`. `topic` is validated against the set of topics
   the app pre-selected for this generation.
3. **Extend `richGroundingFailure()`** to reject any output containing 男士 / 女士 / 長者 /
   學生 — a defence in depth in case the model paraphrases those words even without being
   fed the titles.

The UI shows a dynamic credit block at the top of the tips section listing the government
agencies that contributed to this summary, and each tip shows only its topic's agencies as
plain text (no URLs, no article titles).

## Options rejected

1. **Keep titles, blocklist gendered ones at display time.** Rejected: only a display fix,
   the AI could still quote a title verbatim in tip text.
2. **Send titles to the AI but instruct it not to quote them.** Rejected: soft constraint,
   no enforcement — the grounding check would still be the only safety net.
3. **Attribute per-source rather than per-topic.** Rejected: without sending titles the AI
   cannot indicate which specific source it drew from, and per-tip attribution to a distilled
   topic is already a small fiction; per-topic honesty is more accurate.
4. **Show a static "香港政府衞生資料" credit for all summaries.** Rejected: loses the specific
   credibility signal each agency name carries; users recognize 衞生防護中心 as a familiar
   authority.

## Consequences

- `RichSummaryOutput.tips` schema changed from `{ tip, source, url }` to `{ tip, topic }`.
- `RichSummaryResult` type gains an `agencies: Agency[]` field computed server-side.
- The grounding retry prompt now also instructs the model to avoid group labels.
- `validSources` / `validUrls` are replaced by `validTopics` in the parse step.
- No URLs are exposed in the UI; users cannot click through to source articles. If this is
  needed for a future audience (e.g. researchers), reintroduce with a per-tip "查看參考資料"
  fold-out that reveals URLs on demand.
