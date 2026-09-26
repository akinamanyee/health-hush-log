# ADR 0025 — Static reference material may be gender/age structured; AI-generated content may not

**Date:** 2026-09-24 HKT
**Status:** Accepted
**Extends:** ADR 0015 (no gender/age collection), ADR 0023 (gender-neutral tips),
ADR 0024 (agency-only attribution + sensitive-word check on AI output)

## Context

M23 adds the Hospital Authority's public 標準脂肪量 table under the 體脂率
summary card. The table is structured by gender × age bucket (女士/男士 ×
18-29歲/>30歲/…). ADR 0023 established that health tips must be gender-
neutral, and ADR 0024 filters `男士/女士/長者/學生` from AI output — the
table appears to contradict both.

Without a formalized distinction, a future contributor grepping the codebase
for `男士` to "remove the leak" could delete the intentional static table.
Reviewers cannot tell whether the table is a bug or a design decision.

## Decision

**Static reference material published by an authoritative external source may
contain gender- and age-grouped data; AI-generated content may not.**

Concretely:

- **Static reference material** (JSX literals or constant strings rendered as-is
  by our code, sourced from a named authoritative publisher such as HA, DH, CHP,
  OSHC) may include the words 男士, 女士, 長者, 學生 and gendered numeric ranges,
  provided the material is shown in full (all rows / all buckets visible), attributed
  to the source, and never used to programmatically classify the user's own reading.
- **AI-generated content** (tips text, card interpretations, disclaimers written by
  the model) continues to be filtered by `SENSITIVE_LABEL_PATTERN` for those four
  words and by `allowedNumbers` for invented figures. The AI cannot echo a
  gender-specific number even if the underlying source lists one, because those
  numbers deliberately never enter `REFERENCE_LEAFLET` or the tips text sent to
  the AI.
- The user's own card grade continues to say 「無適用參考標準」 for measurements
  the app cannot ground without gender/age (ADR 0015 unchanged). The static
  reference table lets the user self-classify; it does not let the app classify.

## Options rejected

1. **Refuse to show the HA table because it contains gender labels.**
   Rejected: the app has authoritative public reference material and refuses to
   show it, leaving the user with 「無適用參考標準」 and no pointer. That fails
   NORTHSTAR (trustworthy) without a matching gain in privacy — the table is
   already public, and the user reads it on their own device.
2. **Reduce the table to a gender-neutral summary (e.g. a single averaged range).**
   Rejected: fabricates a number the source doesn't publish; loses the honest
   "standards depend on who you are" message; violates deterministic-grading spirit.
3. **Ask the user for gender/age to filter the table to one row.**
   Rejected: violates ADR 0015 (no profile collection). The point of the static
   table is precisely that it works WITHOUT collecting anything.
4. **Add the table's specific percentages to `REFERENCE_LEAFLET` so AI can cite
   them.** Rejected: expands `allowedNumbers` in a way that lets AI write
   「14-20%」 without a gender qualifier (passes sensitive-word filter, passes
   invented-number check, but misleads the user about which row applies).
   Keep the numbers in the static JSX only.
5. **Formalize this in ADR 0023 / 0024 instead of a new ADR.** Rejected: the
   distinction is a genuinely new principle (static vs generated content
   categories) and deserves its own home. Amending older ADRs would blur their
   record.

## Consequences

- The `SENSITIVE_LABEL_PATTERN` filter continues to apply only to AI output.
  It is NOT applied to static JSX or to constant strings in `TIPS_REFERENCE` or
  `REFERENCE_LEAFLET`.
- New static reference tables added under other cards in the future must
  follow the same rules: (a) come from a named authoritative external source
  with a URL, (b) show all rows / all buckets, (c) never used programmatically
  to classify the user, (d) attributed in-place.
- JSX rendering a static reference table with gendered labels must carry an
  inline comment pointing to this ADR so future contributors do not remove
  it under the wrong ADR.
- ADRs 0023 and 0024 are unchanged in scope — they continue to describe how
  AI-generated content is neutralized. This ADR only adds the parallel rule
  for static reference material.

## Source change history

- **2026-09-26 (M29)** — The self-lookup pattern extends to 坐地前伸
  (6th card). Source: 職安局 5-tier × 5 age bands × 2 genders reach-
  distance norms (cm). Data encoded verbatim in a new file
  `src/lib/health/sitreach.ts`. Same non-runtime-caller policy as
  handgrip (M28) — the classifier `classifySitReach(age, gender,
  distanceCm)` ships but is never called at runtime; the summary card
  renders the full matrix and the user self-identifies. `matchesCell`
  needed no change (its M28 `≤N` / `N-M` / `≥N` branches already cover).
  `gradeEntry` for sit-reach now returns `[]` (mirrors M28a's grip
  pattern), removing the misleading 「無適用參考標準」 label from
  `/sitreach` record page, `/logbook` rows, and CSV grade column;
  `interpretCard`'s sit-reach branch keeps the hardcoded fallback so
  summary-card payload + wire-sanitize are byte-identical. Verbatim
  transcription preserves 2 documented source gaps (男 30-39 @ 30 cm;
  男 60-69 @ 22 cm) which the footer explicitly names. `CARDS_WITH_SELF_LOOKUP`
  and `SELF_LOOKUP_CARD_NAMES` grow from 5 to 6.

