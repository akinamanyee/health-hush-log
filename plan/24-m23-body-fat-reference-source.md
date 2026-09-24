# M23 — 體脂率參考標準 (Body-fat reference source and static HA table)

**Milestone value:** the Tanita summary card for 體脂率 (which by policy shows
「無適用參考標準」 because the app collects no gender or age) now sits alongside
(a) a grounded tips topic sourced from the Hong Kong Hospital Authority's
public "我的體重是否在健康範圍內呢？" article, and (b) a static, collapsible
標準脂肪量 reference table sourced from the same article. Users can consult
the reference table (兩性 × 兩個年齡段) to self-classify — the app itself
still refuses to grade because it collects nothing personal.

## Traces

- PRD USER JOURNEY 7 (「plain-language health summary built strictly from the
  bundled reference leaflets」)
- PRD NORTHSTAR (trustworthy — pointer to authoritative reference, not silence)
- PRD HARD CONSTRAINTS (Grounded AI Advice — extending the bundled leaflet
  with one more source)

## New principle established this milestone

**Static reference material ≠ AI-generated advice.** Static tables published
by an authoritative source may contain gender-and-age-grouped data because
they invite the user to self-classify; AI-generated content must remain
neutral. See `adr/0025-static-reference-vs-ai-advice.md` for the full
decision, options rejected, and consequences.

## Scope

Three files touched. One new ADR. One new topic entry, one new agency, one
new selectRelevantTips branch, one static table component.

| File | Change |
|---|---|
| `src/lib/health/charts.ts` | Extend `Agency` union with `"醫管局"`. Append `TIPS_REFERENCE` entry `topic: "體脂率參考標準"` (gender-neutral tips text, HA article as source). Add one gender-neutral line to `REFERENCE_LEAFLET` mentioning that the app shows the HA reference table. |
| `src/lib/health/ai.functions.ts` | In `selectRelevantTips`, add `if (n === "體脂率") topics.add("體脂率參考標準")`. |
| `src/routes/summary.tsx` | Add a `<details>` collapsible titled 「查看標準脂肪量對照表（醫管局）」 rendered under 體脂率 cards. Two rows only — 18-29歲 and >30歲 (drop 運動員 row per builder decision). All four gender columns shown. Source line credits 醫管局 with the article URL. |
| `adr/0025-static-reference-vs-ai-advice.md` | NEW — records the "static reference vs AI advice" principle. |
| `DECISIONS.md` | One new index row for ADR 0025. |

## Non-obvious calls (disclosed)

- **`運動員` row dropped from the static table.** Builder decision per user
  instruction. The two age-bucket rows remain (18-29歲, >30歲) for both
  genders. Comment in the JSX explains why the row is intentionally absent
  so a future contributor doesn't "restore the missing row".
- **HA table's specific percentages are NOT added to `REFERENCE_LEAFLET`.**
  Adding them would let AI cite specific ranges without gender labels
  (「14-20%」 slipping past the sensitive-word filter). Keep the numbers
  strictly in the static JSX; AI knows only that "standards vary by gender
  and age; the app shows a reference table".
- **`<details>` (native disclosure) over a custom toggle.** No new state,
  accessible by default, respects the design principle of using native
  elements for a 50+ audience.
- **Table sits under 體脂率 cards only, not other cards.** Scope boundary:
  the HA article also has 標準腰圍 (gender-specific waist), but our app
  doesn't have a waist card. If a waist module is ever added, we revisit.
- **Sensitive-word filter (`SENSITIVE_LABEL_PATTERN`) is unchanged.** The
  filter applies to AI output only; static JSX rendered by our code is
  not AI output. Filter continues to correctly protect AI content while
  allowing the reference table.
- **New agency 醫管局.** OSHC (also a statutory body, not a government
  department) is already listed under 「香港特別行政區政府公開衞生資料」;
  HA fits the same category, no wording change to the credit line.
- **Comment near the table JSX**: explicitly notes "the words 男士/女士 in
  this table are intentional static reference from HA, not AI-generated
  content; do not remove per the sensitive-word rule (ADR 0024 applies to
  AI output only; ADR 0025 governs static reference)."

## The new topic (exact content)

```
{
  topic: "體脂率參考標準",
  tips: `體脂率健康範圍要點：(1) 體脂率的健康範圍會因性別及年齡而異，並非單一數值；醫管局及世衞太平洋建議提供性別和年齡分組的參考範圍，宜對照醫管局提供的對照表（本應用程式已在體脂率卡片下方展示）。(2) 體脂率過高與心血管疾病及代謝綜合症風險相關。(3) 中央肥胖（腰腹脂肪多）比整體超重對心血管及糖尿病風險更高，宜同時留意腰圍。(4) 每天最少30分鐘中等強度運動、少油少糖飲食有助控制體脂。`,
  sources: [
    { title: "我的體重是否在健康範圍內呢？", url: "https://www3.ha.org.hk/dic/gn_06_04.html", agency: "醫管局" },
  ],
},
```

