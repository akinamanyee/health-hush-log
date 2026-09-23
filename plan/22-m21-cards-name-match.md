# M21 — 可信的摘要卡片 (Cards always render name, value, grade, date)

**Milestone value:** `/summary` guarantees a full-shape card for every saved
reading it interprets — the card's name, value, colored grade badge, recording
date and AI interpretation all render together. Even when the AI paraphrases
the name field (as observed: 「血壓」 → 「血壓及脈搏」), the summary is
returned only after every card's name matches exactly what the user's saved
reading is called.

## Why this is the next milestone

Peer-review of the M20 deploy discovered that Gemini can rename a card in its
response (e.g. echo `name: "血壓及脈搏"` where we sent `name: "血壓"`).
`summary.tsx:117` uses `cardMap.get(card.name)` — a strict string lookup —
so a drifted name resolves to `undefined`, and every `{match && …}` /
`{match?.recordedAt && …}` short-circuits. Value, grade badge, AND date all
silently disappear from the card. This has been latent since M18 (structured
summary); M20's date line simply made it visible.

## Traces

- PRD USER JOURNEY 4-5 (「grades the reading」, 「saved record with the full
  recording date including year」)
- PRD SUCCESS demo (BP 152/78 → 「高血壓（第一期）・單純收縮期高血壓」 with
  recheck date; every saved record shows date-with-year)
- NORTHSTAR (trustworthy)
- HARD CONSTRAINTS (deterministic grading — the grade MUST be visible)

## Scope

One file: `src/lib/health/ai.functions.ts`. Four coordinated changes that
mirror the empty-tips retry pattern already in this file.

### Change 1 — Card-name filter in `parseOutput`

Build `validCardNames = new Set(data.cards.map(c => c.name))`. After
`RichSummaryOutput.parse(raw)`, `parsed.cards = parsed.cards.filter(c =>
validCardNames.has(c.name))`. Symmetric to the existing tips filter one line
above.

### Change 2 — Grounding failure when cards drop

`richGroundingFailure(output, allowedNumbers, expectTips, expectedCardCount)`
gains a fourth parameter. After the existing checks, if
`output.cards.length < expectedCardCount`, return
`"卡片解讀未對應項目名稱"`. Trips the existing single strict retry — no new
retry loop invented. Both call sites in the same file updated.

### Change 3 — Retry prompt tightening

Add to the existing retry-prompt string:
`cards 陣列中每項的 name 欄位必須完整照抄輸入的項目名稱（例如「血壓」而非
「血壓及脈搏」，「BMI」而非「BMI 體重」），不可加減字元或加描述。`

### Change 4 — Base prompt tightening (preventive, raises first-try success)

Add one line to the base prompt:
`每項解讀的 name 欄位必須與所示項目名稱完全一致（照抄「血壓」、「BMI」、
「體脂率」、「內臟脂肪」、「手握力」、「坐地前伸」六者其一），不可加減字元。`

## Non-obvious calls (disclosed)

- **Server-side strict filter over client-side fuzzy match.** Client-side
  prefix/includes matching hides the contract violation and risks false
  positives (「血壓」 prefix-matches multiple things). Mirrors the tips
  pattern.
- **Retry-once, then hard fail** with the existing toast. Same policy as the
  tips fix. Two attempts is enough for a transient AI drift.
- **Keep `name` in the AI response schema.** Alternatives (drop name, match by
  index) trade clarity for compactness and are fragile if the AI reorders.
- **Base prompt enumerates the six legal names.** Concrete enumeration raises
  first-try success materially over a generic "match input names" instruction.
- **`expectedCardCount = data.cards.length`** rather than one-for-one name
  matching. Duplicate names in AI output would fail Set membership on the
  second occurrence anyway; count check catches drift and duplication.

## PRD / system reconciliation

- **PRD SSOT alignment.** USER JOURNEY 4-5 and SUCCESS require grade + date
  visible on saved readings. Screenshot 2 (peer review) proved the current
  build fails this on the summary card. This restores compliance.
- **Duplicated state / parallel data.** None. `validCardNames` is derived at
  request time from the same input the AI sees.
- **Broken existing features.** None. `grade.ts`, storage, tips flow,
  sensitive-word check, empty-tips retry all untouched. `richGroundingFailure`
  signature gains one parameter — both call sites updated in the same file.
- **Schema / table changes.** None. localStorage untouched. No migration.
- **Access model.** Nothing new leaves the device. The prompt gains textual
  tightening; the wire payload is unchanged (M20-fix's whitelist still
  applies); the AI response schema is unchanged.
- **HARD CONSTRAINTS** (all preserved): Local-first · AI never grades · No
  extrapolation · Review before save · Credentials server-side · Traditional
  Chinese · Disclaimer · Deterministic grading (this fix RESTORES visible
  grade rendering) · Voice / daily AI cap · Japanese-minimalist visual
  system.

## Risks I considered and mitigated

- **AI still drifts after retry** → toast fails visibly with existing
  「摘要未通過內容核對」 error; user can regenerate.
- **AI returns MORE cards than input** → filter drops extras; count check
  only fires when survivors < input.
- **Extra retry against daily cap** → at most one extra call; `bumpAiUsage`
  still fires only on final success (unchanged behaviour).
- **`richGroundingFailure` signature change** → both callers in the same
  file, both updated in the same edit; type-check enforces alignment.
- **`data.cards.length` bound** → `RichSummaryInput.cards.max(6)` already
  caps input; expectedCardCount ≤ 6.

## Verification

1. `npx tsc --noEmit` — must be clean.
2. `bun run build` — must be clean.
3. Runtime: exercise the exact `parseOutput` + `richGroundingFailure` shape
   with a drifted AI response (`name: "血壓及脈搏"`) — filter drops it,
   grounding returns the new reason.
4. Post-deploy on phone: BP 140/88 → generate → card shows name「血壓」,
   value「140/88 mmHg…」, grade badge「高血壓（第一期）・單純收縮期高血壓」,
   date「2026年9月23日 記錄」, interpretation.

## Living-docs impact on ship

- `CHANGELOG.md` — one dated entry that calls out this is a latent M18 bug
  M20 exposed.
- `Product_Roadmap.md` — M21 block appended; status line advanced when live.
- ADR — none needed (extends the tips filter/retry pattern established by
  ADR 0024's spirit).
- `ARCHITECTURE.md` — no data-flow shift.
- `PRD.md` — no deviation.
