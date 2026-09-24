# M26 — 體脂率卡片略去 grade badge：避免與下方 TANITA 對照表自相矛盾

**Status:** approved 2026-09-24 · builds on M25

## Goal

Stop rendering the 「無適用參考標準」 grade badge chip on the 體脂率
summary card. After M23-M25 there is now a full TANITA reference
matrix rendered directly under the card, with a value-overlay
highlighting the user's own reading in every column — telling the
user in three chips-worth of pixels that no reference exists while
those very reference numbers sit two lines below is confusing.

## Non-goals

- Grading logic. `gradeEntry` / `interpretCard` still refuse to
  classify 體脂率 without gender/age; the `BandGrade` payload still
  carries `"無適用參考標準"`. Only the visual badge chip is skipped.
- Other cards' badges (BP, BMI, 內臟脂肪, 手握力, 坐地前伸, other
  Tanita metrics). Their behaviour is unchanged.
- Any new user input, storage, wire payload, or AI grounding change.
- The AI-generated card interpretation text (which naturally reads
  「目前無單一適用標準」 or similar — leaves the "no classification"
  message in prose form).

## PRD alignment

PRD L51 previously said: 「the app says 「無適用參考標準」」 whenever a
chart doesn't cover the user. That worked before M23, when we had
no in-app reference table. After M23-M25 we have one, so the
literal sentence became misleading. This milestone:

- Updates PRD L51 with an Exception clause specifically for cards
  that carry an in-app static self-lookup reference table (currently
  only 體脂率), permitting the badge chip to be omitted for those.
- Preserves PRD L13/L50 (no gender/age collected — unchanged).
- Preserves PRD L51's underlying intent (the app never grades a
  reading it lacks the inputs for; `gradeEntry` behaviour untouched).

## File changes

### `src/routes/summary.tsx`
- Gate the `<GradeBadge>` render with `card.name !== "體脂率"`.
- Inline comment explains the reason and points to ADR 0025 Source
  change history + PRD L51 footnote.

### `PRD.md` L51
- Add an Exception sentence for in-app self-lookup reference tables.

### `adr/0025-static-reference-vs-ai-advice.md`
- Append a new entry under Source change history recording M26 badge
  omission and the PRD L51 Exception clause.

### `Product_Roadmap.md`
- Append M26 entry after M25 in the same shape as M20-M25.

### `CHANGELOG.md`
- Add M26 delivery entry.

## Design decisions (disclosed)

1. **Gate at render, not at data.** `match.grade` and `match.tone`
   remain populated on the CardInterpretation object — visible to
   any downstream consumer (currently: none). Skipping in JSX keeps
   the SSOT intact and makes the exception trivially reversible.
2. **`card.name === "體脂率"` literal check.** Only 1 card qualifies
   today. A `hasStaticReferenceTable` predicate would be over-abstract
   for one caller. If a second such card appears (BMR, 體內水分 …),
   promote to a predicate then.
3. **AI interpretation text left alone.** The 「目前無單一適用標準」
   phrasing naturally emerges from the leaflet; changing it risks
   destabilising grounded output. UI removal is enough.
4. **`note` field on the CardInterpretation (「無適用參考標準（需要
   年齡及性別）」) stays.** Not rendered in summary.tsx today; keeping
   it preserves the machine-readable signal for future callers.

## Risks & already-decided fixes

| Risk | Fix |
|---|---|
| Without a badge, users mistake M25 ★ highlights for the app's own grade | Mitigated by (a) legend text under the table clearly saying 「請於男/女表中，找你性別及年齡對應的欄」, (b) the AI interpretation text still conveys "no single applicable standard", (c) the disclaimer chrome across every screen. |
| PRD L51 literal wording no longer 100% covers 體脂率 | Fixed in-place with an Exception clause; L51's intent (deterministic grading, no extrapolation) remains authoritative. |
| Future contributor removes the `card.name !== "體脂率"` guard "for consistency" | Inline comment explains why + points to ADR 0025 + PRD L51 footnote. |
| Downstream consumers of `card.grade` break | None exist in JSX today; only summary.tsx reads it, and the field is still there. |

## Acceptance

1. `bun run typecheck` (tsc --noEmit) clean.
2. `bun run build` clean.
3. `/summary` on phone → 體脂率 card renders **without** the
   「無適用參考標準」 chip. Value, date, AI interpretation,
   `<details>` disclosure, TANITA tables, ★ highlights, legend
   line — all still render.
4. Other cards (BP, BMI, 內臟脂肪, etc.) still show their grade
   badges unchanged.
5. No storage, CSV, wire payload or AI prompt change (verify by
   diff: only summary.tsx JSX + PRD/ADR/roadmap/changelog text).