## The new REFERENCE_LEAFLET line

To be inserted at the end of the existing 【身體成份分析儀參考】 block or
as a new 【體脂率參考】 line. Draft: 「體脂率標準因性別及年齡而異，本應用程式
在體脂率卡片下方展示醫管局公開的標準脂肪量對照表供用家自行對照，但因不
收集性別及年齡而不進行分級。」

No gendered numbers in the leaflet line. `allowedNumbers` remains clean.

## PRD / system reconciliation

- **PRD SSOT alignment.** HARD CONSTRAINT 「AI summary may use the bundled
  reference leaflet text and nothing else」 — extending the bundled material
  with one more authoritative source (HA). USER JOURNEY 7 fully aligned.
  No PRD line prohibits static tables under cards.
- **Duplicated state / parallel data.** None. Append to `TIPS_REFERENCE`,
  one new type-union member, one new `selectRelevantTips` branch, one new
  static JSX component fed by a constant local to summary.tsx.
- **Broken existing features.** None. Grade.ts, storage, other cards, tips
  section, empty-tips retry, card-name filter, wire whitelist, sensitive-
  word check — all untouched.
- **Schema / table changes.** `Agency` union widens by one string literal
  — type change, not data change. No stored entries touched. No migration.
- **Access model.** Nothing new leaves the device. AI prompt gains one
  topic block; wire payload unchanged; AI output filtered by existing
  checks.
- **HARD CONSTRAINTS** (all preserved): Local-first · AI never grades ·
  No extrapolation (card still 「無適用參考標準」) · Review before save
  (n/a) · Credentials server-side · Only two things reach server ·
  Dates never leave device · Grounded AI (extended) · TC · Disclaimer ·
  Deterministic grading · Daily AI cap · Japanese-minimalist visual system.
- **ADRs** all preserved and one added:
  - 0015 (no gender/age collection): honored; the app still doesn't grade.
  - 0019 (append-only tips): honored (pure addition).
  - 0023 (gender-neutral AI content): honored; the sensitive-word check
    still filters AI output.
  - 0024 (agency-only display, sensitive-word check): honored; the check
    remains on AI output only.
  - 0025 (NEW) — formalizes the static-reference-vs-AI-advice principle.

## Risks I considered and mitigated

- **AI cites gendered specifics from its own training even though our
  tips text doesn't quote them.** `allowedNumbers` doesn't include the
  table percentages; sensitive-word filter rejects `男士/女士` labels.
  Both fire on any leak; existing retry.
- **A future contributor "cleans up" the static table thinking it violates
  ADR 0023/0024.** JSX comment + ADR 0025 both explicitly permit it.
- **Users with only 體脂率 recorded now see a topic-relevant tips block
  instead of the generic fallback.** Strict improvement.
- **Screen space on a small phone.** `<details>` starts collapsed; users
  who don't need the table don't see it.
- **醫管局 in the credit block reading oddly.** Already parallel to OSHC
  (statutory body); wording holds.

## Verification

1. `npx tsc --noEmit` clean.
2. `bun run build` clean.
3. Runtime: exercise `selectRelevantTips` with (a) only 體脂率 card,
   (b) all Tanita cards, (c) BMI only — new topic present in (a) and (b)
   but not in (c).
4. Runtime: exercise `richGroundingFailure` with a mock AI output that
   writes `17%` (not in allowedNumbers) and one that writes `男士` —
   both correctly rejected.
5. Post-deploy on phone: record Tanita with `bodyFat` → generate summary
   → 體脂率 card shows the collapsible 「查看標準脂肪量對照表（醫管局）」;
   tapping opens the 2-row × 2-gender table with the HA URL; tips
   section includes at least one body-fat tip citing 醫管局.

## Living-docs impact on ship

- `CHANGELOG.md` — one dated entry.
- `Product_Roadmap.md` — M23 block appended below M22; status advanced
  when live.
- `plan/24-m23-body-fat-reference-source.md` — this plan.
- `adr/0025-static-reference-vs-ai-advice.md` — NEW ADR.
- `DECISIONS.md` — one new index row for ADR 0025.
- `ARCHITECTURE.md` — no data-flow shift; not required.
- `PRD.md` — no deviation.
