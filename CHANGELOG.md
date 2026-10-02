# Changelog

What changed, when, and why. Newest first. Times are Hong Kong Time (UTC+8).
Once this file passes ~100 entries, the older half moves to `changelog-archive.md`
(append-only). Entries here are written when the change is made, not reconstructed later.

## 2026-10-02 17:31 HKT — M46 delivered: Open Graph share-link preview card

- **New static asset:** `public/images/og-cover.jpg` — 護心 logo attached by user, 1254×1254 JPEG, 185KB. Dimensions and file size both inside WhatsApp's limits (≥300×300, ≤600KB) and Facebook's recommended minimums (≥200×200 for summary card). Served by Vite's static handler at `https://heartcaring.fit/images/og-cover.jpg`.
- `src/routes/__root.tsx`: appended 9 new meta entries after the existing `og:type` entry:
  - `og:url` → `https://heartcaring.fit/`
  - `og:site_name` → `健康紀錄簿`
  - `og:locale` → `zh_HK`
  - `og:image` → fully qualified absolute URL to the logo
  - `og:image:width` → `1254` ; `og:image:height` → `1254`
  - `og:image:alt` → `護心 — 健康紀錄簿標誌`
  - `twitter:image` → fully qualified absolute URL to the logo
  - `twitter:image:alt` → `護心 — 健康紀錄簿標誌`
  - Pre-existing `og:title` / `og:description` / `og:type` / `twitter:card="summary_large_image"` unchanged.
- `src/routes/blood-pressure.tsx`, `src/routes/grip.tsx`, `src/routes/sit-and-reach.tsx`, `src/routes/tanita.tsx`: each gains one `og:url` entry pointing at its own canonical URL (`/blood-pressure`, `/grip`, `/sit-and-reach`, `/tanita`). Root's `og:image` / `og:site_name` / `og:locale` / `twitter:image` / `twitter:card` inherit automatically via TanStack Start's property-keyed meta merge; per-route `og:title` / `og:description` already override root.
- Rationale: user asked for a WhatsApp / social media share preview card so a shared heartcaring.fit link shows up in group chats with the 護心 brand mark instead of as a bare link. Previously the root route carried og:title / og:description / og:type / twitter:card but **no og:image** — meaning preview scrapers found no thumbnail and most apps skipped the preview altogether.
- Design decisions: (1) ship the user's logo as-is (1254×1254 square) rather than compose a 1200×630 branded card with text overlay — the user attached the logo, we honour that choice; richer composition can be M46a if desired later. (2) absolute URLs for every image reference — OG spec requires absolute; relative URLs break on half the scrapers. (3) `og:locale = zh_HK` to tag the Hong Kong Chinese variant correctly (Facebook accepts; others ignore unknown locales gracefully). (4) per-route og:url only for the four module routes that get shared; `/summary` and `/logbook` are per-user-data pages nobody shares externally, so falling back to the root canonical is coherent. (5) one-line description REUSES the existing root description (「本地優先的健康紀錄簿：記錄血壓、身體成份分析儀、手握力與坐地前伸測試讀數，資料只存在您的裝置上。」) — 繁中, under 100 characters, already carries the privacy half; no new copy needed.
- Untouched: AI prompt layer, grader, SELF_LOOKUP_CARD_NAMES wire sanitize, CARDS_WITH_SELF_LOOKUP badge omission, interpretCard, storage envelope, wire shape, JSON response shape, grounding gates, M42 bucket helper, M43 BMR reader guide, M44 weight-lock, M45 gender captions, every record-page component, every summary-page component, CSV, calendar, favicon.
- PRD alignment: L13/L47 ✓ (static metadata, no tracking); L48 ✓ (preview advertises app not user data); L50 wire byte-identical ✓ (no new server call; static asset); L51 + Exception ✓; L52 grounded AI ✓; L55 繁中 ✓ (including `og:locale = zh_HK`); L57 ✓ (user-supplied brand mark); OUT OF SCOPE ✓ (no analytics / tracking / sync introduced; OG is advertising, not observation).
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean. Asset present at `public/images/og-cover.jpg` 185KB.
- Plan: `plan/50-m46-open-graph-preview-card.md`.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-10-02T17:31:59+08:00`.

## 2026-10-02 16:23 HKT — Living-docs sync after M45

- `ARCHITECTURE.md` — body-composition grading bullet extended with one targeted sentence: every gender-split reference table on `/summary` renders its 「男性 …」/「女性 …」 `<caption>` through the shared `GENDER_CAPTION` constant (M45) at 50+ friendly scale (16px / semibold / foreground contrast / underline). Includes a one-line guardrail telling future contributors to reuse the constant on any new gender-split matrix.
- `DECISIONS.md` — no new index row. M45 is a 50+ friendly type promotion within existing PRD L57 + ADR 0025, not a new principle.
- `Product_Roadmap.md` — already carries the M45 entry from the delivery turn. No update needed.
- `CHANGELOG.md` — this entry plus the M45 delivery entry at 15:29. Well under 100 entries; no archive migration needed.
- `PRD.md` — no deviation this session. M45 directly serves PRD L57 (Japanese-minimalist, 50+ friendly type / contrast / touch targets). Within PRD intent.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-10-02T16:23:34+08:00`.

## 2026-10-02 15:29 HKT — M45 delivered: 自查對照表的 男性／女性 標題強化

- `src/routes/summary.tsx`:
  - New module-level constant at the top of the file (next to the other shared helpers): `const GENDER_CAPTION = "mb-3 pb-2 border-b border-border text-left text-base font-semibold text-foreground";` with a comment telling future contributors to reuse it on any new gender-split matrix caption.
  - Six `<caption>` className strings (lines 153, 239, 347, 422, 522, 615 — one per gender-split matrix component: BodyFatMatrixTable / BmrReferenceTable / WaterMatrixTable / SmiMatrixTable / HandGripMatrixTable / SitReachMatrixTable) all swap from the identical `"mb-2 text-xs text-muted-foreground"` to `{GENDER_CAPTION}`. Grep confirms zero stale instances remain.
