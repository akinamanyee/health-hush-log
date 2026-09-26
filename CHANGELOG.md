# Changelog

What changed, when, and why. Newest first. Times are Hong Kong Time (UTC+8).
Once this file passes ~100 entries, the older half moves to `changelog-archive.md`
(append-only). Entries here are written when the change is made, not reconstructed later.

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
