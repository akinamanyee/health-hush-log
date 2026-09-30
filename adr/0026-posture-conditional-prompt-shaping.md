# ADR 0026 — Posture-conditional prompt shaping from server-derived grade classification

**Date:** 2026-09-30 HKT
**Status:** Accepted
**Extends:** ADR 0019 (bundled government health tips), ADR 0025 (static reference vs AI advice), ADR 0017 (grounding-check after generation)

## Context

Through M18–M41 the summary prompt asked Gemini for a fixed 「3 至 5
條」 concrete tips regardless of the user's actual results. Tester
feedback on M41's live output identified four defects:

1. **「明天就做」** appeared in nearly every tip — a canned-brochure cadence.
2. **模糊字詞** — 「少油少糖」/「中等強度運動」/「保持腰圍」 never quantified.
3. **「參考對照表」 nagging** — the AI kept telling the user to look at
   tables the user was reading right below the tips.
4. **Tone-blind volume of advice** — the same 3-5 tips for a
   fully-normal record and a hypertensive-crisis one; encouragement
   read as scolding, warnings read as background noise.

A single fixed prompt cannot serve both an ALL-fit user (who deserves
brief marginal-improvement encouragement) and a many-metrics-off user
(who deserves explicit risk framing). And a prompt that assumes the
three grading anchors were measured cannot honestly serve a
grip-only session.

## Decision

**The summary prompt carries a server-computed posture block that
scales tone and suggestion count to what the reading actually shows —
never an AI-guessed posture, never a client-controlled one.**

Concretely:

- A helper `bucketByGrade(cards)` runs before prompt assembly and
  returns one of four postures: `no-graded` / `normal` / `few-off`
  / `many-or-crisis`.
- Buckets are derived from only the three cards this app grades
  deterministically without gender/age (血壓 / BMI / 內臟脂肪). All
  other cards (self-lookup Tanita metrics; grip; sit-reach) are
  opaque to the classifier because grading them requires
  gender/age we do not collect (PRD L13 / L51 Exception).
- Each posture selects a specific opening line and suggestion count
  written verbatim into the prompt:
  - `no-graded`: 1–2 neutral daily reminders about what WAS
    measured; explicit ban on 「全部正常」/「全部達標」/
    「有健康風險」 conclusion words so the AI cannot invent facts
    about the three anchors that weren't measured.
  - `normal`: 1–2 gentle encouragement lines; marginal-improvement
    framing; no risk mention.
  - `few-off`: 3–4 concrete neutral suggestions; addresses the
    off items first, then supporting habits.
  - `many-or-crisis`: 4–5 firm suggestions; opens by naming
    concrete health risks (中風 / 心血管 / 糖尿病); reiterates
    the 醫生 disclaimer.
- Chinese numerals only in structural count words (「一至兩條」
  「三至四條」 etc.) so `allowedNumbers` grounding is not polluted
  by prompt-side digits.
- Rules block in the prompt bans, by name, the four defects above:
  「明天就做」, 「參考對照表」, 模糊字詞 alone without their definitions,
  invented numbers.
- Four new named-source `TIPS_REFERENCE` topics carry the concrete
  definitions the ban forces the AI to cite: 中等強度運動定義,
  蔬果攝取量, 減鹽減糖減油定義, 腰圍與中央肥胖. Their numeric
  contents (150 min / 5 g / 25 g / 90 cm / 80 cm) enter
  `allowedNumbers` via `tipsText.match(/\d+/g)`.

## Options rejected