- Rendered effect per caption: size jumps from `text-xs` (12px) to `text-base` (16px), weight becomes `font-semibold`, colour moves from `text-muted-foreground` to `text-foreground`, alignment becomes `text-left`, a thin `border-b border-border pb-2` horizontal rule appears beneath the header, and margin below bumps from `mb-2` to `mb-3`. Caption content byte-identical (「男性 標準脂肪量（%）」, 「女性 體內水分比例」, etc.).
- Rationale: user-reported risk on `/summary` (iPhone Safari screenshots 2026-10-01). The six self-lookup card disclosures (體脂率, 基礎代謝率, 體內水分, 肌少症指數, 手握力, 坐地前伸) each render a 男性 table above a 女性 table. The old caption was barely louder than a footnote — a 女性 reader scanning for the ★-marker could glance at the first (male) table and interpret the wrong row. Violated PRD L57 50+ friendly type/contrast expectations and risked a trustworthiness failure at the gender-header scanning step.
- Design decisions: (1) typographic-only — no icons (risk inconsistent rendering across iOS/Android font stacks), no colour accents (would pull navy/teal palette into semantic roles they don't carry elsewhere, drifting the design system). (2) no wrapper component — six inner matrix components have different cell renderers (★ overlay for most, M43 delta for BMR, 2-tier for water/SMI, 5-tier×age for grip/sit-reach); the pattern we DO share is the caption so we share THAT via a string constant, not an abstraction over six incompatible table shapes. (3) no border/background box around each table — the caption's own underline already bounds it; nesting three borders deep (disclosure → sub-panel → table) would look fussy on narrow iPhone screens. (4) no reorder / no gender presumption — PRD L13 forbids collection; symmetric 男→女 ordering stays.
- Untouched: all data constants (BODY_FAT_MALE/FEMALE, BMR_MALE/FEMALE, WATER_MALE/FEMALE, SMI_MALE/FEMALE, HAND_GRIP_MALE_DISPLAY/FEMALE_DISPLAY, SIT_REACH_MALE_DISPLAY/FEMALE_DISPLAY), the ★ overlay logic (`matchesCell`), the M43 BMR per-cell delta rendering, the M38 SMI caption, the "★ = 你的⋯" footer legend lines, all card headers / body copy / M43 reader guide, the `<details>` disclosure wrappers and their `<summary>` labels, `SELF_LOOKUP_CARD_NAMES` wire sanitize, `CARDS_WITH_SELF_LOOKUP` badge omission, `interpretCard`, grader, AI prompt layer, M42 bucket helper, storage envelope, CSV, calendar, every record-page component.
- PRD alignment: L13/L47 ✓ (no new input or state); L48 ✓ (UI only); L50 wire byte-identical ✓; L51 + Exception ✓ (grader untouched; app still does not classify by gender); L52 grounded AI ✓ (AI layer untouched); L55 繁中 ✓ (caption copy unchanged); **L57 Japanese-minimalist, 50+ friendly type/contrast/touch targets ✓ directly served** (16px body-base size, semibold weight, foreground colour); ADR 0025 ✓ (gender labels permitted on static reference material from a named source).
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean. Grep confirms all 6 captions now reference `GENDER_CAPTION`; zero `mb-2 text-xs text-muted-foreground` captions remain.
- Plan: `plan/49-m45-prominent-gender-headers.md`.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-10-02T15:29:43+08:00`.

## 2026-10-01 23:32 HKT — Living-docs sync after M44

- `ARCHITECTURE.md` — Data-flow diagram's multi-photo-merge note extended with M44's weight guard: on Tanita, `weight` is accepted only from the first screen (`mod.screens[0].id`, currently 體脂率); OCR on screens 2–7 strips the `weight` key before merging so per-screen scale drift can't overwrite the user's authoritative weight. Non-tanita modules short-circuit the guard.
- `DECISIONS.md` — no new index row. M44 is a merge-rule tightening within existing patterns (M19 Tanita screens, M27 wire sanitize), not a new principle. No ADR warranted.
- `Product_Roadmap.md` — already carries M44 entry from the delivery turn. No update needed.
- `CHANGELOG.md` — this entry plus the M44 delivery entry at 18:40. Well under 100 entries; no archive migration needed.
- `PRD.md` — no deviation this session. M44 served PRD L23 NORTHSTAR (trustworthy — the number the user recorded stays recorded) and PRD L51 deterministic grading (derived values BMI/ASM/SMI now read a stable weight input). Both strengthen existing PRD intent.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-10-01T23:32:34+08:00`.

## 2026-10-01 18:40 HKT — M44 delivered: 體重 locked to primary Tanita screen

- `src/components/health/useRecordState.ts`:
  - `onImage` merge loop (lines 109-124) gains a 3-line guard. Before entering the field-merge loop, computes `isPrimaryWeightScreen = mod.id !== "tanita" || !screenId || screenId === mod.screens![0]!.id`. Inside the loop, `if (k === "weight" && !isPrimaryWeightScreen) continue;` skips the OCR'd weight on non-primary Tanita screens. Everything else (muscle, limbs, water, visceral, bmr, height) merges exactly as before.
- Rationale: user-reported bug 2026-10-01. On `/tanita`, every one of the 7 screens lists `weight` in its fields. TANITA displays weight at the top of each screen, so OCR on screens 2–7 returns a weight that then overwrote the user's screen-1 weight with ±0.1-0.5 kg of scale drift. User's rule: screen 1 (體脂率) is the sole weight authority; non-primary OCR must not touch it; manual revise on screen 1 (the only editable site, by design) is the sole override.
- Design decisions: (1) rule reads `mod.screens[0].id` dynamically rather than literal `"bodyFat"` so a future screen reorder in `modules.ts` moves authority with the array. (2) `mod.id !== "tanita"` short-circuits to primary so BP / grip / sitreach modules (which call `onImage` with no `screenId` and have no `weight` field) are untouched. (3) strict rule — screen-2+ OCR never writes weight, even when screen 1 is empty. The M36 `ready` check at save already auto-scrolls to the first `aria-invalid="true"` input (screen 1's weight) if the user tries to save without visiting screen 1. (4) no UI change: the disabled-display pattern for weight on screens 2–7 (TanitaRecord.tsx:92-107) continues to mirror `values["weight"]` so the user still sees screen 1's weight populate the other 6 cards.
- Standalone 6-case simulation (2026-10-01): screen=muscle+weight-set → weight preserved ✓; screen=bodyFat → weight overwritten (primary authority) ✓; screen=water+weight-empty → weight NOT written (strict rule) ✓; BP module no screenId → all merged ✓; screen=asm → 4 limbs merged, weight preserved ✓; screen=bmi → height merged, weight preserved ✓.
- Untouched: `onVoice` (voice removed from Tanita per ADR 0022; path untouched anyway), `derived` memo (BMI/ASM/SMI still read `values["weight"]`), `ready` memo, `submit`, `makeEntry`, storage envelope, wire shape, JSON response shape, grader, grounding gates, M42 bucket helper, M43 BMR reader guide, every other UI file.
- PRD alignment: L47/L48 ✓ (in-memory state only); L50 wire byte-identical ✓ (strip happens client-side after server response); **L23 NORTHSTAR ✓ directly served** (the number the user actually recorded stays recorded); L51 + Exception ✓ (grader untouched; derived values now read a stable weight); L52 grounded AI ✓ (AI layer untouched); L55 繁中 ✓; L57 50+ friendly ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Plan: `plan/48-m44-weight-locked-to-primary-screen.md`.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-10-01T18:40:28+08:00`.

## 2026-10-01 18:30 HKT — Living-docs sync after M43

- `ARCHITECTURE.md` — one targeted sentence extended on the body-composition grading bullet: names the five self-lookup cards whose matrices carry built-in tier labels (消瘦/適當/正常/優-差) and explains BMR as the exception whose source publishes point values rather than tiers, so `BmrStandardTable` renders deltas + the M43 reader guide to carry interpretation. Points to ADR 0025.
- `adr/0025-static-reference-vs-ai-advice.md` — new source-change-history bullet dated 2026-10-01 (M43) describing the BMR interpretive scaffolding, the per-cell delta rendering, the three-bullet reader guide, the TANITA + 衞生署 attribution split, and the inline-comment protection for 男性/女性 metric labels. Operates within this ADR's principle; no new ADR needed.
- `DECISIONS.md` — no new index row (M43 is a source-change-history bullet on ADR 0025, not a new ADR).
- `Product_Roadmap.md` — already carries M43 entry from the delivery turn. No update needed.
- `CHANGELOG.md` — this entry plus the M43 delivery entry at 18:00. Well under 100 entries; no archive migration needed.
- `PRD.md` — no deviation this session. M43 served PRD L23 NORTHSTAR (trustworthy — a reader can now interpret their BMR delta) within existing PRD L51 Exception (self-lookup cards + L13's no gender/age collection).
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-10-01T18:30:43+08:00`.

## 2026-10-01 18:00 HKT — M43 delivered: BMR card gains 「如何理解你的差距」 reader guide

- `src/routes/summary.tsx`:
  - `BmrReferenceTable` (lines ~245): per-cell delta rendering changed from `你的-380` / `你的+60` to `你的 ↓ 380 kcal` / `你的 ↑ 60 kcal` / `你的 持平` (explicit 持平 for exact reference-value match). Arrow + unit + absolute-value magnitude so direction is immediately legible before the user reads the guide below. Rendered via an IIFE inside the JSX so `delta` is computed once per cell.
  - `BmrStandardTable` (between the existing 「你的 X kcal 與參考值的差距⋯」 line and the source footer): new bordered sub-section (`rounded-xl border border-border/60 bg-background p-3`) titled 【如何理解你的差距】. Lead sentence explains BMR correlates with muscle mass. Three bullets: (1) 讀數接近或略高於同性別年齡參考值 → 肌肉量充足；維持現有運動及飲食習慣即可. (2) 讀數明顯低於參考值 → 肌肉量偏低；可配合阻力運動（例如掌上壓、提舉重物、行樓梯）及均衡蛋白質攝取（例如魚、蛋、豆類）逐步改善. (3) BMR 本身沒有「越高越好」，應配合體脂率、肌肉量及腰圍整體評估. Gated by `userValue !== undefined` so a BMR card without a reading (edge case) doesn't carry a guide it has nothing to interpret.
  - `BmrStandardTable` source line amended: 「資料來源：TANITA〈身體組成數據參考指標〉的參考值；上述方向性解讀整合 TANITA 基礎代謝率解讀原則與衞生署〈能量代謝與肌肉量〉的常識性說明。基礎代謝率因性別及年齡而異，本應用程式因不收集性別及年齡而不進行分級，用家可對照上表自行判斷。」 — provenance clear on both the numeric reference values (TANITA, unchanged) and the interpretive framing (衞生署, newly cited for the directional reading of BMR vs muscle mass).
  - Inline JSX comment near the new block cites ADR 0025 so a future contributor grep-ing for 男性 / 女性 doesn't mistake the metric labels for group filters and delete them. 男性 / 女性 are static-reference metric labels (permitted by ADR 0025); SENSITIVE_LABEL_PATTERN at `ai.functions.ts:156` matches 男士 / 女士 / 長者 / 學生 only.
- Rationale: user iPhone Safari screenshot 2026-10-01 showed the BMR card rendering `你的-380` / `你的-180` / `你的+60` under TANITA reference values with no interpretive scaffolding. Five of six self-lookup cards (體脂率 / 體內水分 / 肌少症指數 / 手握力 / 坐地前伸) communicate position through built-in tier labels (消瘦/標準健康型/標準警戒型/微胖/肥胖, 適當/偏低, 正常/肌少症風險, 優/良/中/弱/差). BMR is the only self-lookup card whose source publishes point reference values rather than tier bands, so the cells carry no built-in interpretive label — the user had direction + magnitude but no interpretation. PRD L23 NORTHSTAR (trustworthy) called for a fix.
- Design decisions: (1) qualitative framing only ("明顯低於") rather than a numeric band ("差距超過 X kcal 屬偏低") — TANITA doesn't publish such a threshold, inventing one would violate PRD L51 and ADR 0025. (2) actionable bullet #2 names concrete resistance-exercise examples (掌上壓 / 提舉重物 / 行樓梯) and protein-source examples (魚 / 蛋 / 豆類) so the reader can translate 「肌肉量偏低」 into a next step. (3) explicit 「沒有越高越好」 bullet pre-empts the common gym-adage misreading. (4) kept inside the existing `<details>` disclosure (folded by default) — opening the disclosure already commits the user to a long read, so adding a clearly-sectioned guide at that point is additive help, not clutter. (5) `持平` for exact reference-value match preserves the M24-style exact-match honesty — if the reading equals the reference, say so rather than render ±0.
- Untouched: `interpretCard` (grader), `SELF_LOOKUP_CARD_NAMES` wire sanitize (BMR already in Set), `CARDS_WITH_SELF_LOOKUP` badge omission (BMR already in Set), `TIPS_REFERENCE`, `REFERENCE_LEAFLET`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, M42 bucket helper, grounding gates, `RichSummaryInput` cap, JSON response shape, storage envelope, the other 5 self-lookup card components, `/tanita` record page, CSV export, calendar, photo flow.
- PRD alignment: L13 ✓ (no gender/age collection; user picks own column as before); L47 ✓; L48 ✓ (UI only, no storage change); L50 wire byte-identical ✓; L51 + Exception ✓ (grading unchanged; guide teaches user to self-classify, app itself does not classify); L52 grounded AI ✓ (AI prompt untouched; guide is static reference per ADR 0025); L55 繁中 ✓; L56 global 「不能取代醫生診斷」 footer still visible ✓; L57 Japanese-minimalist 50+ friendly ✓ (bordered sub-section, bullets, generous whitespace, mint/navy/teal palette).
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Plan: `plan/47-m43-bmr-reader-guide.md`.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-10-01T18:00:27+08:00`.

## 2026-09-30 20:15 HKT — Living-docs sync after M42 + M42a

- `ARCHITECTURE.md` — one targeted paragraph appended after the M41 whitelist block: describes the M42 + M42a **posture block** in `generateRichSummary`'s Part 2 prompt. Names the four postures (`no-graded` / `normal` / `few-off` / `many-or-crisis`), the three-card filter (血壓 / BMI / 內臟脂肪), the L51 Exception preserving self-lookup-card opacity, the Chinese-numeral discipline to avoid `allowedNumbers` collision, the ban on 「全部正常」 / 「全部達標」 / 「有健康風險」 in the no-graded branch, and the four new named-source `TIPS_REFERENCE` topics (中等強度運動定義 / 蔬果攝取量 / 減鹽減糖減油定義 / 腰圍與中央肥胖) whose numeric contents enter `allowedNumbers` via `tipsText`. Points to ADR 0026.
- `DECISIONS.md` — one new index row for 2026-09-30 / ADR 0026.
- `adr/0026-posture-conditional-prompt-shaping.md` — new ADR covering the principle M42 introduced and M42a refined: **the summary prompt carries a server-computed posture block that scales tone and suggestion count to what the reading actually shows — never AI-guessed, never client-controlled**. Extends ADR 0019 / 0025 / 0017. Records 7 rejected alternatives (AI self-classification, client-side posture, self-lookup cards in bucket, `normal` for empty-graded, hard-gating the ban wording, finer bucketing). Consequences list flags the duplicated grade-string SSOT wart (`BP_TIERS.label` and `BandGrade` strings hardcoded in `bucketByGrade`) as latent, not blocking. Source change history bullets for M42 (three-bucket design + 4 new topics) and M42a (no-graded posture + explicit ban).
- `Product_Roadmap.md` — already carries M42 and M42a entries from their delivery turns. No update needed.
- `CHANGELOG.md` — this entry plus prior M42 (10:42) and M42a (17:06) delivery entries. Well under 100 entries; no archive migration needed.
- `PRD.md` — no deviation this session. M42 served PRD L23 NORTHSTAR (trustworthy specific-to-reading advice) and L52 grounded AI (all 4 new topics named-source; bucket computed server-side); M42a restored L23 + L52 on the previously-buggy grip-only / sit-reach-only / self-lookup-only session paths. Both within PRD intent.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-09-30T20:15:17+08:00`.

## 2026-09-30 17:06 HKT — M42a delivered: no-graded bucket ends fabricated 「全部正常」 claim

- `src/lib/health/ai.functions.ts`:
  - `GradeBucket` union widened to `"no-graded" | "normal" | "few-off" | "many-or-crisis"`.
  - `bucketByGrade` short-circuits with `if (graded.length === 0) return "no-graded";` BEFORE the `off.length === 0` check. Ordering rationale in code comment: without the early return, the empty case has `off.length === 0` too and would fall into `"normal"`, letting the prompt claim 「三項可評級指標全部落在正常範圍」 for indicators that were never measured.
  - `bucketBlock` ternary chain gains a new first branch: 「整體情況：今次紀錄未包含血壓、BMI 或內臟脂肪等可評級指標，只有自查對照的項目。第二部分請就用家實際錄入的項目給一至兩條中性的日常提醒（例如維持運動、均衡飲食、充足水分），語氣輕鬆。切勿對用家未量度的指標（例如血壓、BMI、內臟脂肪）作出任何判斷，切勿使用「全部正常」「全部達標」「有健康風險」等結論式字眼。」
- Rationale: M42 peer review Finding #1 in this session. `bucketByGrade` returned `"normal"` for two semantically different states: (a) 血壓/BMI/內臟脂肪 all measured and all in-range, and (b) none of the three measured (grip-only, sit-reach-only, self-lookup-only Tanita sessions). In state (b) the AI received a factual claim about indicators the user never measured — violation of PRD L23 NORTHSTAR (trustworthy) and L52 (grounded AI: real error, no invented advice).
- Design decisions: (1) 「no-graded」 first in BOTH the helper's early return AND the ternary chain — both places must agree, verified by simulation. (2) Explicit ban on conclusion words in branch text: belt-and-braces so the AI cannot echo the fabricated framing even if it drifts. (3) No hard grounding gate for this; enforced at prompt layer, same class as M42's ban on 「明天就做」 and 「參考對照表」. Hard-gating would need per-session module-recorded state the wire doesn't carry.
- Standalone simulation (8 scenarios): empty→no-graded ✓, grip-only→no-graded ✓, self-lookup-only→no-graded ✓, BP normal→normal ✓, BP stage1→few-off ✓, BP crisis→many-or-crisis ✓, all-three-normal→normal ✓, all-three-off→many-or-crisis ✓.
- Untouched: `selectRelevantTips` (empty-set fallback + 手握力/坐地前伸 branch already give no-graded sessions a non-empty topic pool, so `expectTips` gate stays satisfied), `richGroundingFailure` (existing gates cover the new branch), storage envelope, wire shape, JSON response shape, `SELF_LOOKUP_CARD_NAMES` sanitize, grader, interpretCard, all UI files, PRD, ADRs. M42 normal/few-off/many-or-crisis branches byte-identical.
- PRD alignment: L13/L47 ✓ (prompt content only); **L23 NORTHSTAR ✓ directly served** (no more fabricated 「全部正常」); L48 ✓; L50 wire byte-identical ✓; L51 + Exception ✓ (self-lookup cards still opaque to bucket); **L52 grounded AI ✓ directly served**; L55 ✓; L57 ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Plan: `plan/46-m42a-no-graded-bucket-hotfix.md`.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-09-30T17:06:05+08:00`.

## 2026-09-30 10:42 HKT — M42 delivered: 貼士質素優化 (具體 · 分級語氣 · 去除口頭禪)

- `src/lib/health/charts.ts`:
  - Appended 4 new `TIPS_REFERENCE` topics after 體脂率參考標準:
    - 【中等強度運動定義】 — 快步行/太極/社交舞/踏單車/上落樓梯; 世衞+衞生署 ≥150 min/週 中等強度 + ≥2 天 肌肉強化; 分段最少 10 min. Sources: 衞生署 change4health/physical_activity + 衞生防護中心 101307.
    - 【蔬果攝取量】 — 每日 2 份水果 + 3 份蔬菜; 份量定義 (1 中型水果 / 半碗煮熟菜 / 1 碗生菜); 全日餐單實例 (香蕉+灼菜+橙+炒菜心). Sources: 衞生署 change4health/healthy_diet/faq + preventive_diet.
    - 【減鹽減糖減油定義】 — 鹽 <5g/日 (≈2000mg 鈉 / ≈1 平茶匙), 糖 <25g/日 (≈5 平茶匙), 油 5–6 茶匙/日; 具體做法 (薑蔥蒜替醬料 / 少喝汽水 / 蒸燉炆烚). Sources: 衞生署 preventive_diet + faq.
    - 【腰圍與中央肥胖】 — 男 <90cm / 女 <80cm; 量度方法 (肋骨最低與盆骨最高之中線, 呼氣時, 皮尺水平); +10cm→全因死亡 +11% / 高血壓 +27%. Sources: 衞生署 waist + keep_healthy_waist + 衞生防護中心 高血壓.
  - Agencies capped to existing `Agency` type (衞生防護中心 / 衞生署 / 職業安全健康局 / 醫管局); no WHO addition needed because 衞生署 already carries the WHO-derived thresholds.
- `src/lib/health/ai.functions.ts`:
  - `selectRelevantTips` extended: 血壓 非正常 also adds 減鹽減糖減油定義 / 腰圍與中央肥胖 / 中等強度運動定義; BMI 偏高/過高/過輕 adds 蔬果攝取量 / 減鹽減糖減油定義 / 中等強度運動定義 / 腰圍與中央肥胖; 內臟脂肪 非正常 adds 腰圍與中央肥胖 / 蔬果攝取量 / 中等強度運動定義; 手握力/坐地前伸 adds 中等強度運動定義; empty-set fallback adds 蔬果攝取量 / 中等強度運動定義.
  - New `bucketByGrade(cards): "normal" | "few-off" | "many-or-crisis"` — filters to 血壓/BMI/內臟脂肪 (three graded cards only; self-lookup cards opaque per PRD L51 Exception), counts off-grades (正常偏高 起計) and crisis (嚴重偏高 / 高血壓（第二期）/ 過高). Crisis or ≥3 off → many-or-crisis; 0 off → normal; else few-off.
  - Part 2 prompt rewrite: bucket-conditional 整體情況 opening paragraph specifying tone + suggestion count (normal 1–2 gentle; few-off 3–4 neutral concrete; many-or-crisis 4–5 firm with health risks named). Chinese numerals (一/兩/三/四/五) so no `allowedNumbers` collision. Explicit 嚴禁事項 block bans: 「明天就做/明天可以」, 「參考對照表/查看對照表/見下方對照表」, 模糊字詞 (少油少糖/適量運動/中等強度運動) 單獨出現而無定義, 參考資料以外的建議或數字. Explicit allowance: 男性/女性 for 腰圍量度標準 (SENSITIVE_LABEL_PATTERN blocks 男士/女士/長者/學生 only, not 男/女 or 男性/女性).
- Rationale (user report): tester feedback identified four specific defects — repeated 「明天可以怎樣」, vague adjectives (少油少糖 / 中等強度運動 / 保持腰圍) never quantified, 參考對照表 nagging when the user is already reading the table, and tone-blind volume of advice for both normal and abnormal records. Design goal: advice should feel written for the specific reading, actionable within the day, and scale volume/tone to severity.
- Design decisions: (1) bucket only on the three genuinely graded cards — pulling self-lookup cards into bucket logic would smuggle age/gender-based grading in violation of PRD L13. (2) all new topic bodies carry digits (5, 25, 90, 80, 150, 2000, 10, 11, 27) that flow into `allowedNumbers` via `tipsText` extraction — AI can safely quote them. (3) posture text uses Chinese numerals for structural counts so 「三至四條」 doesn't require a matching digit in leaflet/tips. (4) no new grounding gate — 對照表 nagging is a soft constraint at prompt layer; if it persists we can add a regex filter in a follow-up milestone.
- Untouched: storage envelope, wire shape (`RichSummaryInput` cap of 12 preserved), JSON response shape (`RichSummaryOutput`), `richGroundingFailure` structure, `SELF_LOOKUP_CARD_NAMES` sanitize, `CARDS_WITH_SELF_LOOKUP` badge-omission gate, grader logic, interpretCard, all UI files, PRD, ADRs.
- PRD alignment: L13/L47 ✓ (prompt content only, no gender/age collection); L23 NORTHSTAR ✓ (specific-to-reading advice); L48 local-only ✓; L50 wire byte-identical ✓; L51 grading deterministic + Exception ✓ (bucket ignores self-lookup cards); **L52 grounded AI directly served ✓** (all 4 new topics named-source; buckets computed server-side; grounding gates unchanged); L55 繁中 ✓; L57 minimal ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Plan: `plan/45-m42-tips-quality-optimization.md`.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-09-30T10:42:52+08:00`.

## 2026-09-30 09:26 HKT — Living-docs sync after M41

- `ARCHITECTURE.md` — one targeted addition after the summary data-flow diagram: describes M41's dynamic card-name whitelist mechanism (prompt derives names from `Array.from(validCardNames)`, the same Set `parseOutput` filters on, so prompt and filter share one source and future card additions can never silently fall outside the prompt). Includes an explicit 「Never re-introduce a hardcoded card-name list in this prompt」 guardrail so future contributors see how the M27-through-M41 ossification happened.
- `Product_Roadmap.md` — already carries M41 entry from delivery turn. No update needed.
- `CHANGELOG.md` — this entry plus prior M41 delivery entry at top. Well under 100 entries; no archive migration needed.
- `DECISIONS.md` / `adr/` — no new ADR this session. M41 is a prompt-authority alignment fix within an existing pattern (leaflet-grounded AI, ADR 0025), not a new principle. DECISIONS.md index unchanged.
- `PRD.md` — no deviation this session. M41 restored PRD L52 「grounded AI」 for the multi-card summary path that M40 unblocked; the underlying L52 violation window was already logged in the previous docs-sync entry (2026-09-29 18:25 HKT) so no additional deviation record is needed.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-09-30T09:26:16+08:00`.

## 2026-09-29 HKT — M41 delivered: dynamic card-name whitelist ends stale-prompt grounding failure

- `src/lib/health/ai.functions.ts`:
  - Build `cardNameList = Array.from(validCardNames).map((n) => \`「${n}」\`).join("、")` immediately after the `validCardNames` Set is constructed (line ~265). Reuses the same Set `parseOutput` filters on at line ~301 — prompt authority and filter authority now share one source.
  - Base prompt line 270 changed from `照抄「血壓」、「BMI」、「體脂率」、「內臟脂肪」、「手握力」、「坐地前伸」六者其一` to `照抄以下之一：${cardNameList}`. 「照抄以下之一：」 has no count word (no more 「六者其一」 to ossify).
- Rationale: user tested `/summary` after M40 with a full Tanita entry (all 6 Tanita cards populated because M40's grounded SMI derivation from 4 limb inputs finally makes the 肌少症指數 card produce a value) + BP = 7 cards. Red banner 「摘要未通過內容核對（卡片解讀未對應項目名稱），已停止顯示」 fired every attempt. Root cause: the M21-era prompt hardcoded a whitelist that omitted 基礎代謝率, 體內水分, 肌少症指數 — the 3 cards M27 added. Gemini obeyed the whitelist, `parseOutput` filtered the 3 unnamed cards, `output.cards.length` (4) < `expectedCardCount` (7), grounding-failure toast. Bug had been latent since M27; only surfaced now that M40 makes the full-Tanita path viable end-to-end. **This was not caused by M40 — the whitelist was stale from M27 forward; M40 removed the last obstacle to reaching the buggy path.**
- Design: reuse existing `validCardNames` Set (no new state); `Array.from(Set)` preserves insertion order from `data.cards.map`; prefix 「照抄以下之一：」 works for any list length (1 name for BP-only, up to 9 for full multi-module records). Both retries (parse-retry line ~296, grounding-retry line ~322) inherit via `basePrompt` interpolation — no separate change needed.
- Untouched: `richGroundingFailure` logic (the check itself was correct), `SELF_LOOKUP_CARD_NAMES` wire sanitize, `REFERENCE_LEAFLET`, `TIPS_REFERENCE`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, `RichSummaryInput` cap, JSON response shape, grader logic, interpretCard, storage envelope, all other files.
- PRD alignment: L13/L47 anonymous ✓ (prompt content only), L48 local-only ✓, L50 wire byte-identical ✓, **L52 grounded AI directly served ✓** (grounding check now achievable for all `data.cards` shapes), L55 繁中 ✓, L57 ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/44-m41-dynamic-card-name-whitelist.md`. Awaiting Cloud Run redeploy.

## 2026-09-29 18:25 HKT — Living-docs sync after M39 / M40 (with PRD-deviation note)

- `ARCHITECTURE.md` — two targeted updates reconciling code with docs:
  1. **Data-flow section** gains a new paragraph after the diagram describing `useRecordState.derived` (M39 + M40): the derived-values pattern for tanita (BMI from weight+height, ASM from 4 limbs, SMI from ASM+height using AWGS 2019 shape), storage in the same `values.bmi` / `values.smi` / `values.asm` keys interpretCard reads, height pre-fill from most-recent entry, and the two `ScreenDef.supportsPhoto` postures (bmi screen false — no camera; asm screen default true — extracts 4 limb values from the TANITA segmental-muscle screen).
  2. **Static-reference-tables paragraph** — the SMI-disclosure description gains M40's grounded-derivation source line 「SMI 由四肢骨骼肌質量 (ASM = 雙臂 + 雙腿肌肉量) ÷ 身高平方推算，對應 AWGS 2019 標準」 alongside the M38 caption, and now names that the user's ★ overlay marks the AWGS-grounded derived SMI (`ASM / height²`), not a raw stored value.
- **PRD deviation logged (short-window L51 violation, resolved by M40).** During the M39 deploy window on 2026-09-29 the app shipped `smi = totalMuscleMass / (height/100)²` derivation against the summary card's AWGS 2019 thresholds (男 <7.0 / 女 <5.7 kg/m²) which are defined against appendicular skeletal muscle mass (ASM = arms + legs only, excluding trunk). Total-muscle-based SMI runs ~1.7–2× higher than AWGS SMI and systematically misclassified users against the visible matrix — a direct violation of PRD L51 「Grading is deterministic and comes from the bundled reference tables — never from AI. Where a chart does not cover the user, the app says 「無適用參考標準」 and still saves the raw number; it never extrapolates.」 The extrapolation clause applied because M39's formula used a shape (total muscle) that did not match the shape (appendicular muscle) the AWGS thresholds are drawn from. The deviation was flagged in-session when the user challenged the grounding source, and corrected in M40 (bd91d40) by re-introducing the 4 limb muscle inputs the user's TANITA MC-780MA displays on its segmental-muscle screen, computing `asm = sum of 4 limbs` and `smi = asm / (height/100)²` — now matching the AWGS threshold source shape exactly. M39-window entries retain wrong stored SMI in localStorage until users re-record with the 4 limb inputs (self-corrects on next save). PRD text unchanged (never bent to match a bug); this entry is the history-SSOT record that a compliant state was briefly violated and restored.
- `Product_Roadmap.md` — already carries M39 and M40 entries from delivery turns. No update needed.
- `CHANGELOG.md` — this entry plus prior M39/M40 delivery entries at top. Well under 100 entries; no archive migration needed.
- `DECISIONS.md` / `adr/` — no new ADR this session. M39 and M40 both amended `adr/0025-static-reference-vs-ai-advice.md`'s Source change history at delivery time (M39 the ungrounded derivation, M40 its correction).
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-09-29T18:25:32+08:00`.

## 2026-09-29 HKT — M40 delivered: ASM inputs re-introduced for AWGS-grounded SMI (fixes M39)

- Root cause of the fix: user challenged whether M39's SMI derivation was grounded. Honest answer was no — `smi = totalMuscleMass / (height/100)²` used total muscle whereas AWGS 2019 thresholds (男 <7.0 / 女 <5.7 kg/m² rendered on the summary matrix) are defined against **appendicular skeletal muscle mass (ASM)** — limbs only, excluding trunk. Total-muscle-based SMI runs ~1.7–2× higher than AWGS SMI, systematically misclassifying users against the visible thresholds and violating PRD L51 「never extrapolates」. User provided a photo of the TANITA MC-780MA segmental-muscle screen (TRUNK 19.8 / L ARM 1.5 / R ARM 1.5 / L LEG 7.5 / R LEG 7.5 kg → ASM 18.0 kg) proving the raw data is on the device. This reverses part of M32's segmental-muscle drop with grounded evidence.
- `src/lib/health/modules.ts`:
  - Re-added 4 raw fields between `muscleRatio` and `bodyWaterPct`: `muscleArmL` (左臂肌肉量, 公斤, 0.1-15), `muscleArmR`, `muscleLegL` (0.5-30), `muscleLegR`. Trunk NOT re-added (AWGS ASM excludes trunk).
  - New screen inserted between `muscle` and `water`: `{ id: "asm", label: "四肢肌肉量", fields: ["muscleArmL", "muscleArmR", "muscleLegL", "muscleLegR", "weight"], description: "四肢骨骼肌質量（ASM）＝雙臂＋雙腿。用於推算肌少症指數（SMI）＝ ASM ÷ 身高平方，對應 AWGS 2019 標準。" }`. Default supportsPhoto (true).
  - Net field count 11 → 15; screen count 6 → 7.
- `src/lib/health/ai.functions.ts`:
  - `TANITA_SCHEMA` regains 4 nullable keys.
  - Whole-module `EXTRACTION_FIELDS.tanita` prompt lists the 4 limb keys with 繁中 hints.
  - New `TANITA_SCREEN_PROMPTS.asm` entry uses TANITA's device labels (L ARM / R ARM / L LEG / R LEG) as photo-reading hints — Gemini reads the segmental-muscle screen cleanly.
- `src/components/health/useRecordState.ts` — `derived` memo rewritten:
  - BMI derivation unchanged (already correct).
  - `asm = round(muscleArmL + muscleArmR + muscleLegL + muscleLegR, 1)` stored in `values.asm`.
  - `smi = round(asm / (height/100)², 2)` stored in `values.smi` — **now grounded against the AWGS 2019 thresholds the summary matrix renders**.
- `src/components/health/TanitaRecord.tsx` — new ASM-screen live preview block: 「四肢肌肉量合計（ASM）：X.X 公斤」 the moment all 4 limbs are present; 「推算肌少症指數（SMI）：X.XX kg/m²」 when ASM + height both present. BMI-screen preview from M39 preserved.
- `src/routes/summary.tsx` — M39 caveat 「⋯與部分 TANITA 儀器所顯示的 SMI 讀數⋯可能略有差異」 replaced with grounded source line: 「SMI 由四肢骨骼肌質量（ASM＝雙臂＋雙腿肌肉量）÷ 身高平方推算，對應 AWGS 2019 標準」. M38 caption + matrix + ★ overlay preserved.
- Worked example: user with muscleArmL=1.5, muscleArmR=1.5, muscleLegL=7.5, muscleLegR=7.5, height=170 → ASM = 18.0 kg; SMI = 18.0 / 1.7² = 6.23 kg/m². Below 男 <7.0 threshold → ★ lands in 男 「肌肉質量不足」 cell of the matrix, matching AWGS classification. (Pre-M40 with muscleMass=37.8 total: M39 would have computed 13.08 kg/m² — comfortably above 7.0 → wrongly classified as healthy.)
- Storage: no envelope bump. Old pre-M39 entries with raw smi retained via key lookup on interpretCard. M39-window entries (short-lived, cache still stale on user's phone) retain wrong smi in storage; self-correct on re-record with the 4 limb inputs.
- Untouched: grader logic, interpretCard, SELF_LOOKUP_CARD_NAMES wire sanitize, CARDS_WITH_SELF_LOOKUP, REFERENCE_LEAFLET, TIPS_REFERENCE, allowedNumbers, SENSITIVE_LABEL_PATTERN, other 5 Tanita screens' M31 descriptions, M30 nav, M33 try/catch, M34 timing logs, M35 grader fix, M36 toast + auto-scroll, M37 button states, M38 SMI caption, M39 height field + BMI derivation.
- PRD alignment: L13/L47 anonymous ✓, L48 local-only (no bump) ✓, L50 wire byte-identical ✓, **L51 restored ✓** (SMI derivation uses the same ASM shape AWGS thresholds are based on; no more extrapolation), L52 grounded AI unchanged ✓, L55 繁中 ✓, L57 50+ friendly ✓.
- `adr/0025-static-reference-vs-ai-advice.md`: one line added to Source change history — 「M40 (2026-09-29): SMI derivation grounded — 4 limb muscle fields (muscleArmL/R, muscleLegL/R) re-added; new 四肢肌肉量 screen with photo extraction; ASM = sum, SMI = ASM / height² matching AWGS 2019 thresholds. Replaces M39's ungrounded total-muscle formula which violated 'never extrapolates'.」
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/43-m40-asm-grounded-smi.md`. Awaiting Cloud Run redeploy.

## 2026-09-29 HKT — M39 delivered: SMI 及 BMI 改為推算值，改而記錄身高

- `src/lib/health/modules.ts`:
  - `ScreenDef` gains optional `supportsPhoto?: boolean` (defaults true when absent). Screens whose values aren't on a physical device display (currently 身高與 BMI only) set it false so `TanitaRecord` skips the `<ImageDrop>`.
  - Tanita `fields` rewritten: 12 → 11 entries. Removed `smi` and `bmi`; added `height` (身高, 厘米, min 120, max 230, step 1). Field order groups by screen.
  - Muscle screen fields: `["muscleMass", "muscleRatio", "weight"]` (smi dropped).
  - BMI screen renamed to 「身高與 BMI」, fields `["height", "weight"]`, `supportsPhoto: false`, description extended to name the auto-calculation.
- `src/lib/health/ai.functions.ts`:
  - `TANITA_SCHEMA` Zod object trimmed to 10 nullable keys (smi + bmi dropped). Zod default `.strip` silently drops any stale AI-echoed values.
  - Whole-module `EXTRACTION_FIELDS.tanita` prompt trimmed to 10 keys.
  - `TANITA_SCREEN_PROMPTS.muscle` drops SMI.
  - `TANITA_SCREEN_PROMPTS.bmi` entry removed entirely (screen no longer supports camera).
- `src/components/health/useRecordState.ts`:
  - New `derived` memo. For tanita, augments `numeric` with computed `bmi = weight / (height/100)²` (1 decimal) and `smi = muscleMass / (height/100)²` (2 decimals) when both raw inputs are present. Non-tanita modules pass numeric through unchanged.
  - `gradeEntry(mod, derived)` — the live grades section on `/tanita` reflects derived BMI immediately.
  - `submit()` calls `makeEntry(derived, date)` so stored entries carry `values.bmi` and `values.smi` in the same keys old raw entries used. Downstream code (grader, interpretCard, CSV, history) reads by key without change.
  - New height pre-fill `useEffect`: on mount for tanita, if hydrated and `values.height` is empty, seeds it from the most-recent entry that has `height`. Returning users don't re-type.
  - `derived` exposed in the hook return.
- `src/components/health/TanitaRecord.tsx`:
  - Consume `derived` alongside `ready` / `justSaved`.
  - `<ImageDrop>` render guarded by `screen.supportsPhoto !== false`.
  - Below the field grid on the bmi screen: two lines — 「身高一次輸入即可，下次記錄會自動填入。BMI 會由體重及身高自動計算。」 and a live 「推算 BMI：<value>」 (from `derived["bmi"]` when both raw inputs are present).
- `src/routes/summary.tsx`:
  - Inside `SmiStandardTable`, after the M38 caption block: 「註：本應用程式以總肌肉量 ÷ 身高平方（kg/m²）推算 SMI，與部分 TANITA 儀器所顯示的 SMI 讀數（以四肢肌肉量計算）可能略有差異。」 — honest disclosure that our derived value differs from TANITA's own appendicular-based SMI.
- Rationale: user's TANITA does NOT display SMI or BMI on dedicated screens; the muscle-screen photo can't extract SMI and there's no BMI-only screen to photograph. Requiring users to type these values was asking for numbers they may not have. M39 stops the fiction — height is the single new raw input, BMI and SMI are honestly computed from what the app knows.
- Storage: no envelope bump. Old entries retain their raw `bmi` and `smi` values (displayed on `/summary` via `interpretCard`'s key lookup, but not in `/tanita` history row summary line since bmi/smi keys are no longer in `mod.fields`). New entries carry derived bmi + smi in the same keys. Coexistence is safe.
- Wire payload byte-identical: `interpretCard` builds summary cards by explicit key (`values.bmi`, `values.smi`); height itself never enters the card list, so nothing new leaves the device. Zero AI grounding surface change; `REFERENCE_LEAFLET` / `TIPS_REFERENCE` / `allowedNumbers` untouched.
- Untouched: grader logic, `interpretCard`, `SELF_LOOKUP_CARD_NAMES` wire sanitize, `CARDS_WITH_SELF_LOOKUP`, all reference tables (M27/M28/M29), M31 descriptions on other 5 screens, M32 required-field ready check (walks new 11 fields), M33 try/catch, M34 timing logs, M35 grader fix, M36 toast + auto-scroll, M37 three-state button, M38 SMI caption (still there, caveat added after it), other 3 modules, PRD.
- PRD alignment: L13/L47 anonymous ✓ (height is a body measurement, not age or gender), L48 local-only ✓ (no bump), L50 wire byte-identical ✓, L51 Exception SMI card preserved ✓, L52 grounded AI unchanged ✓, L55 繁中 ✓, L57 50+ friendly ✓.
- `adr/0025-static-reference-vs-ai-advice.md`: one line added to Source change history — 「M39 (2026-09-29): SMI and BMI move from raw stored inputs to derived values computed from a new `height` raw field on save. SMI card gains a caveat note disclosing the appendicular-vs-total-muscle difference from TANITA's own SMI reading.」
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/42-m39-smi-bmi-derived.md`. Awaiting Cloud Run redeploy.

## 2026-09-29 16:17 HKT — Living-docs sync after M36 / M37 / M38

- `ARCHITECTURE.md` — two targeted updates reconciling code with docs:
  1. **New paragraph after the M30 bottom-nav paragraph** describing the M36 + M37 three-state save button behaviour driven by `useRecordState`'s `ready` memo and `justSaved` state: navy 「儲存紀錄」 / teal 「💾 一按儲存」 / teal 「✓ 已儲存」, plus the M36 incomplete-tap flow (toast + queueMicrotask scroll to first `[aria-invalid="true"]`). Names the shared consumption in both `RecordModule.tsx` and `TanitaRecord.tsx` so all 4 record pages inherit the same behaviour.
  2. **Static-reference-tables paragraph** gets a sentence about the M38 SMI caption inside the SMI disclosure (3-line prose above the matrices, numbers re-used from `SMI_MALE` / `SMI_FEMALE` matrix data — already in `allowedNumbers`, zero AI grounding surface change). Adds M38 to the milestone chain closing the paragraph so the SMI relocation is traceable in-place.
- `Product_Roadmap.md` — already carries M36, M37, M38 entries from delivery turns. No update needed.
- `CHANGELOG.md` — this entry plus prior M36/M37/M38 delivery entries at top. Still well under 100 entries; no archive migration needed.
- `DECISIONS.md` / `adr/` — no new ADR this session. M36 (button UX), M37 (button UX polish), and M38 (SMI caption relocation) are UX / copy moves within existing principles. M38 amended `adr/0025-static-reference-vs-ai-advice.md`'s Source change history with one bullet at delivery time. DECISIONS.md index unchanged.
- `PRD.md` — no deviation this session. M36 serves L57 (50+ friendly), L23 NORTHSTAR (readable). M37 serves L23 NORTHSTAR (trustworthy button state matches truth). M38 serves L51 Exception (SMI in the 6-card self-lookup list). None require a log-of-deviation entry.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-09-29T16:17:21+08:00`.

## 2026-09-29 HKT — M38 delivered: SMI 解說移至健康摘要

- `src/lib/health/modules.ts` — remove the `description` key from the `muscle` `ScreenDef` entry. Fields unchanged (`["muscleMass", "muscleRatio", "smi", "weight"]`); other 5 screen descriptions (bodyFat, water, visceral, bmr, bmi) preserved from M31.
- `src/routes/summary.tsx` — inside `SmiStandardTable` (the `<details>` disclosure for the SMI card), between the `<summary>` heading 「查看肌少症指數（SMI）參考表（TANITA）」 and the first `<SmiMatrixTable>`, insert a 3-line caption block: 「肌少症指數（SMI）反映骨骼肌相對身高的比例。」 / 「男（肌少症指數 <7.0 kg/m²）為肌肉質量不足」 / 「女（肌少症指數 <5.7 kg/m²）為肌肉質量不足」. Renders as `<div className="mt-3 space-y-1 text-base leading-relaxed">` wrapping three `<p>` elements — matches the disclosure's existing text idiom.
- Rationale: user reported the M31 muscle-screen description was too general to explain what the SMI field on that screen measured, and the record page felt 「about 肌少症」 without saying so. The explanation belongs where the user first meets the SMI number — on the summary card next to the matrix, not upstream on the record screen. User provided the verbatim 繁中 wording from their TANITA reference material.
- Numbers 7.0 and 5.7 already live in `SMI_MALE` and `SMI_FEMALE` matrix arrays (rendered in the matrix tables below the caption) and are already in `allowedNumbers`. Zero AI grounding surface change; the caption re-uses the same numbers in a new visual form.
- Wire-payload behaviour unchanged: `SELF_LOOKUP_CARD_NAMES` in `ai.functions.ts` still includes 「肌少症指數」, so the SMI card's grade is still rewritten to 「請自行對照下方對照表」 before Gemini sees it.
- Untouched: SMI matrix data, `SmiMatrixTable` layout, ★ overlay logic, disclosure footer 「資料來源：TANITA〈身體組成數據參考指標〉…」, all other Tanita screen descriptions (bodyFat / water / visceral / bmr / bmi), all other summary cards, `REFERENCE_LEAFLET`, `TIPS_REFERENCE`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, `grade.ts`, `interpretCard`, storage envelope v1, M37 button states, M35 grader fix, PRD.
- PRD alignment: L13/L47 anonymous ✓, L48 local-only ✓, L50 wire byte-identical ✓, L51 Exception (SMI in the 6-card Exception list) ✓, L52 grounded AI unchanged ✓, L55 繁中 ✓, L57 50+ friendly (`text-base leading-relaxed`) ✓. **ADR 0025 directly served** — gender-structured thresholds may appear in UI (matrix and now caption); AI-side wire sanitize preserved.
- `adr/0025-static-reference-vs-ai-advice.md`: one line added to Source change history — 「M38 (2026-09-29): SMI caption with gender thresholds added to the summary card's reference disclosure, moved from the M31 muscle screen description. Numbers already in allowedNumbers via matrix data; UI-only per this ADR's principle.」
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/41-m38-smi-explanation-relocated.md`. Awaiting Cloud Run redeploy.

## 2026-09-27 22:45 HKT — M37 delivered: 儲存動作明確化 (「tap to save」 before, 「saved」 after)

- `src/components/health/useRecordState.ts`:
  - Add `justSaved: boolean` state — ephemeral UI-only flag driving the ~1.6s post-tap button reassurance beat.
  - In `submit()` success branch (after the existing `toast.success("已儲存紀錄（只保存於此裝置）。")`): `setJustSaved(true)` + `setTimeout(() => setJustSaved(false), 1600)`. 1600ms is the read-and-comprehend budget for a 50+ user glancing at the button after tapping.
  - Expose `justSaved` in the hook's return.
  - Cleanup: drop the pre-M32 `hasOptional` dead branch in the photo-extraction success toast (lines 72-85 before edit). Post-M32 no field is optional so the branch was unreachable — always executed the "no optional" toast form. Kept only the branch that reports 「已讀取圖片（已填 N / M 項）」 (or 「全部 M 項已填」 when N === M), which the always-visible counter above the save button already corroborates.
- `src/components/health/TanitaRecord.tsx` — add `Save` to lucide-react import alongside `Check`; consume `justSaved`. Button now renders three states:
  - `justSaved`: teal `bg-accent` + `<Check />` + 「已儲存」
  - `ready` (M36): teal `bg-accent` + `<Save />` + 「一按儲存」 (replaces M36's misleading 「儲存紀錄（已填齊）」 with imperative wording)
  - neither: navy `bg-primary` + 「儲存紀錄」
  className uses `ready || justSaved` for the shared teal look; children ternary orders `justSaved` first so the label wins during the 1.6s overlap.
- `src/components/health/RecordModule.tsx` — same three-state button treatment as TanitaRecord (applies to BP / grip / sit-reach).
- Rationale: user tested M36 and reported that the teal ✓ button read as 「saved」 rather than 「ready to save」 — ✓ + teal/green are universal completion signifiers in every UI convention, so a 50+ user assumed the record was already stored and did not tap. M36's icon choice was in the wrong state; M37 puts ✓ where it belongs (after the save) and uses the floppy-disk `<Save />` glyph pre-tap so the button says 「action pending」 not 「action completed」. The 1.6s teal 「已儲存」 beat also fixes the 「did anything happen?」 moment for 50+ users whose eyes stay on the button when the toast fires at the top of the page.
- Design decisions preserved: teal stays for both ready + just-saved states (reverting to navy inside 1.6s would flicker); `<Save />` chosen over `<ArrowDownToLine />` / `<ArrowRight />` for universal 50+ recognition; `setTimeout` cleanup relies on React GC — dev-only unmount warning, no prod effect; no "disable button" alternative (still rejected — disabled mobile buttons read as broken and block M36's toast + scroll educational path).
- Untouched: `grade.ts`, `interpretCard`, `ai.functions.ts` (M33 try/catch + M34 timing logs), `summary.tsx`, `logbook`, `csv.ts`, all reference tables (M27/M28/M29), M30 bottom nav, M31 descriptions, M32 required-field set, M35 grader fix, M36 toast + auto-scroll, storage envelope v1, PRD.
- PRD alignment: L13/L47 anonymous ✓ (justSaved is in-memory UI state), L23 NORTHSTAR trustworthy ✓ (button state matches reality at every phase), L35 USER JOURNEY 4 「reviews and confirms … then saves」 ✓ (three distinct visuals for the three verbs), L48 local-only ✓, L50 wire byte-identical ✓, L52 grounded AI unchanged ✓, L55 繁中 (儲存紀錄 / 一按儲存 / 已儲存 all 繁中) ✓, L57 Japanese-minimalist + 50+ friendly (`bg-accent` teal token, `min-h-14`, `text-lg`, full-width preserved; Save/Check icons at `size-5`) ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/40-m37-save-action-clarity.md`. Awaiting Cloud Run redeploy.

## 2026-09-27 22:15 HKT — M36 delivered: 儲存前一目了然 (teal-when-ready button + toast + auto-scroll)

- `src/components/health/useRecordState.ts` — three additions:
  1. `ready: boolean` memo over `values` + `mod.fields`. True iff every field carries a non-empty raw that parses inside `[min, max]`. Cost: 12 iterations per keystroke, negligible. Post-M32 no field is optional so no `f.optional` gate needed.
  2. `submit()` failure branch expanded: after `setErrors(errs)` and before the early return, fires `toast.error(\`尚有 ${count} 項未填或超出範圍，已標紅，請補上再儲存。\`)` then `queueMicrotask(() => document.querySelector('[aria-invalid="true"]')?.scrollIntoView({behavior:"smooth", block:"center"}))`. `queueMicrotask` guarantees React has committed the new `errors` state (so `aria-invalid` is on the DOM) before the query runs.
  3. `ready` added to the hook's return object alongside `errors`, `grades`, etc.
- `src/components/health/TanitaRecord.tsx` — import `Check` from `lucide-react`; consume `ready`. Button className adds `${ready ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}` (teal token from PRD L57 「teal accents」 palette); children swap from 「儲存紀錄」 to `<Check className="size-5" aria-hidden="true" />` + 「儲存紀錄（已填齊）」 when ready. WCAG SC 1.4.1 satisfied by pairing colour change with icon + text swap.
- `src/components/health/RecordModule.tsx` — same `Check` import + `ready` consumption + button className/children swap as TanitaRecord. Also drops the stale `mod.fields.some((f) => f.optional)` gate on the 「已填 N / M 項」 counter block: post-M32 every field is required so the gate always evaluated false and the counter never rendered on BP/grip/sit-reach; it now renders uniformly across all 4 record pages, matching TanitaRecord's existing behaviour.
- Rationale: user reported during 2026-09-27 testing that on tapping 儲存紀錄 they cannot tell what's missing until they scroll up through the whole form looking for red text — especially painful on Tanita's 6 screens. M36 solves it three ways: passive teal cue before the tap so the user knows the form is saveable in advance; audible/visible toast on incomplete tap so the tap-registered signal is unmissable; auto-scroll brings the field to the thumb rather than making the user hunt.
- Design decisions preserved from plan: `ready` = filled AND in-range (a teal button that later fails would be a worse lie than silent grey); `queueMicrotask` over `useEffect` (same tick, cleaner); `bg-accent` design-system token, not raw hex (dark-mode tuning stays a one-line CSS-variable change); no "disable button" alternative (disabled mobile buttons read as broken and block the toast/scroll educational path).
- Untouched: `grade.ts`, `interpretCard`, `ai.functions.ts` (M33 try/catch + M34 timing logs), `summary.tsx`, `logbook`, `csv.ts`, all 4 module reference tables (M27/M28/M29), M30 bottom nav, M31 descriptions, M32 required-field set, M35 grader fix, storage envelope v1, PRD.
- PRD alignment: L13/L47 anonymous ✓, L23 NORTHSTAR readable ✓, L35 USER JOURNEY 4 「confirms」 gains readiness cue + 「saves」 gains incomplete signal ✓, L48 local-only ✓, L50 wire byte-identical ✓, L52 grounded AI unaffected ✓, L55 繁中 (button label + suffix + toast all 繁中) ✓, L57 Japanese-minimalist (`bg-accent` = palette teal accent; `min-h-14`/`text-lg`/full-width preserved) ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/39-m36-save-ready-ux.md`. Awaiting Cloud Run redeploy.

## 2026-09-27 21:49 HKT — Living-docs sync after M33 / M34 / M35

- `ARCHITECTURE.md` — three targeted updates reconciling code with docs:
  1. Static-reference-tables paragraph (§ SSOT map) — updated the enumeration of which self-lookup metrics have a silent `gradeEntry`. Was: "體脂率 either returns 「無適用參考標準」 in the CardInterpretation payload OR is silent; grip (M28a) and sit-reach (M29) are silent". Now: all 6 self-lookup metrics have silent `gradeEntry` returning `[]`, with 體脂率 (M35) explicitly named alongside grip (M28a) and sit-reach (M29). `interpretCard` fallback still supplies the string in the wire payload — summary + wire byte-identical.
  2. Access-and-privacy model (§ what leaves the device) — the "no logging of payloads" line kept its truth but silently omitted M33/M34's server-side observability. Expanded to state that Cloud Run logs now carry `[generateRichSummary]` and `[extractFromImage]` lines with **durations, counts, phase names, module/screen IDs only** — never card values, prompts, or AI outputs. Also documented the M33 繁中 failure-surface (「摘要生成暫時未能連線（<phase>）」 / 「圖片讀取暫時未能連線」) as the fulfilment path for PRD L52's failed-generation real-error promise.
  3. Grading-rules bullets — the "grip / sit-and-reach return 「無適用參考標準」" line was pre-M28a/M29 truth; the "body-fat returns 「無適用參考標準」" line was pre-M35 truth. Both rewritten to say `gradeEntry` returns `[]` for all three (age/gender-uncollected metrics), with the interpretCard fallback + M27 wire-sanitize path noted.
- `Product_Roadmap.md` — already carries M33, M34, M35 entries from delivery turns. No update needed.
- `CHANGELOG.md` — this entry plus prior M33/M34/M35 delivery entries at top. No older entries need migration to `changelog-archive.md` yet (well under 100).
- `DECISIONS.md` / `adr/` — no new ADR this session; M35 amended `adr/0025-static-reference-vs-ai-advice.md`'s Source change history with one bullet at delivery time. M33 and M34 are hotfix + diagnostics, no new principle. DECISIONS.md index unchanged.
- `PRD.md` — no deviation this session. M35 brought code INTO compliance with PRD L51 (which already covered the 體脂率 self-lookup exception in prose); M33 fulfils L52 for the network-layer failure case; M34 is silent server-side observability with no PRD surface. No log-of-deviation entry needed.
- Timestamp source: container's NTP-synced system clock via `TZ=Asia/Hong_Kong date -Iseconds` → `2026-09-27T21:49:50+08:00`.

## 2026-09-27 01:20 — M35 delivered: 體脂率 grader hotfix

- `src/lib/health/grade.ts` — remove the 4-line synthetic push `out.push({metric: "體脂率", label: "無適用參考標準", tone: "neutral"})` from the `case "tanita"` block in `gradeEntry`. Add an 8-line explanatory comment above the case body mirroring the M28a (grip) / M29 (sit-reach) style — noting the 體脂率 self-lookup matrix (PRD L51 Exception, ADR 0025), the fallback path on the summary side (`gradeByMetric.get("體脂率") ?? "無適用參考標準"` in `interpretCardCore`), and the byte-identical wire-sanitize behaviour.
- Rationale: user reported during phone testing 2026-09-27 that 體脂率 still shows 「無適用參考標準」 despite the app carrying a full TANITA reference matrix on the same card. Investigation traced the label to the synthetic grade the tanita case pushed unconditionally — same class of bug M28a and M29 fixed for grip and sit-reach. PRD L51's Exception clause names 體脂率 as one of six cards whose badge is skipped precisely because a reference IS present; the grader emitting the negative label directly contradicted what the reference matrix on the same card visibly said. M35 completes the M26/M28a/M29 pattern for the one card that was overlooked.
- Surfaces affected: `/tanita` record page grades section (below the form), `/logbook` Tanita row badges, CSV 「等級」 column for 體脂率 — all three stop stamping 「無適用參考標準」 for 體脂率. Consistent with grip and sit-reach post-M28a/M29.
- Summary card `/summary`: zero change. `CARDS_WITH_SELF_LOOKUP` in `summary.tsx` (M26) already hides the 體脂率 badge; `interpretCard`'s 體脂率 branch reads `gradeByMetric.get("體脂率")` and falls back to `?? "無適用參考標準"` (grade.ts:176), so the CardInterpretation payload is byte-identical. Wire-sanitize (`SELF_LOOKUP_CARD_NAMES` in `ai.functions.ts`, M27) still rewrites 體脂率's grade to 「請自行對照下方對照表」 before AI sees it — unaffected.
- Untouched: BMI grader, 內臟脂肪等級 grader (both have real deterministic bands, not on L51 Exception list), BMR/體內水分/SMI (never had a synthetic grader push), all other modules, PRD, storage envelope, wire schema, `REFERENCE_LEAFLET`, `TIPS_REFERENCE`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, `RichSummaryInput` cap, M31 descriptions, M32 required-field set, M33 try/catch, M34 timing logs.
- PRD alignment: L23 NORTHSTAR (trustworthy — no self-contradiction) ✓, L48 local-only ✓, L50 wire byte-identical ✓, L51 Exception directly honoured ✓, L52 grounded AI unchanged ✓, L55 繁中 ✓.
- `adr/0025-static-reference-vs-ai-advice.md`: one line added to Source change history — 「M35 (2026-09-27): 體脂率 grader stop synthesising 「無適用參考標準」 across record / logbook / CSV surfaces, completing the M26 / M28a / M29 pattern.」
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/38-m35-body-fat-grader-fix.md`. Awaiting Cloud Run redeploy.

## 2026-09-27 00:55 — M34 delivered: summary handler wall-clock diagnostics

- `src/lib/health/ai.functions.ts` — timing wrappers added to both AI handlers.
  - `generateRichSummary`: handler-level `handlerT0 = Date.now()` bookend; try/finally-shaped structure logs `[generateRichSummary] total <ms> cards=<N>` on success, `[generateRichSummary] total <ms> cards=<N> (errored)` on throw. Inner `run(prompt, phase)` helper (M33 wrapper) gains `t0 = Date.now()`: success path logs `[generateRichSummary] <phase> ok <ms>`; the M33 `console.error` gets a `failed <ms>:` prefix. One line per fired phase (初次 always; 格式重試 and 合規重試 conditionally per the existing retry cascade).
  - `extractFromImage`: same treatment on the single `generateText(...)` call. Success logs `[extractFromImage] ai ok <ms> module=<mod> screen=<id|all>`; failure logs `[extractFromImage] ai failed <ms>:` prefix on the M33 `console.error`.
- Rationale: M33 landed the try/catch so a server-side throw would surface as a 繁中 toast, but the M33-live test showed something more surprising — three consecutive POST 200 lines in Cloud Run logs against one user's live 「Load failed」 report. Server returned OK every time; the connection died mid-flight (mobile carrier / intermediate proxy dropped TCP before the response body finished arriving; Cloud Run happily wrote 200 into a socket the client had already closed). We can't fix latency without measuring it, and we can't measure it without the handler telling us. M34 makes the handler tell us.
- Design: `console.log` for success, `console.error` for failure (M33 convention preserved). `Date.now()` integer ms — sufficient granularity for 15–60s spans, no `perf_hooks` import. Log shape: handler name, phase, ms, and (for summary) card count / (for extract) module + screen. **No prompt, no card value, no AI response text ever logged** — PRD L47/L48/L50 preserved.
- Untouched: `REFERENCE_LEAFLET`, `TIPS_REFERENCE`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, `TANITA_SCHEMA` (M32), `RichSummaryInput`, `interpretCard`, `SELF_LOOKUP_CARD_NAMES`, `CARDS_WITH_SELF_LOOKUP`, grounding failure logic, JSON-parse fallback, retry cascade, wire payload, `summary.tsx` client, storage envelope v1, all other modules and pages. Zero user-visible change — happy path identical; failure toasts still read the M33 繁中 messages.
- PRD alignment: L13/L47 anonymous ✓, L48 local-only ✓, L50 wire payload byte-identical ✓, L52 failed-generation real error preserved ✓, L55 繁中 (user-facing text unchanged) ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/37-m34-summary-latency-diagnosis.md`. Next-step M35 gated on the numbers this milestone will surface. Awaiting Cloud Run redeploy + one summary attempt to capture the diagnostic.

## 2026-09-27 00:15 — M33 hotfix delivered: AI 呼叫失敗顯示繁中錯誤

- `src/lib/health/ai.functions.ts` — wrap both `generateText(...)` call sites in `try/catch`:
  - `extractFromImage` handler: image-read `generateText` call wrapped; catch logs `console.error("[extractFromImage] AI call failed:", err)` server-side and throws `Error("圖片讀取暫時未能連線，請稍後再試或手動輸入。")` client-side. Existing inner `try/catch` around `screenSchema.parse(...)` untouched — it catches malformed AI responses, this new catch is one layer earlier at the network/API boundary.
  - `generateRichSummary` inner `run(prompt)` helper: gains `phase: string` param and a wrapping `try/catch`. Catch logs `console.error("[generateRichSummary] ${phase} failed:", err)` and throws `Error("摘要生成暫時未能連線（${phase}）。請稍後再試。")`. Three call sites tagged: `"初次"` (line ~291), `"格式重試"` (line ~297), `"合規重試"` (line ~307).
- Rationale: user reported 生成健康摘要 button failing with 「Load failed」 on the live M32 revision (`heartcaring-app-00035-s9n`). Investigation showed both `generateText(...)` calls previously ran without any exception handler — any Google-side failure (auth, quota, model deprecated, Cloud Run 60s timeout, transient network) threw uncaught, the server function 500'd with no CORS body, and iPhone Safari surfaced its network-layer `TypeError: Load failed` string verbatim in `toast.error(e.message)`. This violated PRD L52's 「a failed generation must show a real error rather than invented advice」 for the specific case of a network-layer failure.
- Diagnostic path preserved: `console.error` in Cloud Run logs still carries the full underlying trace (auth error, 429 rate limit, 504 timeout, whatever the actual Google-side reason was) — only the browser-facing toast is genericised. Phase tag in the summary message narrows which of the three retries died on repeat reports.
- Untouched: `REFERENCE_LEAFLET`, `TIPS_REFERENCE`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, `TANITA_SCHEMA` (M32), `RichSummaryInput` (M27a cap 12), `interpretCard`, `SELF_LOOKUP_CARD_NAMES`, `CARDS_WITH_SELF_LOOKUP`, grounding failure logic, JSON-parse fallback, `summary.tsx` client, storage envelope v1, all other modules and pages. No timeout increase, no retry-count change, no model change, no wire-payload change.
- PRD alignment: L23 NORTHSTAR ✓, L50 wire payload (no change) ✓, L52 failed-generation real error ✓ (now honoured for the network-layer case), L55 繁中 throughout ✓.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/36-m33-ai-call-error-surface.md`. Awaiting Cloud Run redeploy.

## 2026-09-26 23:40 — M32 delivered: Tanita 每項必填、部位測量下架

- `src/lib/health/modules.ts` — `tanita.fields[]` trimmed 22 → 12 fields. 10 segmental fields removed entirely (`fatTrunk`, `fatArmR`, `fatArmL`, `fatLegR`, `fatLegL`, `muscleTrunk`, `muscleArmR`, `muscleArmL`, `muscleLegR`, `muscleLegL`). 7 previously-optional fields elevated to required by dropping their `optional: true` and `group: …` markers: `fatMass` (體脂量), `muscleRatio` (肌肉比率), `smi` (肌少症指數), `bodyWaterPct` (身體水分率), `bodyWaterKg` (身體水分量), `bmrKcal` (基礎代謝率 kcal), `bmrKj` (基礎代謝率 kJ). Field order rewritten so each screen's metrics group together. `bodyFat` screen `fields[]` narrowed to `["bodyFat", "fatMass", "weight"]`; `muscle` screen to `["muscleMass", "muscleRatio", "smi", "weight"]`. Other 4 screens unchanged. M31 descriptions preserved verbatim.
- `src/components/health/TanitaRecord.tsx` — deleted the `segmentalGroups` / `collapsedGroups` / `collapsedGroupOrder` block (dead code once no field has `group: "部位…"`). Deleted the `<details>` / `<summary>` collapsed section render. `mainFields` simplified back to `screenFields` (all fields render in the main grid). Removed the `{f.optional && <span>選填</span>}` render — no field is optional anymore. `weight` disabled-repeat pattern preserved (weight still appears on all 6 screens).
- `src/lib/health/ai.functions.ts` — `TANITA_SCHEMA` Zod object trimmed to the 12 kept keys (all `.nullable()`; Zod default `.strip` silently drops any stale AI-echoed segmental keys). Whole-module extraction prompt (`EXTRACTION_FIELDS.tanita`) rewritten to list the 12 keys with 繁中 hints. Per-screen prompts (`TANITA_SCREEN_PROMPTS.bodyFat` and `.muscle`) rewritten to reflect the narrowed screen field sets; `.muscle` gains `smi` (was missing from the prompt in M27 despite being on the screen).
- Save semantics: `useRecordState.submit()` uses the existing `!f.optional` gate — with zero optional fields, all 12 must have valid values before save. Empty required field shows inline 「請輸入數值」 error and blocks the save button.
- Rationale: user reported 必填 vs 選填 ambiguity on the Tanita form. The `<details>` collapsed section hid 10 fields the user considered noise, and the 選填 tag on 7 core metrics (BMR, body-water, SMI, muscle-ratio, body-fat-mass) sent a mixed message about which fields belonged on a record. M32 removes both — all fields on the page are required, and the two segmental sections are gone.
- Untouched: `REFERENCE_LEAFLET`, `TIPS_REFERENCE`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, `Agency` union, `SELF_LOOKUP_CARD_NAMES`, `CARDS_WITH_SELF_LOOKUP`, `RichSummaryInput` cap (12 from M27a), `interpretCard` fallback strings, grader logic, storage envelope v1, other 3 modules and their pages, cover / logbook / summary chrome, M30 bottom nav, M31 descriptions.
- Storage: no migration. Old localStorage entries carrying `fatTrunk` / `muscleArmR` / … stay in place — reader path is `mod.fields.filter(f => e.values[f.key] != null)`, so orphan keys are invisible in history list and CSV export.
- PRD alignment: L13 anonymous ✓, L48 local-only (no schema bump) ✓, L50 wire payload (segmental keys leave the schema; other 12 unchanged) ✓, L51 grading + Exception (unchanged) ✓, L52 grounded AI (leaflet/tips byte-identical) ✓, L55 繁中 ✓, L57 Japanese-minimalist (cleaner page) ✓. Roadmap M17 「16 fields optional」 clause superseded — noted in the M32 roadmap entry.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/35-m32-tanita-required-fields.md`. Awaiting Cloud Run redeploy.

## 2026-09-26 22:55 — M31 delivered: Tanita 6-screen descriptions

- `src/lib/health/modules.ts` — `ScreenDef` interface gains `description?: string` (optional, UI-only, ADR 0025 forbids these strings entering AI grounding). All 6 tanita screens get a short 繁中 description:
  - **bodyFat 體脂率**: 「脂肪佔體重的百分比。適度脂肪能保護身體，但過高會增加心血管疾病、糖尿病等風險。」
  - **muscle 肌肉量**: 「包含全身肌肉及其中水分。增加肌肉能提升基礎代謝率，增加熱量消耗並幫助減脂。」
  - **water 身體水分**: 「水分佔體重的百分比，與體脂肪呈反比。受日常作息影響波動，需長期觀察以維持機能正常運作。」
  - **visceral 內臟脂肪**: 「腹腔器官周圍的脂肪，隨年齡易堆積。保持健康數值能有效降低心血管疾病與糖尿病風險。」
  - **bmr 基礎代謝率（BMR）**: 「維持靜息狀態生理運作（如心跳、呼吸）的最低熱量。肌肉量越高，BMR 越高，越易消耗熱量。」
  - **bmi BMI**: 「身高與體重的標準化比例，是最常見的基礎健康評估指標。」
- `src/components/health/TanitaRecord.tsx` — renders `{screen.description && <p className="mt-1 text-base leading-relaxed text-muted-foreground">{screen.description}</p>}` directly under the numbered `<h2>` heading, above the `<ImageDrop>`. Optional guard keeps future ScreenDef consumers without descriptions unaffected.
- Fills the info-gap that grip and sit-reach already close via their module-level `infoText` popover — Tanita has 6 screens so each gets its own inline description instead of a single popover.
- Rationale: users reported no guidance on what each screen measured before recording; investigation confirmed 6 screens had zero explanation text anywhere in the UI (only a numbered title + input). This milestone populates the existing `ScreenDef` shape (extended with optional `description`) with your approved verbatim wording.
- Untouched: `REFERENCE_LEAFLET`, `TIPS_REFERENCE`, `allowedNumbers`, `SENSITIVE_LABEL_PATTERN`, `Agency` union, `SELF_LOOKUP_CARD_NAMES`, `CARDS_WITH_SELF_LOOKUP`, `TANITA_SCHEMA`, AI extraction prompt hints, per-screen photo extraction (M19; reads `ScreenDef.fields[]` only, never `description`), storage envelope v1, all other modules and pages, grader logic for BMI + 內臟脂肪.
- Audits (both green): sensitive-word — zero 男士/女士/長者/學生 hits in any of the 6 texts. Numbers-in-JSX-only — zero digits in any of the 6 texts after the visceral text was amended (「（等級 1-59）」 suffix dropped mid-plan on user's request).
- No new ADR (populates an existing optional interface field — not a new principle).
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/34-m31-tanita-screen-descriptions.md`. Awaiting Cloud Run redeploy.

## 2026-09-26 21:20 — Living-docs sync after M30

- `ARCHITECTURE.md` — appended one sentence to the routes/navigation paragraph naming the M30 post-record bottom `<nav>` block (「返回健康紀錄簿」 + 「查看健康摘要」) rendered by `RecordModule.tsx` and `TanitaRecord.tsx` above the privacy footer. Notes it is JSX-only, reads no state, and honours USER JOURNEY 5 + 7 at the natural post-save touchpoint. Top back-link kept for scrolled-up users.
- No new ADR file this session (M30 is not a new principle — it extends existing PRD USER JOURNEY promises).
- No PRD change (M30's behaviour is already implied by USER JOURNEY 5 「can return directly to 「健康紀錄簿」」 and 7 「reads a plain-language health summary」).
- CHANGELOG delivery entry for M30 (20:41) already present at top.
- Roadmap M30 entry already appended with plan link (`plan/33-*.md`).
- DECISIONS.md needs no update.
- CLAUDE.md deploy runbook current — no new deploy incident (M28 + M28a + M29 + M30 all committed but still awaiting Cloud Run redeploy after rev 29 shipped M27+M27a).

## 2026-09-26 20:41 — M30 delivered: post-record bottom navigation

- `src/components/health/RecordModule.tsx` (serves `/blood-pressure`, `/grip`, `/sit-and-reach`) and `src/components/health/TanitaRecord.tsx` (serves `/tanita`) — both gain a new bottom `<nav aria-label="下一步">` block above the existing `<PrivacyNotice>` footer, containing two links:
  - 「← 返回健康紀錄簿」 (TanStack Router `<Link to="/logbook">`)
  - 「查看健康摘要 →」 (TanStack Router `<Link to="/summary">`)
- Both files add `FileText` to their existing `lucide-react` import (`ArrowLeft` already imported for the top-of-page back-link).
- Nav uses `text-lg` (50+-friendly), `py-3` (≥48px touch target), `focus-visible:ring-2 focus-visible:ring-ring` (keyboard-visible focus), `border-t border-border pt-6` (light divider from 歷史紀錄), `flex flex-wrap justify-center` (wraps to 2 lines on iPhone SE if needed). Token-based colors adapt to dark mode automatically. Icons carry `aria-hidden="true"`.
- Inline comment names USER JOURNEY 5 and 7 as the promises this milestone serves.
- Rationale: the top-of-page back-link only helps users scrolled up at the header. After saving and scrolling through 歷史紀錄, the user's thumb sits at the bottom of the page. This nav puts both destinations (return to logbook, jump to summary) where the user actually is at the moment of a fresh save. Bug caught in phone testing (previous investigation surfaced "no next-step prompt after saving").
- Untouched: top back-link (kept as-is), BP 「複查安排」 panel (complementary — task vs navigation), save flow, toast, form clearing, delete-entry, `<PrivacyNotice>`, 歷史紀錄 list, all other pages, all storage, all AI, all grading, all reference tables.
- No new state / hook / component (two call sites of an identical block; extract to a `<PostRecordNav>` component only when a 3rd caller appears).
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/33-m30-post-record-navigation.md`. Awaiting Cloud Run redeploy.

## 2026-09-26 19:31 — Living-docs sync after M29

- `ARCHITECTURE.md` static-reference-tables SSOT bullet extended from 5 → 6 cards. Names 坐地前伸 + `sitreach.ts` as the 6th self-lookup card. Adds notes: `matchesCell`'s `≤N` branch admits negative distance readings cleanly; sit-reach's silent `gradeEntry` parallels M28a's grip; the 2 verbatim source gaps (男 30-39 @ 30 cm; 男 60-69 @ 22 cm) are surfaced by footer text; M29 closes the reference-completion program for all 4 record modules.
- No new ADR file this session — ADR 0025's Source change history grew with the M29 entry (already committed with the milestone).
- No PRD change beyond L51 Exception list extension to 6 cards (already committed with M29).
- CHANGELOG delivery entry for M29 (19:20) already present at top.
- Roadmap M29 entry already appended with plan link (`plan/32-*.md`).
- DECISIONS.md needs no update (no new ADR file).
- CLAUDE.md deploy runbook current — no new deploy incident (M28 + M28a + M29 all committed but still awaiting Cloud Run redeploy after this docs sync; last deploy was rev 29 shipping M27+M27a).

## 2026-09-26 19:20 — M29 delivered: 坐地前伸 self-lookup card (職安局 5-tier)

- **NEW** `src/lib/health/sitreach.ts` — 職安局 5-tier × 5-age × 2-gender norms encoded verbatim from source. Exports `SIT_REACH_CATEGORIES`, `SIT_REACH_AGE_BANDS`, `SIT_REACH_NORMS` matrix, `ageToSitReachBand`, `classifySitReach(age, gender, distanceCm)`. Runtime callers = none (ADR 0025); function ships as boundary-logic SSOT for future PRD-authorised paths or build-time tests. Header comment documents the 2 verbatim source gaps (男 30-39 @ 30 cm; 男 60-69 @ 22 cm). Classifier explicitly returns `undefined` for the gap values (fails safe).
- `src/lib/health/grade.ts` — `case "sitreach":` returns `[]` (matches M28a grip pattern; label removed from record/logbook/CSV). Interpretation card's `action` string updated from 「規律伸展可改善柔軟度…」 to 「請對照下方 職安局 參考表自行對照」. Interpretation branch preserves `grades[0]?.label ?? "無適用參考標準"` fallback → summary payload byte-identical → wire-sanitize (M27) unchanged. Also collapsed the shared grip/sitreach case's `if (mod.id === "grip") return []; return [{...}]` to just `return []` since both branches now return the same thing — one-line simplification.
- `src/lib/health/ai.functions.ts` — `SELF_LOOKUP_CARD_NAMES` grows to 6 (adds 「坐地前伸」). Wire payload for sit-reach cards now sends `"請自行對照下方對照表"` in place of `"無適用參考標準"`.
- `src/lib/health/charts.ts` — 【坐地前伸測試參考】 leaflet sentence appends source-neutral pointer 「本應用程式在坐地前伸卡片下方展示 職安局 標準參考供用家自行對照。」 No specific numbers enter leaflet (ADR 0025).
- `src/routes/summary.tsx` — imports `SIT_REACH_NORMS`/`SIT_REACH_AGE_BANDS`/`SIT_REACH_CATEGORIES`. `CARDS_WITH_SELF_LOOKUP` grows to 6. `parseSitReachValue = parseLeadingNumber` alias. `buildSitReachDisplay(gender)` derives display cells (欠佳 → `≤N cm`, 尚可/常/良好 → `lo-hi cm`, 優異 → `≥N cm`) from source-of-truth `SIT_REACH_NORMS`. New `SitReachMatrixTable` + `SitReachStandardTable` components structurally mirror the handgrip pair. New render gate `{card.name === "坐地前伸" && <SitReachStandardTable userValue={parseSitReachValue(match?.value)} />}`. Footer: 「數值以厘米（cm）為單位，可為負數」 + 20-69 coverage + 2-gap note + 「資料來源：職業安全健康局（職安局）」.
- `PRD.md` L51 Exception clause extended: 6 cards now listed (adds 坐地前伸 alongside 手握力 under 職安局).
- `adr/0025-static-reference-vs-ai-advice.md` — new M29 Source change history entry recording the extension, the classifier's non-runtime-caller policy, and the 2 verbatim source gaps.
- Untouched: `Agency` union (職安局 already present) · `SENSITIVE_LABEL_PATTERN` · `allowedNumbers` (leaflet numbers byte-identical; new pointer sentence contains no digits) · `richGroundingFailure` · `selectRelevantTips` · storage envelope v1 · `distance` field key + numeric shape · CSV export path · wire cap 12 (M27a — sit-reach already counted).
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/32-m29-sitreach-self-lookup.md`. Awaiting Cloud Run redeploy.

## 2026-09-26 18:58 — Living-docs sync after M28 + M28a

- `ARCHITECTURE.md` static-reference-tables SSOT bullet extended from 4 cards to 5. Names 手握力 + 職安局 as the 5th self-lookup card and its dedicated `src/lib/health/handgrip.ts` home. Names all 4 `matchesCell` display formats (`<N`, `≤N`, `≥N`, `N-M`). Documents the M28a `gradeEntry` split: grip now returns `[]` so its 「無適用參考標準」 label disappears from record/logbook/CSV while summary-card payload stays byte-identical via `interpretCard`'s hardcoded fallback (wire-sanitize preserved). Documents the M28a `min-w-0` layout fix on the summary card's flex child.
- No new ADR file this session — ADR 0025's Source change history grew (M28 entry) but no new principle. DECISIONS.md index needs no update.
- No PRD change — L51 Exception clause was extended in M28 to list 5 cards; M28a preserves that behaviour (the clause's "grader itself is unchanged" for Exception cards continues to hold — returning `[]` is an absence of grade, not a re-grade).
- CHANGELOG delivery entries for M28 (11:30) and M28a (18:53) already present at top.
- Roadmap M28 + M28a entries already appended with plan links (`plan/30-*.md`, `plan/31-*.md`).
- CLAUDE.md deploy runbook current — no new deploy-time incident to record (M28 + M28a still awaiting Cloud Run redeploy after this docs sync).

## 2026-09-26 18:53 — M28a delivered: hotfix for grip label + summary card overflow

Two bugs caught in M28 phone testing.

**Bug 1 — 「無適用參考標準」 across non-summary pages for grip.** `gradeEntry` for `case "grip"` unconditionally returned `[{label:"無適用參考標準"}]`. After M28 gave grip a 職安局 self-lookup table under the summary card, that label surfaced on `/handgrip` (record preview above 儲存紀錄), `/logbook` grip rows, and CSV grade column — all now factually wrong. Fix: split the shared grip/sitreach case in `src/lib/health/grade.ts` so grip returns `[]` (an absence, not a null-grade label); sit-reach unchanged. Ripple: record preview, logbook badge, and CSV grade cell for grip all become empty — consistent with "app doesn't grade this" spirit of the M28 Exception. Summary card behaviour byte-identical: `interpretCard`'s grip branch reads `grades[0]?.label ?? "無適用參考標準"`, so with `[]` it falls back to the hardcoded string; wire-sanitize (M27) still transforms it for Gemini; CardInterpretation SSOT preserved.

**Bug 2 — summary matrix tables bled past white card border on narrow phones.** Card render at `src/routes/summary.tsx:~705` had a `flex-1` div wrapping the card body. Flex children default to `min-width: auto`, letting wide content (M28 handgrip 5-col × 5-age table most visibly) expand the div past its calculated flex share and drag the inner `overflow-x-auto` wrapper outside the card's `p-5` padding. Fix: add `min-w-0` to the `flex-1` div — standard Tailwind flexbox pattern that constrains the flex child so the overflow wrapper properly clips and scrolls. Applies to every summary card; any wide body-content (tables, long values, long AI prose) now scrolls inside the card boundary instead of bleeding out. Narrow content unaffected.

Untouched: storage envelope (v1) · field key `grip` · numeric shape · leaflet numbers (`allowedNumbers` byte-identical) · sensitive-word filter · `Agency` union · wire cap (M27a's 12) · sit-reach behaviour · other cards' render logic. PRD L51 Exception clause needs no update (grip already listed since M28); the clause's "grader itself is unchanged" is preserved — returning empty is an absence of grade (which the Exception already promises), not a re-grading with different rules.

Verified: `bunx tsc --noEmit` clean, `bun run build` clean. Plan: `plan/31-m28a-grip-badge-and-table-overflow.md`.

## 2026-09-26 11:30 — M28 delivered: 手握力 self-lookup card (職安局 5-tier)

- **NEW** `src/lib/health/handgrip.ts` — 職安局 5-tier × 5-age × 2-gender norms encoded verbatim from source JSON. Exports `HAND_GRIP_CATEGORIES` (`["欠佳","尚可","常","良好","優異"]`), `HAND_GRIP_AGE_BANDS` (`["20-29",...,"60-69"]`), `HAND_GRIP_NORMS` matrix, `ageToHandGripBand`, `classifyHandGrip(age, gender, combinedKg)`. Header comment: **runtime callers = none** (PRD L13/L50 forbid programmatic classification without collected age/gender); function kept as boundary-logic SSOT for a future PRD-authorised path or build-time tests.
- `src/lib/health/modules.ts` — grip field label 「手握力」 → 「手握力（左右合計）」; max bumped 100 → 200 kg to accommodate elite combined values (male 20-29 excellent ≥92; realistic combined ceilings well above 100). Storage key and numeric shape unchanged.
- `src/lib/health/ai.functions.ts` — extraction hint 「grip（手握力 kg）」 → 「grip（手握力 kg，左右手合計數值）」 so photo/voice extraction sums both hands. `SELF_LOOKUP_CARD_NAMES` grows to 5 entries (adds 「手握力」).
- `src/lib/health/grade.ts` — grip card's `action` 「可透過握力球、阻力帶等訓練改善手握力」 → 「請對照下方 職安局 參考表自行對照」. Grade/range/note unchanged; wire-sanitize (M27) transforms grade before Gemini sees it.
- `src/lib/health/charts.ts` — 【手握力參考】 leaflet sentence appends source-neutral pointer 「本應用程式在手握力卡片下方展示 職安局 標準參考供用家自行對照。」 No specific numbers enter leaflet (ADR 0025 preserved).
- `src/routes/summary.tsx` — `matchesCell` gains new `≤N` branch (before existing `<N` branch); no existing table cell used `≤`, so zero regression risk. `CARDS_WITH_SELF_LOOKUP` grows to 5 entries. Import `HAND_GRIP_NORMS`/`HAND_GRIP_AGE_BANDS`/`HAND_GRIP_CATEGORIES` from `handgrip.ts`. `buildHandGripDisplay(gender)` derives the display matrix (欠佳 → `≤N kg`, 尚可/常/良好 → `lo-hi kg`, 優異 → `≥N kg`) from the source-of-truth `HAND_GRIP_NORMS`. New `HandGripMatrixTable` + `HandGripStandardTable` components mirror the SMI structure; new render gate `{card.name === "手握力" && <HandGripStandardTable userValue={parseHandGripValue(match?.value)} />}`. `parseHandGripValue` = alias of `parseLeadingNumber`. Footer: L+R clarification + 「本表涵蓋 20-69 歲；70 歲或以上請以 60-69 歲欄作參考並諮詢醫生」 + 「資料來源：職業安全健康局（職安局）」.
- `PRD.md` L51 Exception clause extended: list now names 5 cards (adds 「手握力」 with 職安局 attribution alongside the 4 TANITA cards).
- `adr/0025-static-reference-vs-ai-advice.md` — new M28 Source change history entry recording the extension + the design decisions (utility ships without runtime caller; `≤N` regex branch; L+R label change; two Sets grow to 5).
- Untouched: `Agency` union (職安局 already present per ADR 0019) · `SENSITIVE_LABEL_PATTERN` · `allowedNumbers` (leaflet numbers byte-identical) · `richGroundingFailure` · `selectRelevantTips` · storage envelope (v1; grip field key + numeric shape unchanged) · CSV export path · wire cap (M27a's 12 still enough — grip already counted).
- Migration note: old records with single-hand grip values (before this milestone the field was ambiguous) remain valid numeric data and export cleanly. Users who entered single-hand values will visually land in 欠佳 against L+R norms; footer + this changelog document the L+R expectation so users can re-record combined values if desired. Nothing dropped.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Full plan: `plan/30-m28-handgrip-self-lookup.md`. Awaiting Cloud Run redeploy.

## 2026-09-26 11:16 — Living-docs sync after M27 + M27a deploy

- `ARCHITECTURE.md` — static-reference-tables SSOT bullet updated: was 「currently: the TANITA 標準脂肪量 matrix under the 體脂率 summary card」 (M26-era). Now names all 4 cards (體脂率, 基礎代謝率, 體內水分, 肌少症指數), the split between `matchesCell`-based ★ overlay (body-fat / water / SMI) vs BMR per-cell delta (TANITA publishes BMR as point values not tier ranges), the split between cards where `gradeEntry` returns `"無適用參考標準"` (體脂率) vs is silent (BMR / water / SMI produce cards directly in `interpretCard`), and the mirrored Sets `CARDS_WITH_SELF_LOOKUP` (client) + `SELF_LOOKUP_CARD_NAMES` (server, wire-sanitize).
- `CLAUDE.md` — deploy runbook incident-references line extended with today's project-ID prompt trap (Cloud Shell asked `Please specify a project ID:` mid-deploy for rev 29; fix: type the project ID at the prompt, or run `gcloud config set project` once).
- All other living docs already synced: `PRD.md` L51 lists all 4 exception cards (M27); `Product_Roadmap.md` has M27 + M27a entries; `ADR 0025` has M27 + M27a Source change history entries; `DECISIONS.md` needs no update (no new ADR file); plans 28 + 29 exist. Rev-29 deploy entry already at top of CHANGELOG.

## 2026-09-26 11:14 — Deploy M27 + M27a to Cloud Run (rev 29)

- Deployed `cloud-run-prep` HEAD (commit `d463173`) to Cloud Run service `heartcaring-app`, region `asia-east1`, project `gen-lang-client-0014480564`. New active revision: `heartcaring-app-00029-qs5` serving 100% of traffic on heartcaring.fit.
- Ships live: M27 (BMR + 體內水分 + SMI summary cards with TANITA reference tables + value overlay + wire-payload sanitize + M26 badge-omission extended to 4 cards) and M27a (wire-payload card cap raised 6 → 12 to accommodate the added cards without silent rejection).
- Cloud Shell prompted for project ID this time (unlike rev 27/28) — resolved by typing `gen-lang-client-0014480564` at the prompt. `gcloud config set project` would prevent re-prompting.
- No auth trap this time — `gh auth login` from rev 27 stayed cached.

## 2026-09-24 18:45 — M27a delivered: wire-payload card cap 6 → 12 (hotfix)

- `src/lib/health/ai.functions.ts` — `RichSummaryInput.cards.max(6)` → `.max(12)`.
- `ARCHITECTURE.md` L103 — cap number updated in-place from 6 to 12, with rationale noting the M27 additions.
- Caught in M27 peer review: after M27 added 3 potential Tanita cards (BMR + 體內水分 + SMI), worst-case card count reached 9 (6 Tanita + BP + grip + sitreach). Zod `.max(6)` rejected the payload → `/summary` generate silently failed with a toast error for any user with a full Tanita reading plus another module recorded. Cap raised to 12 (9 needed + 3 slack) so every card the user recorded reaches the AI without truncation.
- Untouched: storage, wire shape (per-card fields still `.max(20/80/40/120/100/100`), grounding, sanitize, per-card sanity limits.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean.
- Plan: `plan/29-m27a-card-cap.md`. Ships as part of the same deploy as M27 (both awaiting Cloud Run redeploy).

## 2026-09-24 18:15 — M27 delivered: TANITA reference completion (BMR + 體內水分 + SMI)

- `src/lib/health/modules.ts` — new field `smi` (`肌少症指數（SMI）`, `kg/m²`, optional, 3-12 range, 0.01 step) in the Tanita fields array; added to the `muscle` screen's per-screen extraction fields.
- `src/lib/health/ai.functions.ts` — `TANITA_SCHEMA` gains `smi: z.number().nullable()`. Added wire-payload sanitize: `SELF_LOOKUP_CARD_NAMES` set mirrors `summary.tsx`'s `CARDS_WITH_SELF_LOOKUP`; for cards in the set, `cardsText` transforms `grade` → `"請自行對照下方對照表"` and drops `note`. Preserves local `CardInterpretation` (SSOT); only the transient wire form changes. Reduces AI-prose echo of `「無適用參考標準」` from the 4 self-lookup cards.
- `src/lib/health/grade.ts` — three new card producers in the Tanita case, all following the body-fat shape (grade `"無適用參考標準"`, action `"請對照下方 TANITA 參考表自行對照"`): 基礎代謝率 (value `${bmrKcal.toLocaleString()} kcal`), 體內水分 (value `${bodyWaterPct}%`), 肌少症指數 (value `${smi} kg/m²`, only when `smi != null`). Each only produced when the underlying value exists.
- `src/routes/summary.tsx` — new `CARDS_WITH_SELF_LOOKUP` Set with 4 card names drives both the M26 badge-omission gate and (mirrored in `ai.functions.ts`) the wire-sanitize. `matchesCell` generalized to accept decimals and any trailing unit text (regex no longer anchors on `%$`). Added components `BmrStandardTable` (per-cell delta rather than tier overlay — BMR is TANITA point values, not ranges), `WaterStandardTable` (男/女 2-tier with ★ overlay), `SmiStandardTable` (男/女 2-tier with ★ overlay). Consolidated 4 numeric parsers to shared `parseLeadingNumber` (aliased as `parseBodyFatValue`/`parseWaterPercentValue`/`parseSmiValue`/`parseKcalValue`; also handles thousands separator for BMR kcal values). Four new render gates: one per self-lookup card. Old M25 body-fat behaviour preserved verbatim.
- `src/lib/health/charts.ts` — leaflet 【身體水分參考】 and 【基礎代謝率參考】 sentences append a source-neutral pointer to their new tables. Added new 【肌少症指數參考】 block describing SMI at leaflet level. No specific numbers enter leaflet (ADR 0025 preserved).
- `PRD.md` L51 Exception clause updated: list now names 體脂率, 基礎代謝率, 體內水分, 肌少症指數 (was: 「currently only 體脂率」).
- `adr/0025-static-reference-vs-ai-advice.md` — two new Source change history entries: extension of self-lookup pattern to 4 cards + M27 wire-payload sanitize. ADR 0025 principle statement unchanged.
- Storage: no schema version bump. `smi` field is nullable; old records read `values["smi"]` as undefined, interpretCard skips the card, CSV shows blank in the new column. Zero migration.
- Verified: `bunx tsc --noEmit` clean, `bun run build` clean. TANITA numbers used are the widely-published defaults; user should verify against their specific TANITA sheet post-deploy.
- Full plan: `plan/28-m27-tanita-reference-completion.md`. Awaiting Cloud Run redeploy.

## 2026-09-24 17:51 — Living-docs sync after M26 deploy + post-deploy investigation trail

- `ARCHITECTURE.md` — static-reference-tables SSOT bullet extended: notes that after M26 the summary card omits the grade-badge chip for cards carrying such tables (the CardInterpretation payload still carries `"無適用參考標準"`; only the visual chip is skipped). Points at PRD L51 Exception.
- `CHANGELOG.md` — this entry captures the post-deploy investigation trail: after rev 27 shipped, user reported still seeing 「無適用參考標準」 on the body-fat card. Bundle-level verification (curl of `summary-DfDGdCpq.js`) confirmed the summary bundle contains zero occurrences of the string — the badge chip cannot be rendered from the summary route. The phrase persists only in `modules-CV-1ehYH.js` (where `grade.ts` is bundled — expected, `interpretCard` still populates the field per M26 SSOT preservation). Remaining user sighting is therefore one of: (a) browser cache holding pre-M26 bundle on the phone, or (b) AI-generated prose echoing the phrase — the wire payload still sends `體脂率：25%（無適用參考標準）` in the prompt, plus a `note` field `"無適用參考標準（需要年齡及性別）"`, so Gemini has the phrase twice in its input and may paraphrase it back. Pending user screenshot to determine A vs B; if B, a follow-up milestone will sanitize what the AI sees for 體脂率 (drop the negative grade + note from that card's wire payload, or replace with source-neutral text).
- No new ADR this session. PRD, Roadmap, ADR 0025 all already synced from prior turns. `DECISIONS.md` index needs no change.

## 2026-09-24 17:21 — Deploy M26 to Cloud Run (rev 27)

- Deployed `cloud-run-prep` HEAD (commit `3911446`) to Cloud Run service `heartcaring-app`, region `asia-east1`, project `gen-lang-client-0014480564`. New active revision: `heartcaring-app-00027-wwc` serving 100% of traffic on heartcaring.fit.
- Ships live: 體脂率 summary card no longer renders the 「無適用參考標準」 grade badge chip (M26). The card still shows value, date, AI interpretation, TANITA disclosure with ★ overlay from M25, and the legend. Other cards' badges unchanged.
- Cloud Shell auth trap from rev 26 did not recur — cached `gh` credentials worked first try.

## 2026-09-24 17:15 — M26 delivered: drop grade badge on 體脂率 card

- `src/routes/summary.tsx` — `<GradeBadge>` render gated with `card.name !== "體脂率"`. Inline comment explains the rationale and points to ADR 0025 + PRD L51 footnote. `match.value`, `match.recordedAt`, `card.interpretation`, `<BodyFatStandardTable />` — all still render.
- `PRD.md` L51 — Exception clause added: cards carrying an in-app static self-lookup reference table may omit the visual badge. Grader itself unchanged; only the chip is skipped.
- `adr/0025-static-reference-vs-ai-advice.md` — new Source change history entry recording the M26 badge omission and the corresponding PRD L51 amendment.
- Rationale: after M23-M25, the 體脂率 card carries a full TANITA reference matrix with per-cell value overlay directly below the card. Showing a 「無適用參考標準」 chip above those very reference numbers was visually confusing; the AI-generated card interpretation text already carries the「目前無單一適用標準」message in prose.
- Untouched by design: `gradeEntry` / `interpretCard` (still returns `"無適用參考標準"` in the payload) · `BandGrade` union · `note` field · other cards' badges (BP, BMI, 內臟脂肪, 手握力, 坐地前伸, other Tanita metrics — all render badges as before) · storage · CSV · wire payload · AI grounding · sensitive-word filter · `allowedNumbers`.
- Verified: type-check clean, build ✓. Change is a single conditional in JSX; downstream data (`match.grade`, `match.tone`) remains populated on the CardInterpretation object for future callers.
- Full plan: `plan/27-m26-drop-body-fat-badge.md`. Awaiting Cloud Run redeploy.

## 2026-09-24 16:58 — Living docs sync after M23-M25 deploy

- `ARCHITECTURE.md` — added a new SSOT bullet under 「Single sources of truth in code」 for **static reference tables** (currently the TANITA 標準脂肪量 matrix under 體脂率). Documents the ADR 0025 rule (JSX only, never enters `REFERENCE_LEAFLET`/`TIPS_REFERENCE`), the source-neutral AI pointer requirement, and the M25 value-overlay mechanism (`parseBodyFatValue` → `BodyFatStandardTable` highlights user's cell without grading).
- `CLAUDE.md` — deploy runbook's incident-references line extended with today's Cloud-Shell-auth trap (session-fresh Cloud Shell had no cached `gh` state; `git pull` silently prompted for username; if operator paste-typed through it, deploy shipped stale local `HEAD` — first rev 00025-sjv today was M22-era for this exact reason). Fix procedure written inline.
- CHANGELOG already carried all delivery entries (M23 11:35, M24 13:00, M25 14:00) and the rev-26 deploy entry (15:15). No new ADR this session (0025 was M23's, updated for M24). Roadmap already lists M23-M25 with plan links. DECISIONS.md already indexes ADR 0025. PRD.md unchanged — no deviations.

## 2026-09-24 15:15 — Deploy M23 + M24 + M25 to Cloud Run (rev 26)

- Deployed `cloud-run-prep` HEAD (commit `032723a`) to Cloud Run service `heartcaring-app`, region `asia-east1`, project `gen-lang-client-0014480564`. New active revision: `heartcaring-app-00026-tgg` serving 100% of traffic on heartcaring.fit.
- Ships live: M23 (體脂率 grounded HA source + static reference table under card), M24 (static table source swapped from HA to TANITA — 5-tier × 3-age × gender matrix), M25 (user-value overlay on the TANITA chart + AI pointer strings neutralized so leaflet/tip no longer name a specific agency for the on-screen table).
- Three milestones shipped in one deploy after Cloud Shell auth trap: the first deploy attempt (rev 00025-sjv) went out from a stale local checkout (HEAD at `ac92b7b`, M22 era) because `git pull` failed silently — Cloud Shell's cached HTTPS credentials were gone. Root cause: session-fresh Cloud Shell no longer had `gh auth` state. Fix: `gh auth login` via device flow + `gh auth setup-git`, then `git pull --ff-only` to fast-forward from `ac92b7b` → `032723a`, then re-deploy. Rev 00025 was M22-era; rev 00026 is the real M23+M24+M25.
- Verified: `git rev-parse HEAD` = `032723a...` matches source-of-truth commit locally in Cloud Shell.

## 2026-09-24 14:00 — M25 delivered: value overlay on TANITA chart + AI pointer fix

- `src/routes/summary.tsx` — `BodyFatMatrixTable` and `BodyFatStandardTable` now take a `userValue` prop. When the user has a recorded 體脂率, each of the 30 cells (across both matrix tables) whose range contains that value renders with `bg-primary/10 font-semibold text-foreground` + trailing ★. A legend line reads 「★ = 你的 X% 落於此區間。請於男性／女性表中，找你性別及年齡對應的欄，欄中★格即為你的參考分級。」 Added helpers `matchesCell` (parses `<N%` / `N-M%` / `≥N%` display strings; integer-inclusive bounds; 向下取 boundary rule) and `parseBodyFatValue` (extracts the leading number from the card's display string). Call site passes `parseBodyFatValue(match?.value)` — undefined when no reading exists, in which case the table renders in M24-style with no highlights and no legend.
- `src/lib/health/charts.ts` — fixed the M24 peer-review blocker: `REFERENCE_LEAFLET` body-fat sentence and the 體脂率參考標準 tip no longer name the on-screen table as 醫管局's. Leaflet: 「本應用程式在體脂率卡片下方展示標準脂肪量對照表」 (was: 「醫管局公開的標準脂肪量對照表」). Tip: 「宜對照卡片下方之對照表」 (was: 「宜對照醫管局提供的對照表」). The tip's factual attribution 「醫管局及世衞太平洋建議提供性別和年齡分組的參考範圍」 is preserved — this credits HA for a recommendation, not for the table. `sources` array still points at the HA article (grounding source for the abstract principle).
- Untouched: `Agency` union, `SENSITIVE_LABEL_PATTERN`, `allowedNumbers`, `richGroundingFailure`, `selectRelevantTips`, `gradeEntry`/`interpretCard` (badge stays 「無適用參考標準」), storage, CSV, wire payload, ADR 0019/0023/0024/0025 principles.
- Zero user input added — no dropdown, no form, no gender/age collected. The overlay uses only the body-fat value the app already stores; user self-identifies which column applies to them by looking at the row that matches their own demographic.
- Verified: `tsc --noEmit` clean, `bun run build` clean (1.37s). Regex-based cell matching hardened against `noUncheckedIndexedAccess` (uses `.exec()` + optional-chaining guards).
- Full plan: `plan/26-m25-body-fat-value-highlight.md`. Awaiting Cloud Run redeploy.

## 2026-09-24 13:00 — M24 delivered: TANITA 5-tier static reference replaces HA table under 體脂率

- `src/routes/summary.tsx` — swapped the static 標準脂肪量 table's data source from HA (醫管局 2-tier × 2-age) to TANITA〈身體組成數據參考指標〉 (5-tier × 3-age × gender). New constants `TANITA_AGE_BUCKETS`, `TANITA_TIERS`, `BODY_FAT_MALE`, `BODY_FAT_FEMALE` typed as `BodyFatMatrix`. `BodyFatStandardTable` now renders two stacked matrix tables (男性, 女性) inside the same `<details>` shell. `<summary>` text now reads 「查看標準脂肪量對照表（TANITA）」; footer credit line is plain text (no external link — TANITA's reference sheet has no stable public URL). Old `BODY_FAT_STANDARD_ROWS` and `BODY_FAT_STANDARD_URL` constants removed.
- `adr/0025-static-reference-vs-ai-advice.md` — appended a Source change history section recording the 2026-09-24 static-source move to TANITA, with rationale (users log with a Tanita scale whose on-screen classification is Tanita's own 5-tier scheme; the reference table now matches the device). ADR principle itself unchanged.
- Rationale: users' 身體組成分析儀 shows the 5-tier Tanita classification directly (消瘦 / 標準健康型 / 標準警戒型 / 微胖 / 肥胖). Prior HA-sourced 2-tier table (健康 / 偏高) could not map 1:1 onto what the scale displays. Now what the user reads off their scale maps directly onto a cell.
- Untouched by design: `TIPS_REFERENCE` 「體脂率參考標準」 (HA article still grounds AI tips) · `REFERENCE_LEAFLET` body-fat line · `Agency` union · `selectRelevantTips` mapping · `SENSITIVE_LABEL_PATTERN` · `allowedNumbers` · `richGroundingFailure` · `gradeEntry`/`interpretCard` (badge still 「無適用參考標準」) · storage, CSV export, logbook.
- ADR 0025's Source-may-diverge clause explicitly covers this: AI cites 醫管局; static table cites TANITA. Both sources are authoritative for their respective use.
- Verified: type-check clean, build ✓; JSX renders two 5×3 tables under the disclosure, dark mode borders correct, footer disclaimer intact. No wire-payload change (verify by inspection: static table is client-side JSX only).
- Full plan: `plan/25-m24-tanita-body-fat-reference.md`. Awaiting Cloud Run redeploy.

## 2026-09-24 11:35 — M23 delivered: 體脂率 grounded source + static HA reference table

- Added `醫管局` to `Agency` union; new `TIPS_REFERENCE` topic `體脂率參考標準` sourced from the Hospital Authority article 「我的體重是否在健康範圍內呢？」 (https://www3.ha.org.hk/dic/gn_06_04.html). Gender-neutral tips text points to the table under the card.
- `REFERENCE_LEAFLET` body-fat line rewritten to reference the static table without quoting any gendered percentages — keeps `allowedNumbers` clean so the AI cannot cite ranges like 14-20% without the gender qualifier the sensitive-word filter would catch.
- `selectRelevantTips` gains an `n === "體脂率"` branch — body-fat cards now always pull the new topic.
- `/summary` renders a collapsible `<details>` 「查看標準脂肪量對照表（醫管局）」 under 體脂率 cards. Two age rows (18-29歲, >30歲) × two genders (女士, 男士); 運動員 row from the source is deliberately omitted per this milestone's scope. Source line credits 醫管局 with a clickable link to the article.
- **New ADR 0025 (`adr/0025-static-reference-vs-ai-advice.md`)** formalizes the principle: static reference material from an authoritative source may be gender/age structured; AI-generated content may not. Explains the JSX comment marking the table as intentional and protects it from being removed by a future contributor under the wrong ADR.
- Verified: type-check clean, build ✓; runtime exercised — new topic fires for 體脂率-only and all-Tanita, does not fire for BMI-only (fallback unchanged); tips text contains no sensitive words; leaflet contains no gendered specific ranges.
- No storage change, no AI prompt shape change, no wire payload change. `SENSITIVE_LABEL_PATTERN` continues to apply only to AI output (per ADR 0025 clarification).
- Full plan: `plan/24-m23-body-fat-reference-source.md`. Awaiting Cloud Run redeploy.

## 2026-09-24 00:00 — Deploy M22 to Cloud Run (rev 24)

- Deployed `cloud-run-prep` HEAD (commit `ac92b7b`) to Cloud Run service `heartcaring-app`, region `asia-east1`. New active revision: `heartcaring-app-00024-fzf` serving 100% of traffic on heartcaring.fit.
- Ships live: preview block above `/summary`'s generate button (which modules will contribute cards, which are missing, remaining AI budget); button now rewords itself when disabled ("今日已達上限" or "尚未紀錄任何可摘要項目") instead of relying on the after-click toast alone.
- Deploy printed a "Setting IAM policy failed" warning — harmless, cosmetic, because `allUsers` invoker binding was already present from earlier deploys (rev 17 onwards). Revision itself deployed cleanly; site remained publicly reachable throughout.
- Verified live on phone (private tab): preview shows 「本次將包含：身體成份分析儀 · 2026年9月23日 記錄（含 BMI、體脂率、內臟脂肪）」 and 「血壓 · 2026年9月23日 記錄」, plus 「未曾記錄：手握力、坐地前伸測試」 and 「今日 AI 生成剩餘 19 / 20 次」. Generated summary produces 4 cards matching preview count; every card renders name, value, grade badge, date and interpretation (M20 + M21 + M22 all working together).

## 2026-09-23 22:04 — M22 delivered: preview before generating the summary

- Above `/summary`'s generate button, a live preview block now shows: which of the four modules will contribute a card (with each latest reading's date), which are recorded but produce no grade-able card (e.g. Tanita weight-only), which are not recorded, and today's remaining AI budget (`Math.max(0, AI_DAILY_LIMIT - usageToday) / 20`).
- Button rewords itself when disabled: 「今日已達上限」 (cap reached) or 「尚未紀錄任何可摘要項目」 (nothing to summarize). Replaces the after-click toast surprise.
- Preview computed via `useEffect` from the same `readEntries` + `interpretCard` sources the generate flow uses — mirrors the exact code path so preview and generation can never disagree. Recomputes on mount and after each successful generate (`refreshTick` bump).
- Uses `mod.title` from `MODULES` (「血壓」、「身體成份分析儀」、「手握力」、「坐地前伸測試」) which matches PRD USER JOURNEY 2 wording.
- Verified: type-check clean, build ✓, runtime exercised across 5 module-state scenarios (only BP, BP+full Tanita, BP+Tanita weight-only, all four, none) — three-bucket split (included / recorded-but-empty / missing) behaves as designed.
- No storage change, no AI prompt change, no wire payload change, no new persisted state. Existing zero-entry and cap-reached toasts remain as belt-and-braces.
- Full plan: `plan/23-m22-summary-preview.md`. Awaiting Cloud Run redeploy.

## 2026-09-23 21:30 — Deploy M21 to Cloud Run (rev 23)

- Deployed `cloud-run-prep` HEAD (commit `430a51c`) to Cloud Run service `heartcaring-app`, region `asia-east1`. New active revision: `heartcaring-app-00023-d5r` serving 100% of traffic on heartcaring.fit.
- Ships live: server-side card-name filter + retry that ensures `/summary` cards always render name, value, grade badge, date and interpretation together — even when Gemini paraphrases a card name in its response.
- Cloud Shell → GitHub sync worked first try this time (fast-forward `09fd1c7` → `430a51c`).

## 2026-09-23 21:07 — M21 delivered: /summary cards always render name, value, grade and date (fixes latent M18 bug)

- On the deployed rev 22, Gemini was observed paraphrasing a card `name` in its response (`"血壓"` → `"血壓及脈搏"`). `summary.tsx:117`'s strict `cardMap.get(card.name)` returned undefined, silently hiding value, grade badge, and date on the affected card. Latent since M18's structured summary; M20's date line simply made the failure visible.
- Fix mirrors the tips-filter/retry pattern in the same file. Four coordinated changes in `src/lib/health/ai.functions.ts`:
  1. Build `validCardNames = new Set(data.cards.map(c => c.name))` alongside the existing `validTopics`.
  2. `parseOutput` filters `parsed.cards` by `validCardNames.has(c.name)`, symmetric to the existing tips filter.
  3. `richGroundingFailure` gains `expectedCardCount`; returns `"卡片解讀未對應項目名稱"` when `output.cards.length < expectedCardCount`, tripping the existing single strict retry.
  4. Both prompt strings tightened: base prompt enumerates the six legal card names ("血壓"、"BMI"、"體脂率"、"內臟脂肪"、"手握力"、"坐地前伸") and forbids adding descriptors; retry prompt names the specific failure mode ("血壓" not "血壓及脈搏").
- Verified: type-check clean, build ✓; runtime exercised drifted response (`血壓 → 血壓及脈搏`) drops to 1 card and trips the new failure reason; clean response passes; sensitive-word / invented-number / empty-tips regressions still fire.
- No storage change, no AI prompt data shift (still receives grade labels + values only per ADR 0018), no wire payload change, no client render change.
- Full plan: `plan/22-m21-cards-name-match.md`. Awaiting Cloud Run redeploy.

## 2026-09-23 18:50 — Fix M20 wire-payload leak: strip client-only fields before sending to summary server function

- Peer review of M20 found that `summary.tsx` was sending the full `CardInterpretation[]` (including `recordedAt` and `tone`) to `generateRichSummary`. Zod stripped both fields before the handler saw them, so the AI never received the date and nothing was persisted — but the fields still travelled from browser → app server in the raw JSON POST body, visible in DevTools Network. That contradicted PRD line 50 ("Dates never leave the device") and the SUCCESS demo checkpoint ("browser network tab shows no health readings leaving the device apart from the photo sent for reading and the latest readings sent for the summary").
- Fix: `summary.tsx` now builds an explicit whitelist mapping (`{ name, value, grade, range, action, note }`) before calling `run`. Local `allCards` / `cardMap` keep `recordedAt` for the card render layer; the wire carries only the fields `RichSummaryInput.cards` accepts. As a side effect, `tone` is also no longer sent (was silently stripped by zod anyway).
- Verified: type-check clean, build ✓, and a `JSON.stringify` on a fake payload confirms no `recordedAt` or `tone` string appears anywhere in the outgoing body.
- No storage, grading, AI prompt, or grade.ts changes. The M20 card display is unaffected.

## 2026-09-23 18:15 — M20 delivered: date on each /summary card

- `CardInterpretation` gains an optional `recordedAt?: string` (ISO yyyy-mm-dd). `interpretCard(mod, values, recordedAt?)` now stamps every returned card with the source entry's date; the switch body is unchanged (moved into a private `interpretCardCore` helper so stamping happens once, at the wrapper's edge).
- `summary.tsx` passes `latest.date` when building cards and renders `{formatChineseDate(recordedAt)} 記錄` as a small muted line between the value/grade row and the AI interpretation paragraph. Reuses the existing `formatChineseDate` helper — no new formatter.
- Closes the gap between PRD USER JOURNEY 5 / SUCCESS (「full recording date including year」) and the previous `/summary` render, which showed values + grades without a date. Tanita's three cards share one date (they come from one entry).
- No storage change, no migration, no AI change, no data leaving the device. Type-check + build clean; `formatChineseDate("2026-09-23")` verified → `2026年9月23日`.
- Full plan: `plan/21-m20-date-on-summary-cards.md`. Awaiting Cloud Run redeploy to go live on heartcaring.fit.

## 2026-09-23 17:34 — Add deploy-to-production runbook to CLAUDE.md

- Added a "Deploy to production (heartcaring.fit)" block to `CLAUDE.md`'s Commands section, right below the `bun run` dev commands.
- Consolidates the two operational rules that only lived in prior CHANGELOG entries: service name must be `heartcaring-app` (not `health-hush-log`), and Cloud Shell must `git fetch && git pull --ff-only origin cloud-run-prep` before `gcloud run deploy --source .` or Cloud Run rebuilds stale local source.
- Includes verify, rollback, and cross-references to the two incident CHANGELOG entries.
- Dev-facing doc only; not imported by code, not read at runtime, no deploy needed. Placed in `CLAUDE.md` rather than `AGENTS.md` (which is the 7-principle constitution) or a new `docs/DEPLOY.md` (overkill for this size).

## 2026-09-23 17:01 — Deploy agency-only summary + empty-tips guard to Cloud Run (rev 21)

- Deployed `cloud-run-prep` HEAD (commit `ee316b0`) to Cloud Run service `heartcaring-app`, region `asia-east1`. New active revision: `heartcaring-app-00021-pvq` serving 100% of traffic on heartcaring.fit.
- Ships live: gender-neutral tips + reference leaflet (`2c59509`), agency-only source attribution + sensitive-word grounding check (`dffdb9d`), empty-tips retry + fallback (`ee316b0`), and the associated ADRs 0023 and 0024.
- **Root cause of earlier stealth failure**: three deploys (rev 18-20) happened between 13:37 and 15:39 HKT but every one silently rebuilt stale source. Cloud Shell's `~/health-hush-log` was checked out at `023e782`, five commits behind GitHub. `gcloud run deploy --source .` uploads the local working tree, not the remote branch, so the fix commits pushed from Claude Code never reached the container images. `git status` reported "up to date" only because the local `origin/cloud-run-prep` tracking ref was itself stale — no `git fetch` had run since the M19 deploy.
- **Fix that worked**: `git fetch origin && git pull --ff-only origin cloud-run-prep` in Cloud Shell (fast-forward from `023e782` to `ee316b0`, 5 commits, 9 files, no conflicts with the 5 locally-staged `public/images/*.jpg` files), then the same `gcloud run deploy` command.
- **Reminder for future deploys**: always `git fetch && git pull --ff-only origin cloud-run-prep` in Cloud Shell before `gcloud run deploy`, otherwise Cloud Run rebuilds whatever stale checkout Cloud Shell happens to hold.

## 2026-09-23 15:32 — Guard against empty-tips silent degradation

- `richGroundingFailure()` now returns "貼士未能對應參考資料主題" when the AI was given reference material but every tip's `topic` field failed the strict verbatim match (e.g. drifted punctuation, added `【】` wrapping, translation, or truncation). This trips the existing single strict retry with an explicit "copy the topic name verbatim" reminder.
- `/summary` shows a fallback line ("本次未能為您匹配合適的貼士，請稍後再試，或直接參考各項評級的建議。") when `result.tips` is empty after both attempts, so the tips section no longer renders as a bare header with nothing underneath.
- No changes to grading, storage, privacy model, or the grounded article set.

## 2026-09-23 14:46 — Display agency instead of article title in health tips; extend grounding check

- `TipBlock.sources` gains an `agency` field ("衞生防護中心" / "衞生署" / "職業安全健康局"). Titles and URLs stay internal for grounding traceability; the UI shows only the agency.
- AI prompt no longer sends article titles or URLs to the model. The AI now returns `{ tip, topic }` and the app maps `topic` → agencies for display.
- `richGroundingFailure()` extended: also rejects output containing 男士 / 女士 / 長者 / 學生 — closes a leak where gendered/age-specific source titles could have been quoted by the model.
- `/summary` tips section now shows a credit block at the top listing the government agencies that contributed to this summary (dynamic, per-generation), and each tip shows only its topic's agencies as plain text.
- No changes to grading, storage, privacy model, or which articles the AI is grounded on.

## 2026-09-23 13:34 — Remove gender-specific content from health tips and reference leaflet

- REFERENCE_LEAFLET: replaced male/female body fat percentage ranges with gender-neutral text directing users to the testing institution's chart — consistent with the app already returning 「無適用參考標準」 for body fat (no gender collected, ADR 0015).
- TIPS_REFERENCE 健康飲食: replaced `fhs.gov.hk` women's-health cholesterol PDF with the gender-neutral 高血壓 article already used in other topics.
- TIPS_REFERENCE 日常運動: replaced two「男士健康」sources with 體重管理行動計劃 and 控制體重的方法 (already used in the BMI topic).
- All replacement URLs are reused from other topics — no new external sources introduced.
- No changes to grading logic, storage, privacy model, or app behaviour.

## 2026-09-22 23:42 — Deploy M19 + SSOT fix to Cloud Run (heartcaring.fit)

- Deployed `cloud-run-prep` branch to Cloud Run service `heartcaring-app` (revision 17), region `asia-east1`.
- Initial deploy went to a new service named `health-hush-log` instead of the existing `heartcaring-app` that `heartcaring.fit` is domain-mapped to — mobile showed the old Tanita layout while Chrome (which had visited the Cloud Run URL directly) showed the update.
- Redeployed to the correct `heartcaring-app` service; deleted the unused `health-hush-log` service.
- M19 six-screen Tanita sections and the SSOT fix are now live on heartcaring.fit.

## 2026-09-22 22:04 — Fix triple SSOT for field-to-screen mapping

- Removed dead `screen?: string` property from `FieldDef` interface and all 21 Tanita field definitions — nothing read it.
- In `ai.functions.ts`, replaced the hardcoded `TANITA_SCREEN_FIELDS` (which duplicated both field keys and screen labels from `modules.ts`) with `TANITA_SCREEN_PROMPTS` (AI-specific prompt strings only). Zod schema keys are now derived from `ScreenDef.fields` at runtime, and screen-hint labels come from `ScreenDef.label`.
- Single source of truth for field-to-screen mapping is now `ScreenDef.fields` in `modules.ts`.
- No data, storage, grading, or behavioral changes.

## 2026-09-22 22:04 — M19: Six-screen Tanita sections with per-screen photo extraction

- Restructured the Tanita module into six labelled sections matching the physical analyser's display screens (體脂率, 肌肉量, 身體水分, 內臟脂肪, 基礎代謝率, BMI), each with its own camera/upload button and narrowed AI extraction prompt (3–8 fields instead of 21).
- Extracted shared record state and behaviour from `RecordModule` into a `useRecordState` hook, consumed by both the new `TanitaRecord` component (Tanita) and the existing `RecordModule` (bp/grip/sitreach). The hook extraction is a pure refactor — no behavioral change for existing modules.
- Weight is editable only in section 1 (體脂率); sections 2–6 show weight as a read-only disabled input sharing the same value.
- Voice input removed from Tanita only — impractical for 21 fields across 6 screens; per-screen photo extraction replaces it. Other modules keep voice. PRD line 34 mentions "speak the numbers"; this is an intentional deviation documented in [ADR 0022](adr/0022-tanita-six-screen-sections.md).
- No changes to storage format, field keys, grading, CSV export, or data migration. Existing `hlb:tanita` records load correctly.
- Plan: [plan/20-m19-tanita-screen-sections.md](plan/20-m19-tanita-screen-sections.md)

## 2026-09-22 20:21 — Track package-lock.json and regenerate bun.lock

- `package-lock.json` added to version control for the first time — ensures reproducible `npm install` in CI or manual builds.
- `bun.lock` regenerated to match the `@ai-sdk/google` v4 upgrade. The Dockerfile uses `bun install --frozen-lockfile`, so the lockfile must stay in sync with `package.json`.

## 2026-09-22 20:00 — Fix photo extraction inline_data bug

- Photo extraction (`extractFromImage`) failed with "Invalid value at 'contents[0].parts[1].inline_data' (data), Starting an object on a scalar field" when sending images to Gemini.
- Root cause: `ai` v7 core wraps image data in tagged objects `{ type: "data", data: base64 }` before passing to the provider. `@ai-sdk/google` v2 (`@ai-sdk/provider-utils` v3) passed the tagged object directly to the Gemini API as `convertToBase64(part.data)` where a plain base64 string is expected. A pre-processing workaround (converting the data URL to `Uint8Array`) was attempted first but does not work — the v7 core re-wraps `Uint8Array` in the same tagged structure.
- Fix: upgraded `@ai-sdk/google` from `^2.0.0` (v2.0.97) to `^4.0.0` (v4.0.76). The v4 provider uses `@ai-sdk/provider-utils` v5, matching `ai` v7, and correctly accesses `contentPart.data.data` (the inner value) instead of `contentPart.data` (the tagged wrapper).
- No code changes to `ai.functions.ts`. No change to inputs, outputs, or data flow.

## 2026-09-22 18:18 — Switch AI calls from streamText to generateText

- Replaced `streamText` with `generateText` from the AI SDK in both server functions (`extractFromImage` and `generateRichSummary`). Both calls were consuming the full result server-side (`await result.text`), so streaming added complexity with no benefit.
- Root cause: `streamText` was throwing `NoOutputGeneratedError` ("No output generated. Check the stream for errors.") on Cloud Run — the SSE stream opened but produced zero content chunks before closing. `generateText` makes a single request/response call and surfaces API errors directly instead of swallowing them.
- No change to inputs, outputs, error handling, or data flow — the same Zod schemas validate, the same grounding check runs, the same retry logic applies.

## 2026-09-22 18:18 — Update Gemini model from 2.5-flash to 3.6-flash

- Changed `gateway("gemini-2.5-flash")` to `gateway("gemini-3.6-flash")` in both AI call sites.
- Root cause: Google retired `gemini-2.5-flash`; the API returned 404 "no longer available to new users. Please update your code to use models/gemini-3.6-flash".
- The `@ai-sdk/google` v2.0.97 SDK passes model names directly to the API URL and already recognises `gemini-3.x` models via its capability detection logic — no SDK upgrade needed.

## 2026-09-22 18:18 — Remove Lovable dead code

- Deleted `src/lib/lovable-error-reporting.ts` — called `window.__lovableEvents` which only exists in the Lovable editor; dead on any standalone deployment.
- Removed the `useEffect` in `__root.tsx` that imported and called `reportLovableError`.
- Deleted 9 orphaned `.asset.json` files under `src/assets/` — Lovable CDN pointers with no code importing them.

## 2026-09-22 18:18 — Merge main into cloud-run-prep (PRs #19–#25)

- Incorporated 6 merged PRs from `origin/main`: privacy notice rewrite, info popovers on grip/sit-reach, dashboard wording updates, back-to-cover navigation, and docs reconciliation.
- Resolved one CHANGELOG.md merge conflict by keeping the ejection entry (2026-09-21) above main-branch entries (2026-09-20) in reverse chronological order.

## 2026-09-21 18:21 — Eject Lovable dependencies for Cloud Run deployment

- Replaced `@lovable.dev/vite-tanstack-config` with explicit Vite config using `tanstackStart`, `react`, `tailwindcss`, `tsConfigPaths`, and `nitro` plugins. Nitro preset switched from `cloudflare-module` to `node-server`.
- Swapped AI provider from `@ai-sdk/openai` (Lovable gateway) to `@ai-sdk/google` (Google Gemini). Model changed from `openai/gpt-6-astra` to `gemini-2.5-flash`. Removed OpenAI-specific `providerOptions` blocks. Env var changed from `LOVABLE_API_KEY` to `GEMINI_API_KEY`.
- Migrated 5 image assets from Lovable's `/__l5e/assets-v1/` proxy to local `public/images/` paths. Updated imports in `index.tsx` and `Dashboard.tsx`.
- Removed Lovable-specific entries from `bunfig.toml` and `package.json`. Regenerated `bun.lock` from public npm registry.
- Added `Dockerfile` (multi-stage: bun build, node runtime) and `.dockerignore`.
- Removed Lovable sync notice from `AGENTS.md`.

## 2026-09-20 23:03 — ARCHITECTURE.md reconciled with PRs #22–24
- Updated "Last reconciled" timestamp to 2026-09-20 23:03 HKT.
- Documented the optional `infoText` field on `ModuleDef` in the Modules table.
- Noted info-popover rendering capability in the RecordModule description.
- All other living docs (CHANGELOG, DECISIONS, PRD, Product_Roadmap) were audited and found current — no changes needed.

## 2026-09-20 20:43 — Cover privacy notice rewritten with full 5-section disclosure
- Replaced the three short bullet points in the cover 私隱與資料使用 dialog with a comprehensive 私隱與資料使用聲明 covering: 100% local storage, no-PII guidance, AI processing details (OCR + health summary), data autonomy/deletion, and medical disclaimer.
- Dialog title updated from 「私隱與資料使用」 to 「私隱與資料使用聲明」; dialog is now scrollable (`max-h-[85vh] overflow-y-auto`) to accommodate the longer content.
- Other contexts (module, dashboard, summary) keep their existing concise copy.
- No data, grading, storage, AI or logic changes.

## 2026-09-20 20:32 — Info popovers on grip and sit-and-reach pages
- Added an ⓘ icon next to the page title on `/grip` and `/sit-and-reach` that opens a Popover explaining why each test matters (muscle health, cardiovascular associations) with a medical-disclaimer note.
- Data model: `ModuleDef` gains an optional `infoText` field (`{ intro, points[], note }`) so any module can opt in to an info popover without code changes.
- Uses the existing Radix-based Popover component with glassmorphic styling (`backdrop-blur-xl bg-card/80`).
- No data, grading, storage, AI or logic changes.

## 2026-09-20 20:16 — Dashboard and module wording updates, back-to-cover navigation
- Tanita subtitle changed from 「身體成份分析儀讀數」 to 「記錄脂肪率．肌肉量．BMI」 (propagates to both `/tanita` and `/logbook`).
- Sit-and-reach subtitle changed from 「記錄柔軟度測試距離」 to 「記錄柔軟度」 (propagates to both `/sit-and-reach` and `/logbook`).
- Removed 「本地優先・資料只存在此裝置」 from the dashboard header (the privacy notice in the footer already covers this).
- Added 「返回首頁」 link at the top of `/logbook` pointing back to the cover page (`/`).
- No data, grading, storage, AI or logic changes.

## 2026-09-20 20:01 — Cover: revert HTML taglines, restore mask-based approach
- Reverted PR #19 at user's request, restoring the PR #18 cover state: image mask with bottom fade (`black 55% → transparent 72%`), shorter gradient (`h-[45%] sm:h-[38%]`), no HTML tagline elements.
- The HTML text overlay worked technically but the user preferred the previous version.
- No other changes.

## 2026-09-20 19:36 — Cover: render taglines as HTML text above gradient (reverted)
- Attempted a different approach to the tagline-visibility problem: reverted image mask to no bottom fade and gradient to `h-[70%] sm:h-1/2`, then added the two taglines (守護心血管健康, 輕鬆記錄評估資料) as HTML `<p>` elements at z-10 above the gradient.
- Reverted in the next entry at user's request.

## 2026-09-20 18:42 — Cover: show taglines by masking out icons at the image level
- Added a bottom fade to the image mask (`black 55% → transparent 72%`) so the baked-in icon buttons are clipped on the image itself, while both taglines (守護心血管健康, 輕鬆記錄評估資料) remain fully visible.
- Shortened the gradient overlay from `h-[70%] sm:h-1/2` to `h-[45%] sm:h-[38%]` since it no longer needs to hide icons — it just blends the masked image edge into the mint background.
- No other changes.

## 2026-09-20 15:40 — Cover: move 進入 button up for spacing with privacy link
- Changed `bottom-16` to `bottom-24` so the 進入 button has more breathing room above the 私隱與資料使用 link.
- No other changes.

## 2026-09-20 15:01 — Cover: responsive overlay height to fully hide icons on all viewports
- Phone viewports need a taller overlay (`h-[70%]`) because `object-cover` barely crops the nearly-matching aspect ratio image, placing the baked-in icons higher on screen. Wider viewports revert to `sm:h-1/2` where the icons are pushed lower by extra scaling. The gradient stays solid for 70% of the overlay height, fading to transparent by 88%.
- No colour, wording, layout or logic changes.

## 2026-09-20 14:08 — Cover: extend overlay to fully hide baked-in icon squares
- The viewport-relative gradient overlay was too transparent at the icon height (~40% from bottom). Extended from `h-1/2` to `h-[58%]` and changed to a multi-stop gradient (`#e6f9f0` solid up to 66% of the div, fading to transparent by 85%`) so the two baked-in icon squares are fully covered while both taglines remain untouched.
- No colour, wording, layout or logic changes.

## 2026-09-20 13:57 — Cover: viewport-relative overlay replaces image mask
- Root cause: CSS mask percentages are element-relative, but `object-cover` + `object-position: center 30%` maps image content to different element positions depending on viewport aspect ratio. On wider viewports the second tagline fell into the mask's fade zone.
- Fix: removed the bottom fade from the image mask (kept only top fade-in at 6% and side feathering at 8%/92%). Added a viewport-relative gradient overlay `<div>` covering the bottom 50% of the screen (`h-1/2`), fading from transparent to `#e6f9f0` (the mint tint). Since the overlay is viewport-sized, it consistently hides the baked-in icons on every screen while keeping both taglines fully visible in the top half.
- No colour, wording, layout or logic changes.

## 2026-09-20 13:38 — Adjust cover mask fade to show both tagline lines
- Pushed the vertical mask fade from `black_48%, transparent_58%` to `black_55%, transparent_65%` so the second tagline line (輕鬆記錄評估資料) and more watercolor artwork remain at full opacity. The baked-in icons at ~55–65% still fall in the fade zone.

## 2026-09-20 13:28 — Fade out bottom half of cover image to hide baked-in icons
- Changed the vertical mask gradient from `black_94%, transparent` (fade at bottom edge only) to `black_48%, transparent_58%` (fade starting at 48%, fully transparent by 58%). This hides the baked-in icon buttons at ~55–65% of the image height, which were visible because the image's aspect ratio (889×1920) nearly matches a phone viewport, so `object-cover` provides no vertical cropping.
- The logo, tagline and watercolor artwork in the top half remain fully visible; the bottom fades into the blurred underlay + mint tint, giving the "進入" button a clean background.
- No colour, wording, layout or logic changes.

## 2026-09-20 13:14 — Add visible "進入" button back to cover
- Added a visible "進入" `<Button>` at `bottom-16` (4rem from edge), centred horizontally, `z-10` layered above the full-screen clickable image. Styled as primary, `min-h-14`, `rounded-xl`, `shadow-lg`, capped at `min(80%, 20rem)` width.
- Why: the previous commit cropped the baked-in dark "進入" bar from the image, leaving no visible enter affordance — tapping anywhere worked but was invisible.

## 2026-09-20 13:06 — Cover image: crop baked-in UI, show branding
- Changed the sharp cover image from `max-h-full max-w-full` (letterboxed) to `h-full w-full object-cover object-[center_30%]` so the image fills the viewport and is anchored at 30% from the top — showing the 護心計劃 branding and watercolor artwork while cropping the baked-in icon buttons and dark bar at the bottom that created a phone-frame appearance.
- No colour, wording, graphic design or logic changes.

## 2026-09-20 12:48 — Frameless cover via blurred underlay
- Replaced the sampled-gradient background with a blurred underlay: the same cover image fills the screen with object-cover, scale-150 and blur-3xl, softened by a light mint tint overlay (#e6f9f0 at 70%), so the surround is the image's own blurred extension rather than a guessed colour.
- Kept a gentle edge mask (8% horizontal, 6% vertical feather) on the sharp cover image so its edges blend into the underlay at any aspect ratio; no cropping of the printed 進入 button.
- Kept the whole cover clickable to /logbook, the upward shift, and the subtle bottom-right 私隱與資料使用 trigger unchanged. No logic, storage, grading, or interior-page changes.
- Verified desktop (1280×800), tablet (588×709), and mobile (390×844): no visible frame, privacy dialog opens, cover navigates to /logbook, no console errors. Build OK.

## 2026-09-20 12:40 — Seamless full-screen cover background
- Replaced the mismatched deep-mint page gradient with one sampled from the actual cover image edges (#ddf9f2 → #e2f8ef → #c4eee7), removing the visible colour bands left/right/bottom.
- Changed the cover `<img>` from full-viewport `object-contain` to an exactly-fitted element (`max-h-full max-w-full`, flex-centred) with a soft edge mask so the image feathers into the background — no hard seam at any aspect ratio, and no cropping of the printed 進入 button.
- Kept the whole cover clickable to `/logbook`, the upward shift, and the subtle bottom-right 私隱與資料使用 trigger unchanged. No logic, storage, grading, or interior-page changes.
- Verified desktop (1280×800), tablet (588×709), and mobile (390×844): no visible seams, privacy dialog opens, cover navigates to /logbook, no console errors. Build OK.

## 2026-09-20 12:31 — Replace cover image with Front_page-4.jpg
- Swapped the cover asset to `front-page-4.jpg` (`Front_page-4.jpg`).
- Removed the obsolete `front-page-3.jpg.asset.json` pointer; the old asset is no longer referenced.
- Kept the whole cover clickable to `/logbook` and the subtle bottom-right `私隱與資料使用` trigger unchanged.
- Note: the visible tagline still includes 「守護您的心腦血管健康」; supply a further corrected image to remove the 「您」.

## 2026-09-20 12:18 — Replace cover image with updated wording
- Swapped the cover asset to `front-page-3.jpg`, which shows the revised tagline 「守護心腦血管健康 / 輕鬆記錄評估資料」.
- Removed the obsolete `front-page-2.jpg.asset.json` pointer; the old asset is no longer referenced.
- Kept the whole cover clickable to `/logbook` and the subtle bottom-right `私隱與資料使用` trigger unchanged.

## 2026-09-20 11:25 — Cover spacing and privacy-link placement
- Shifted the complete cover image upward so its printed 進入 button has breathing room above the phone edge while reducing the excess space at the top.
- Moved 私隱與資料使用 to a subtle bottom-right text control with a safe 44px touch target; its dialog content and behaviour are unchanged.
- Kept the whole cover clickable to /logbook; no record, grading, storage, AI, export or interior-page logic changed.

## 2026-09-20 10:52 — Cover page: printed 進入 button cropped off on wide screens (fixed)
- Root cause: the supplied cover image (889×1920 portrait) contains its own printed navy 進入 button near the bottom; `object-cover` cropped the top/bottom on wider viewports (including the user's 948×1092 preview), cutting the printed button off so no enter control was visible.
- Fix: switched the cover image to `object-contain` so the whole poster — including its printed 進入 button — always displays, and set the page background to a vertical mint gradient (#C7E7D7 → #C8E5CF → #C6E3CD) sampled from the image edges so the letterbox fill blends seamlessly.
- The whole cover remains one accessible button to `/logbook`; the privacy dialog trigger is unchanged.
- Verified with Playwright screenshots at 1280×1800, 948×1092, and 390×844: exactly one visible 進入 button on all sizes; click-through to `/logbook` confirmed. Build OK.

## 2026-09-19 23:58 — Cover page: spacing and privacy button refinement
- Increased bottom padding from `pb-12` to `pb-24` so the "進入" button sits further from the image icons above it.
- Moved the "私隱與資料使用" dialog trigger from top-right to bottom-right, reduced to ~40% of its former size (`text-xs`, `size-3.5` icon, no background or shadow), styled as a subtle `muted-foreground/70` ghost button.
- Why: the enter button was too close to the cover image's icons; the privacy link should be discoverable but unobtrusive.

## 2026-09-19 23:32 — Cover page: full-viewport image, no phone frame
- Removed the card-like Button wrapper (`rounded-[2rem] border border-border bg-card shadow-2xl`) that made the cover image appear inside a phone frame.
- The cover image now fills the entire viewport as an absolute-positioned background with `object-cover`; a simple "進入" button sits at the bottom and the "私隱與資料使用" dialog button floats top-right.
- Why: the cover should show the supplied image edge-to-edge, not inside a device frame.

## 2026-09-19 23:07 — M18 audit cleanup: SSOT, perf, dead code, living docs
- `interpretCard()` now calls `gradeEntry()` internally instead of duplicating grading logic — `gradeEntry` remains the single grading authority. ([ADR 0008](adr/0008-single-reader-single-grader.md))
- Added `tone` to `CardInterpretation`; summary.tsx uses it directly, eliminating the duplicated `gradeTone()` function.
- Hoisted `interpretCard` computation out of the render `.map()` loop into a `cardMap` computed once during `generate()`.
- Removed dead `gradeEntry` import from summary.tsx.
- Removed dead `generateHealthSummary`, `SummaryInput` and `groundingFailure` from ai.functions.ts (replaced by `generateRichSummary`).
- PRD privacy boundary updated to reflect that M18 sends readings alongside grades. ([ADR 0018](adr/0018-summary-sends-readings-with-grades.md))
- Updated ARCHITECTURE.md (data flow, SSOT docs, privacy model), Product_Roadmap.md (M18 entry, status line), and this changelog.

## 2026-09-19 — M18: Rich structured health summary with government-sourced tips
- Replaced the free-text health summary with a structured report: each metric gets a plain-language interpretation card (value, grade badge, AI-written explanation), followed by 3–5 actionable health tips with clickable source links to Hong Kong government health articles.
- Distilled 16 government articles into a bundled `TIPS_REFERENCE` constant (6 topic blocks covering cardiovascular disease, BMI, hypertension, visceral fat, diet and exercise); tips are pre-filtered by the user's grades before reaching the AI. ([ADR 0019](adr/0019-bundled-government-health-tips.md))
- Added `interpretCard()` as the deterministic card-data builder for the summary, returning structured data with name, value, grade, tone, range, and action.
- Source URL validation filters out AI-hallucinated URLs against the known valid set from bundled articles.
- The AI now receives formatted values alongside grade labels (no dates, age or gender). ([ADR 0018](adr/0018-summary-sends-readings-with-grades.md))
- Why: the summary should read like a clinic leaflet — every claim traceable to its source, every tip backed by a government article.

## 2026-09-19 21:34 — Multi-photo UX: smarter toast and progress counter
- The toast after each AI photo read no longer says "請核對數值後儲存" when more screens remain. For modules with optional fields (currently Tanita), the toast now shows how many of the module's fields are filled and suggests continuing if any remain empty.
- A "已填 X / Y 項" progress counter appears above the save button once at least one field is filled, so the user can see at a glance how complete the record is across multiple photos.
- No data-model, grading, storage or API changes — both additions are gated behind the existing `optional` field flag and only activate for Tanita.

## 2026-09-19 — M17: Complete Tanita body composition data (21 fields)
- Expanded the Tanita module from 5 to 21 fields to capture every metric the 身體組成分析儀 displays across its 6 screens: body fat mass, muscle ratio, body water (% and kg), BMR (kcal and kJ), and segmental fat % and muscle mass for trunk, arms and legs.
- All 16 new fields are optional — a record is valid with just the original 5. The form groups related fields under Chinese headings; segmental groups (部位脂肪率, 部位肌肉量) are collapsed by default to keep the form approachable.
- AI photo extraction schema and prompt updated to read all 21 values; fields not visible on the photographed screen return null. Multi-photo merge preserves earlier values.
- Added body water and BMR reference text to the bundled leaflet for grounded health summaries.
- No changes to grading (new fields have no universal chart without age/gender), storage format, CSV export, or voice input.

## 2026-09-19 17:08 — Living docs reconciled and completed
- Added the missing build plans for the last two milestones and recorded M16 in the roadmap, so every delivered milestone has its own small plan file.
- Wrote the project's working constitution (the rules any AI assistant must follow: local-first, deterministic grading, no invented numbers, review before save, server-side credentials, Traditional Chinese, docs updated in the same pass) into AGENTS.md and linked it from the README.
- Cleared the stale internal task list and noted the changelog's own archive rule in the README.
- Timestamp fetched live (Sat, 19 Sep 2026 09:08:32 GMT → 2026-09-19 17:08 HKT), not guessed.

## 2026-09-19 17:01 — Truthful privacy wording, checked summaries, honest dates
- Restated the NORTHSTAR as no health record stored off the device, matching the PRD's own transient photo-read and grade-label allowance.
- The health summary is now checked after it is written: any number not in the bundled leaflet, or a missing medical reminder, triggers one strict retry and then a plain refusal instead of ungrounded advice.
- Named one official source per grading table and removed the unreachable age/gender norm tables the app can never apply.
- Record dates and the daily AI count now follow the device's local calendar, so an early-morning reading no longer saves to yesterday; re-check dates clamp at month end.
- Voice input understands spoken Chinese numerals and decimals, not only digits.
- Any past blood-pressure record can now produce its own re-check reminder from the history list.
- Logbook tuning for older eyes: smaller phone illustrations, stronger secondary text, shorter guidance, and 清除所有資料 moved into its own clearly-marked area.
- Why: close the real drift found in the PRD reconciliation. ([ADR 0017](adr/0017-grounding-check-local-dates-named-sources.md))

## 2026-09-19 15:56 — Dashboard illustrations and core-journey corrections
- Replaced all four broken dashboard images with the supplied blood-pressure, scale, hand-grip and stretching illustrations, shown uncropped at equal visual size.
- Restored grade badges in saved history by deriving them from the existing single grader; no health-record schema or stored data changed.
- Extended camera and upload reading to hand grip and sit-and-reach, with module-specific validated values and the existing editable confirmation step.
- Added `/logbook` as the stable dashboard destination; module, summary, 404 and failure returns now go there instead of replaying the cover.
- Moved cover privacy terms behind a visible link, translated error experiences, and aligned the interior palette with the supplied mint-and-navy cover.
- Why: close the blockers found in the PRD reconciliation without introducing parallel data or changing the local-only privacy boundary. ([ADR 0016](adr/0016-stable-logbook-and-derived-history-grades.md))

## 2026-09-17 23:53 — Front-door build, no profile gate, icons and clearer privacy wording
- Added the supplied 護心計劃 front page image as the first screen and paired the four dashboard choices with the uploaded placeholder images.
- Removed age/gender collection from the live app and purge the legacy profile key; charts that need those details now show 「無適用參考標準」 while still saving the number.
- Renamed the user-facing modules to 血壓、身體成份分析儀、手握力、坐地前伸測試.
- Added camera-or-upload controls for photo reading, kept review-before-save, and made every saved record show a full date with year.
- Replaced scattered notices with plain privacy/data-usage wording on the cover, dashboard, module pages and summary.
- Added one small build plan for each M9–M14 milestone and linked them from the roadmap.
- Why: implement the approved Version 1.2 roadmap update. ([ADR 0015](adr/0015-front-door-no-profile-and-clearer-privacy.md))

## 2026-09-17 23:36 — Product roadmap update: front door, labels, dates and privacy wording
- Updated the PRD to Version 1.2 with the approved direction: cover page, no age/gender
  collection, full date/year on records, camera-or-upload photo entry, clearer privacy/data
  wording, and final module names.
- Added M9–M14 to `Product_Roadmap.md`, after the delivered M1–M8 sequence.
- Why: the next product direction must live in the PRD and roadmap before any build work.
  ([ADR 0015](adr/0015-front-door-no-profile-and-clearer-privacy.md))

## 2026-09-16 23:08 — Living docs established
- Added `ARCHITECTURE.md`, `DECISIONS.md` with `adr/0001`–`0014`, this changelog, and the
  `plan/` folder with the build plans behind the work so far.
- Rewrote `README.md` so it points at these documents instead of contradicting them.
- Recorded blood-pressure photo reading in the PRD, which the code already shipped.
- Why: intent, structure, rationale and history each need one authoritative home.
  ([ADR 0014](adr/0014-living-docs-structure.md))

## 2026-09-16 23:04 — PRD reconciliation fixes (six items)
- The health summary now sends **grade labels only** — no readings, dates, age or gender.
  Verified in the live network payload. ([ADR 0007](adr/0007-summary-sends-grade-labels-only.md))
- Body composition is now graded: BMI, 體脂率 and 內臟脂肪等級 each get their own badge,
  using Asian cut-offs. ([ADR 0013](adr/0013-asian-bmi-cutoffs.md))
- Added `gradeEntry()` as the single grader and `readEntries()` as the single stored-data
  reader; removed the duplicated inline copies in the form, the export and the summary.
  ([ADR 0008](adr/0008-single-reader-single-grader.md))
- The 「僅供參考，不能取代醫生診斷」 and 「資料只存在此裝置」 notices now sit permanently on all
  four module pages and the summary page, instead of appearing only as a passing toast.
- CSV export gained a 評級 column and keeps its UTF-8 BOM; grades sit only on graded fields.
  ([ADR 0011](adr/0011-csv-bom-and-grade-column.md))
- The daily AI counter now increments only after a successful call, so a failure no longer
  burns the user's allowance. ([ADR 0010](adr/0010-best-effort-daily-ai-cap.md))
- Form inputs are now properly linked to their labels, which also helps screen readers.
- Restored `PRD.md` to the project root as the single source of truth for scope.
- Plan: [plan/09-prd-reconciliation.md](plan/09-prd-reconciliation.md)

## 2026-09-16 — Initial build: milestones M1–M8
- Design system and Traditional Chinese 50+ friendly shell; dashboard with four module cards.
- Blood pressure module with worse-of-two grading and the isolated-systolic flag, local
  history and trend chart. ([ADR 0004](adr/0004-blood-pressure-worse-of-two.md))
- Re-check dates by tier with `.ics` download and Google Calendar link; crisis readings show
  即時就醫 instead. ([ADR 0006](adr/0006-crisis-tier-no-calendar.md))
- Body composition, grip strength and sit-and-reach modules with age × gender matrices and
  honest 無適用參考標準. ([ADR 0005](adr/0005-no-extrapolation-outside-charts.md))
- Photo drag-and-drop read by a server-side AI call into an editable review form, confirmed
  before saving; image downscaled in the browser first.
  ([ADR 0002](adr/0002-ai-credential-in-own-server-layer.md), [ADR 0012](adr/0012-review-before-save.md))
- Voice dictation where the browser supports Chinese recognition.
  ([ADR 0009](adr/0009-capability-gated-voice-input.md))
- One-click CSV export and a deliberate two-step clear-all.
- Grounded health summary built strictly from the bundled reference leaflet.
- All data kept in browser storage; no database. ([ADR 0001](adr/0001-local-first-browser-storage.md))
- Plan: [plan/01-08-initial-build.md](plan/01-08-initial-build.md)
