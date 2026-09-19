# M18 — Rich Health Summary: per-card interpretation + government-sourced tips

## Goal

Replace the current single-paragraph summary with a two-layer output:
1. **Per-card interpretation** — explain what each of the user's 6 metrics means,
   graded against the two bundled reference PDFs (OSHC health check + Tanita index).
2. **Personalised health tips** — actionable advice drawn strictly from 20 named
   HK government articles, selected by relevance to the user's results.

The output must be easy to read, digestible, and actionable for 50+ Traditional
Chinese readers.

---

## Prerequisite: bundle the 20 government articles

The 20 URLs (衞生防護中心, Change4Health, 職安局, 學生健康服務) are not fetchable
from the build environment. **Before the build step**, the user must supply the
article content — as PDFs, pasted text, or screenshots — so we can distill each
into a short actionable-tips block and hardcode it into the codebase (the same
pattern as today's `REFERENCE_LEAFLET`).

The 20 articles group into 6 topics:
| Topic | Articles | Relevant when |
|---|---|---|
| 心腦血管病、中風及預防 | #1–3 | BP elevated or high; visceral fat high |
| BMI（體重管理） | #4–6 | BMI ≥ 23 or < 18.5 |
| 高血壓及預防 | #7–9 | BP elevated or high |
| 內臟脂肪問題與預防 | #10–12 | Visceral fat ≥ 10 |
| 健康飲食（針對過重及高血壓） | #13–16 | BMI ≥ 23 or BP elevated |
| 日常運動（針對預防過重） | #17–19 | BMI ≥ 23; grip/flexibility low |

Article #20 (辦公室鬆弛運動指引) maps to topic 6.

Each article is distilled into ≤ 150 words of actionable Traditional Chinese tips
and stored in a new constant `TIPS_REFERENCE` in `charts.ts`, keyed by topic.
Every tip block carries the article's title and URL as a citation.

---

## The 6 interpretation cards

| Card | Source module | Key fields | Reference table |
|---|---|---|---|
| 1. 血壓 | bp | systolic, diastolic, pulse | OSHC PDF: 成年人血壓水平分類 |
| 2. BMI | tanita | bmi | OSHC PDF: 亞洲成年人 BMI 分類 |
| 3. 體脂率 | tanita | bodyFat | Tanita PDF: age×gender body fat % table |
| 4. 內臟脂肪 | tanita | visceralFat | Both PDFs: visceral fat bands |
| 5. 手握力 | grip | grip | OSHC PDF: age×gender grip table |
| 6. 坐地前伸 | sitreach | distance | OSHC PDF: age×gender sit-reach table |

### Interpretation approach: deterministic + AI narrative

**Phase A (client-side, deterministic):** For each card, look up the user's most
recent entry values and run them through the existing `gradeEntry()` plus new
interpretive text from the bundled PDF tables. This produces structured data:
- The metric name, value, and unit
- The grade label (正常, 偏高, etc.) where available
- The reference range the value falls in
- The recommended follow-up action (e.g. "每6個月檢查一次")
- For cards 3/5/6 that need age×gender: state "無適用參考標準（需要年齡及性別）"
  but still show the value

This structured data is what gets sent to the server — **not** the raw readings
in isolation. The interpretation text is already assembled; the AI's job is to
weave it into a readable narrative and add the tips.

**Phase B (server-side, AI):** The AI receives:
- The 6 structured interpretation blocks (metric + value + grade + range + action)
- The `TIPS_REFERENCE` (topic-tagged tips from the 20 articles)
- Instructions to: (1) write a warm per-card paragraph explaining what each result
  means in plain language, (2) select the relevant topic tips based on the overall
  picture, (3) present 3–5 concrete actionable tips with their source citations.

### Privacy boundary

Values are sent transiently to the server function (same as photo extraction) and
never stored (`store: false`). This is consistent with the existing privacy model.
The change from today: we send values + grades instead of grades only, because the
interpretation needs to reference the actual numbers ("您的 BMI 為 24.5，屬於邊緣
範圍"). The `SummaryInput` schema is updated accordingly.

**Decision needed:** If the user prefers to keep the "grades only" boundary, the
per-card interpretation can be done entirely client-side and rendered as static
text, with only the grades sent to the AI for the tips layer. This trades off
narrative quality (the AI can't reference numbers) for stricter privacy.

---

## Data sent to the AI (proposed schema)

```typescript
const SummaryInput = z.object({
  cards: z.array(z.object({
    name: z.string().max(20),        // e.g. "血壓"
    value: z.string().max(80),       // e.g. "130/85 mmHg" — formatted, not raw
    grade: z.string().max(40),       // e.g. "正常高值血壓"
    range: z.string().max(120),      // e.g. "收縮壓 130–139 或舒張壓 85–89"
    action: z.string().max(100),     // e.g. "建議每6個月檢查一次"
    note: z.string().max(100).optional(), // e.g. "無適用參考標準（需要年齡及性別）"
  })).max(6),
});
```

No dates, no entry history, no age/gender. Each card is one snapshot of the
latest reading, pre-interpreted.

---

## Prompt design

```
你是一位健康紀錄的摘要助手，為50歲以上的繁體中文讀者撰寫易讀的健康報告。

第一部分：逐項解讀
根據以下各項檢查結果，用溫和易懂的語言解釋每項數據代表甚麼意思、
落在甚麼範圍、以及建議的跟進行動。每項約50–80字。

{cards formatted}

第二部分：健康貼士
根據以上結果的整體情況，從以下參考資料中挑選最相關的3–5個具體可行的
健康建議。每個建議須：(1) 具體到可以明天就做，(2) 用一句話說完，
(3) 標明來源。不可加入參考資料以外的建議。

{TIPS_REFERENCE}

最後提醒：以上僅供參考，不能取代醫生診斷（須出現「醫生」二字）。
```

---

## Grounding check (updated)

The current `groundingFailure()` checks that every number in the output exists
in `REFERENCE_LEAFLET`. This needs updating:

1. The allowed numbers set now includes numbers from both `REFERENCE_LEAFLET`
   and `TIPS_REFERENCE`.
2. The user's own values (sent in the `cards` array) are also allowed numbers —
   the AI is expected to echo them back in the interpretation.
3. The "醫生" check remains.

---

## UI changes (`/summary` route)

### Before (current)
- One "生成健康摘要" button → one paragraph of text

### After
- Same button → structured output:
  - **Section 1: 您的健康檢查解讀** — 6 cards in a vertical stack, each showing:
    - Icon + metric name + value + grade badge (reusing `GradeBadge`)
    - 1–2 sentence plain-language explanation
  - **Section 2: 為您挑選的健康貼士** — 3–5 bullet points, each with:
    - One concrete actionable sentence
    - Source link (article title as clickable text)
  - **Footer:** 以上僅供參考，不能取代醫生診斷。
  - `PrivacyNotice` stays at the bottom.

The AI returns structured JSON (not free text), parsed client-side into this
layout. This gives us control over the visual presentation while the AI provides
the narrative content.

### Output schema from AI

```typescript
z.object({
  cards: z.array(z.object({
    name: z.string(),
    interpretation: z.string(),  // 50-80 chars plain language
  })),
  tips: z.array(z.object({
    tip: z.string(),             // one actionable sentence
    source: z.string(),          // article title
    url: z.string(),             // article URL
  })),
  disclaimer: z.string(),       // must contain 醫生
})
```

---

## Files changed

| File | Change |
|---|---|
| `src/lib/health/charts.ts` | Add `TIPS_REFERENCE` constant (distilled from 20 articles); expand `REFERENCE_LEAFLET` with full OSHC + Tanita PDF table text |
| `src/lib/health/ai.functions.ts` | New `generateRichSummary` server function replacing `generateHealthSummary`; new input/output schemas; updated prompt; updated grounding check |
| `src/routes/summary.tsx` | New structured UI with 6 interpretation cards + tips section; reads latest entry per module; builds the `cards` input client-side |
| `src/lib/health/grade.ts` | Add `interpretCard()` helper that returns the structured card data (value + grade + range + action) for a given module's latest entry |
| `src/components/health/PrivacyNotice.tsx` | May need a "summary" variant update to describe the new data sent |

### Files NOT changed
- `store.ts` — no storage changes
- `modules.ts` — no field changes
- `RecordModule.tsx` — no form changes
- `csv.ts`, `voice.ts`, `calendar.ts` — unrelated

---

## Steps

1. **Content gathering** (prerequisite, needs user)
   - User provides content from the 20 government articles
   - Distill each into ≤ 150 words of actionable tips in Traditional Chinese
   - Bundle into `TIPS_REFERENCE` in `charts.ts`

2. **Expand reference tables**
   - Transcribe the full OSHC PDF tables (BP, BMI, grip, sit-reach) into
     `REFERENCE_LEAFLET` or a companion constant
   - Transcribe the Tanita PDF body fat % age×gender table

3. **Build `interpretCard()` in `grade.ts`**
   - Deterministic: value → grade + range + recommended action
   - Works for all 6 cards; returns "無適用參考標準" where age/gender needed

4. **Build `generateRichSummary` server function**
   - New schema, new prompt, structured JSON output
   - Updated grounding check allowing user's own values
   - Same rate limiting and `store: false`

5. **Rebuild `/summary` UI**
   - Structured card layout + tips bullets + source links
   - Reuse `GradeBadge` for grade display
   - Keep the single generate button and loading state

6. **Deprecate old `generateHealthSummary`**
   - Remove once the new function is wired up
   - Old `REFERENCE_LEAFLET` absorbed into the expanded version

---

## Risks

- **Token budget:** The expanded reference material + tips could be large.
  Mitigation: keep each article distilled to ≤ 150 words; send only relevant
  topic tips (pre-filter by the user's grades before sending to AI).
- **Structured JSON output:** The AI might not return valid JSON reliably.
  Mitigation: parse with a try/catch, fall back to the raw text display if
  parsing fails, same as today's plain-text fallback.
- **Age/gender gap:** Cards 3 (體脂率), 5 (手握力), 6 (坐地前伸) cannot be
  fully graded. The interpretation honestly states this. Not a bug — a known
  product constraint (ADR 0005, 0011).