1. **Ask Gemini to self-classify posture from the cards.**
   Rejected: violates ADR 0003 / ADR 0017 (deterministic grading is
   never AI's job). Also unstable — the model would sometimes read
   BP 152/78 as 「正常」 and sometimes as crisis.
2. **Send only the cards and let Gemini decide how many tips to write.**
   Rejected: the tester feedback started here. The AI defaults to a
   uniform 3–5 tips regardless of severity, which is the defect this
   ADR is fixing.
3. **Move posture computation to the client.**
   Rejected: the client already sends `RichSummaryInput` with
   `{ name, value, grade, ... }`; adding a `posture` field would
   duplicate state, invite drift, and let a compromised client
   forge a `normal` posture on a many-off record. Server derivation
   from the same wire-side cards is single-source.
4. **Include self-lookup cards in the bucket.**
   Rejected: their `grade` is 「無適用參考標準」 by design (PRD L13
   / L51). Counting them would smuggle in either a gender/age
   grading (violating L13) or a false 「off」 classification (mis-
   framing every self-lookup card as concerning).
5. **Return `normal` when `graded.length === 0`.**
   Rejected: this was the pre-M42a behavior and produced the exact
   fabricated 「三項可評級指標全部落在正常範圍」 claim on
   grip-only sessions. Fails PRD L23 NORTHSTAR (trustworthy)
   and L52 (grounded AI). `no-graded` is a distinct honest posture.
6. **Hard-gate 「全部正常」 / 「參考對照表」 / 「明天就做」 with
   regex in `richGroundingFailure`.** Deferred, not rejected.
   Current enforcement is prompt-layer only, matching the class of
   other soft rules (sensitive labels are hard-gated; wording
   preferences are prompt-layer). If observed noncompliance
   warrants, a follow-up ADR can move any of these to hard gates.
7. **Finer bucketing (e.g. 5 postures splitting few-off into 1-off
   / 2-off, or separating 3-off from crisis).** Rejected: three
   tone behaviours mapped cleanly to three real buckets plus the
   no-graded honesty branch. More buckets = more thresholds to
   tune and more branches to misclassify. Keep it minimal.

## Consequences

- `bucketByGrade` and the four-branch `bucketBlock` ternary in
  `ai.functions.ts` are now part of the summary contract. Adding a
  new grading-anchor card (a future card the app grades without
  gender/age) requires updating the bucket helper's card-name
  filter AND the branch texts that mention 「三項可評級指標」.
- The BP grade string set (`正常偏高` / `高血壓（第一期）` /
  `高血壓（第二期）` / `嚴重偏高`) and the BandGrade off set
  (`偏高` / `過高` / `過輕`) are hardcoded in `bucketByGrade` — a
  second copy of strings whose SSOT is `BP_TIERS.label` and the
  `BandGrade` type in `charts.ts`. If either is renamed, this file
  silently misclassifies. Flagged as a latent SSOT wart; not
  blocking any milestone but worth a refactor pass when convenient.
- The prompt is now longer per generation (bucket block + rules
  block); token cost per summary rises modestly. No user-facing
  latency change observed.
- Adding a new `TIPS_REFERENCE` topic still requires: (a) named
  Agency source(s) from the existing `Agency` union, (b) inclusion
  in `selectRelevantTips`'s card→topics map, (c) tsc-checked
  topic-name parity between `topics.add(...)` and `TIPS_REFERENCE.topic`.
  See the M42 CHANGELOG entry for the M42 additions.
- No change to `richGroundingFailure` gates, `RichSummaryInput`
  cap, `RichSummaryOutput` shape, `SELF_LOOKUP_CARD_NAMES` sanitize,
  storage envelope, wire fields sent, or any other invariant.

## Source change history

- **2026-09-30 (M42a)** — Added `no-graded` posture. `bucketByGrade`
  short-circuits with `if (graded.length === 0) return "no-graded";`
  BEFORE the `off.length === 0 → "normal"` check. Ordering matters:
  without the early return, empty-graded also has zero offs and
  would fall into `"normal"`, letting the prompt claim
  「三項可評級指標全部落在正常範圍」 for indicators the user never
  measured. New branch text: 「今次紀錄未包含血壓、BMI 或內臟脂肪等
  可評級指標，只有自查對照的項目。第二部分請就用家實際錄入的項目給
  一至兩條中性的日常提醒⋯切勿使用「全部正常」「全部達標」「有健康風險」
  等結論式字眼。」 8-case simulation passes (empty / grip-only /
  self-lookup-only → no-graded; all M42 branches byte-identical).

- **2026-09-30 (M42)** — Original three-bucket design established:
  `normal` / `few-off` / `many-or-crisis`. Four new named-source
  `TIPS_REFERENCE` topics added (中等強度運動定義 / 蔬果攝取量 /
  減鹽減糖減油定義 / 腰圍與中央肥胖). `selectRelevantTips` extended
  so non-normal 血壓 / BMI / 內臟脂肪 pull the new definition topics.
  Rules block bans 「明天就做」, 「參考對照表」, and vague adjectives
  without their definitions. Explicit allowance for 「男性腰圍」/
  「女性腰圍」 as metric labels (SENSITIVE_LABEL_PATTERN blocks only
  男士 / 女士 / 長者 / 學生, not 男性 / 女性).