- **2026-09-26 (M28)** — The self-lookup pattern extends to 手握力 (5th
  card). Source: **職安局** (Occupational Safety and Health Council) 5-tier
  × 5 age bands × 2 genders norms for combined L+R hand grip (kg). Data
  encoded verbatim in a new file `src/lib/health/handgrip.ts`. 職安局 is
  already in the `Agency` union (ADR 0019), so no principle change to
  government-source grounding; it is used here purely as a static-
  reference source. The classifier function `classifyHandGrip(age,
  gender, combinedKg)` ships in that file but has **no runtime callers**
  by design — PRD L13/L50 forbid programmatic classification without
  collected age/gender, so the summary card renders the full matrix and
  the user self-identifies. The function is kept so a future PRD-authorised
  path (or build-time tests) can classify without re-deriving the boundary
  logic. `matchesCell` in `summary.tsx` gains a new `≤N` branch to handle
  the poor-tier cell format (the middle 3 tiers reuse the existing `N-M`
  branch; excellent reuses `≥N`). Grip field label in `modules.ts` clarified
  to 「手握力（左右合計）」 and AI extraction prompt hint updated so future
  entries are unambiguously combined L+R (old single-hand records remain
  valid numeric data — footer text tells users to re-record with combined
  values if desired; nothing dropped). `CARDS_WITH_SELF_LOOKUP` /
  `SELF_LOOKUP_CARD_NAMES` grow from 4 to 5 entries.

- **2026-09-24 (M27)** — The self-lookup card pattern is extended from
  1 to 4 cards: 基礎代謝率 (BMR, TANITA age×gender kcal reference),
  體內水分 (TANITA gendered % threshold), and 肌少症指數 (SMI, TANITA
  男 ≥7.0 / 女 ≥5.7 kg/m² threshold) all gain in-app static self-lookup
  reference tables with the M25 value-overlay pattern (BMR uses per-cell
  delta rather than tier ★ since TANITA publishes point values, not
  ranges). SMI joins the Tanita record flow as a new optional field on
  the muscle screen (extractable from photo, manually enterable). The
  `CARDS_WITH_SELF_LOOKUP` Set in `summary.tsx` now names all four card
  names, driving both the M26 badge-omission gate and the M27
  wire-payload sanitize (below). PRD L51 Exception clause updated to
  list all four. No specific TANITA numbers enter `REFERENCE_LEAFLET`
  (Option 4 in this ADR still stands).
- **2026-09-24 (M27) — wire-payload sanitize.** For cards in
  `SELF_LOOKUP_CARD_NAMES` (mirrors the client-side Set), the AI wire
  payload's `grade` field is transformed from `"無適用參考標準"` to
  `"請自行對照下方對照表"` and the `note` field is cleared before
  `cardsText` is assembled in `generateRichSummary`. Local
  `CardInterpretation` payload is unchanged (SSOT preserved) — only the
  transient wire representation is sanitized. Reason: with 4 self-lookup
  cards, `「無適用參考標準」` appearing 4× in the AI prompt made prose
  echoes likely, undermining the M26 badge-omission goal on the summary.

- **2026-09-24 (M26)** — The 體脂率 summary card no longer renders the
  「無適用參考標準」 grade badge chip. Rationale: after M23-M25 introduced
  the in-app TANITA reference matrix with per-cell value overlay directly
  under the card, showing a badge that says 「no applicable reference
  standard」 next to those very reference numbers is self-contradictory
  and confuses users. PRD L51 is amended in-place with an Exception clause
  for cards carrying an in-app self-lookup reference table. `gradeEntry`,
  `interpretCard`, `BandGrade`, `note` fields — all unchanged; the grader
  still refuses to classify without gender/age (PRD L13/L50 preserved).
  Only the visual chip is skipped in `summary.tsx`, guarded by
  `card.name !== "體脂率"`.

- **2026-09-24 (M24)** — The static 標準脂肪量 table under the 體脂率 card
  moved from HA (醫管局 2-tier × 2-age) to TANITA `身體組成數據參考指標`
  (5-tier × 3-age × gender). Rationale: users log with a Tanita
  身體組成分析儀 whose on-screen classification is Tanita's own 5-tier
  scheme (消瘦 / 標準健康型 / 標準警戒型 / 微胖 / 肥胖); matching the
  reference table to the scale's own scheme lets users self-classify by
  reading their scale's label directly, without translating between
  classification systems. **AI grounding for 體脂率 tips remains HA**
  (`TIPS_REFERENCE`「體脂率參考標準」 unchanged); the two sources may
  diverge — this ADR's principle explicitly permits static and generated
  content to draw from different authoritative sources. TANITA is cited
  in-place as the reference vendor; no external URL because TANITA
  publishes the reference indicator sheet as product documentation, not
  as a stable public article.
