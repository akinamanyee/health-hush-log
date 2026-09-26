# Product Roadmap — 健康紀錄簿

Ordered so the product is genuinely usable at the end of every milestone. Each milestone is one slice of the magic, traceable to the PRD; the HOW lives in the per-milestone build plan under [plan/](plan/).

**Status (2026-09-24):** M1–M22 deployed to Cloud Run (`heartcaring-app`, region `asia-east1`, revision 24) and live on heartcaring.fit. **M23 delivered in code, awaiting redeploy** — 體脂率 cards gain a grounded HA (醫管局) tips topic and a collapsible static reference table for self-classification; new ADR 0025 formalizes "static reference tables may be gender/age structured; AI-generated content may not". `/summary` cards render name, value, grade badge, date and interpretation together (M20 date + M21 card-name filter with retry); a preview block above the generate button (M22) shows which modules will contribute cards, which are missing, and today's remaining AI budget before the user spends a call. Ejected from Lovable; direct Google Gemini via `@ai-sdk/google` v4, `ai` v7, model `gemini-3.6-flash`. Health summary (`generateText`) and photo extraction (`inline_data` fix) both resolved. Summary section shows agency-only attribution (衞生防護中心 / 衞生署 / 職業安全健康局) with a sensitive-word grounding check and an empty-tips retry+fallback. M1–M8: [plan/01-08-initial-build.md](plan/01-08-initial-build.md), followed by [plan/09-prd-reconciliation.md](plan/09-prd-reconciliation.md). M9–M14: [plan/10-m09-cover-entrance.md](plan/10-m09-cover-entrance.md), [plan/11-m10-four-clear-choices.md](plan/11-m10-four-clear-choices.md), [plan/12-m11-no-profile-gate.md](plan/12-m11-no-profile-gate.md), [plan/13-m12-full-recording-date.md](plan/13-m12-full-recording-date.md), [plan/14-m13-camera-or-upload.md](plan/14-m13-camera-or-upload.md), [plan/15-m14-privacy-data-usage.md](plan/15-m14-privacy-data-usage.md). M15: [plan/16-m15-coherent-record-journey.md](plan/16-m15-coherent-record-journey.md). M16: [plan/17-m16-trustworthy-numbers-and-dates.md](plan/17-m16-trustworthy-numbers-and-dates.md). M17: [plan/18-m17-complete-tanita-data.md](plan/18-m17-complete-tanita-data.md). M18: [plan/19-m18-rich-summary.md](plan/19-m18-rich-summary.md). M19: [plan/20-m19-tanita-screen-sections.md](plan/20-m19-tanita-screen-sections.md). M20: [plan/21-m20-date-on-summary-cards.md](plan/21-m20-date-on-summary-cards.md). M21: [plan/22-m21-cards-name-match.md](plan/22-m21-cards-name-match.md). M22: [plan/23-m22-summary-preview.md](plan/23-m22-summary-preview.md). M23: [plan/24-m23-body-fat-reference-source.md](plan/24-m23-body-fat-reference-source.md).

## M1 — A calm home worth returning to
The Traditional Chinese, 50+ friendly shell: the Japanese-minimalist glass-and-earth-tone design system, the dashboard with four clearly labelled module cards, the standing 「資料只存在此裝置」 privacy notice, and the 「僅供參考，不能取代醫生診斷」 disclaimer. Value: a visitor immediately understands what this is, trusts it, and can navigate without reading instructions.
Traces: USER · Visual Design System · HARD CONSTRAINTS (privacy, disclaimer).

## M2 — 血壓紀錄: your first trustworthy logbook
Blood-pressure entry by typing, instant grading against the reference chart (including the worse-of-two rule that surfaces isolated systolic hypertension), and local history with a trend view. Value: a real, working logbook for the most-watched metric of this audience — usable product from here on.
Traces: USER JOURNEY 2–3 (manual input path) · Blood Pressure module · Data Portability (local history).

## M3 — 複查日曆: never wonder when to re-check
The re-check date computed from the tier (6 months / 1 year / 2 years; crisis-level readings show 「即時就醫」 instead), with a one-tap downloadable calendar file and a Google Calendar link. Value: the app turns a grade into an action, closing the loop on blood pressure.
Traces: Calendar Synchronization · SUCCESS (the .ics moment).

## M4 — 全部四個模組: every check, one book
Grip strength and sit-and-reach join Tanita body composition as typed-entry modules with age- and gender-matched grading, honest 「無適用參考標準」 when a chart doesn't cover the user, and a trend history each. Value: all four readings live in one place with the same familiar flow.
Traces: The Four Core Health Modules · HARD CONSTRAINTS (deterministic grading).

## M5 — 影相即記: readings from a photo
Drag-and-drop a photo of the Tanita screen or monitor; the reading is read by the server-side AI and lands in an editable review form, confirmed before it saves — with honest Chinese errors and an empty-field fallback, never guesses. Includes the daily AI-usage cap message. Value: the signature moment — paper logbook habits with zero typing.
Traces: Multimodal Input · Secure Backend Integration · SUCCESS · HARD CONSTRAINTS (key server-side, nothing persisted).

## M6 — 講出嚟都得: voice dictation
A microphone button on the same forms where the browser supports Chinese dictation; spoken numbers land in the same review-and-confirm flow. Value: the fastest, most accessible input for the 50+ user who types slowly.
Traces: Multimodal Input (microphone button) · capability-gated per investigation.

## M7 — 帶得走的數據: CSV export
One-click export of the full history in Excel-friendly Traditional Chinese CSV, plus the deliberate clear-all action. Value: true local-first ownership — data is portable and erasable by the user alone.
Traces: Data Portability · HARD CONSTRAINTS (local-only, clear-all).

## M8 — 健康摘要: grounded advice, never invented
The reporting section: a plain-language health summary generated strictly from the bundled reference leaflets, declining anything outside them, failing visibly rather than hallucinating. Value: the calm, safe voice that interprets the four modules without ever playing doctor.
Traces: Grounded AI Advice · HARD CONSTRAINTS (grounding, disclaimer).

## M9 — 封面入口: a calmer first impression
The app opens with a dedicated cover page using the supplied image, the product name, the local-only privacy promise, and the medical disclaimer. Value: users understand the app before entering their health logbook, without reading a settings page.
Traces: USER JOURNEY 1 · HARD CONSTRAINTS (privacy notice, disclaimer) · Visual Design System.

## M10 — 四項清楚選擇: pick the check you need immediately
After entering from the cover page, users see four large choices using the final wording: 血壓、身體成份分析儀、手握力、坐地前伸測試. The supplied icons pair directly with those Chinese labels. Value: the main path becomes obvious for older users and matches the real-world test names.
Traces: USER JOURNEY 1–2 · USER · Traditional Chinese throughout.

## M11 — 少一步記錄: no age or gender gate
Recording no longer starts with age and gender. Each module lets the user record the reading directly, and where a reference chart cannot grade without age or gender, the app saves the number and states 「無適用參考標準」 instead of asking for profile details. Value: faster recording with no unnecessary personal information collected.
Traces: OUT OF SCOPE (no profiles) · HARD CONSTRAINTS (anonymous, no per-user records, no extrapolation outside charts).

## M12 — 日期清楚的紀錄簿: every saved reading shows its date and year
Each saved record clearly displays the full recording date including year. Value: users can trust when a measurement happened, especially when comparing older readings or exporting history.
Traces: USER JOURNEY 3–5 · SUCCESS (CSV history) · Data Portability.

## M13 — 相機或相簿: easier photo entry
Where photo reading is available, users can either take a photo with the device camera or upload an existing photo. The same review-before-save step remains in place. Value: the signature “photo to form” moment works naturally on phones and desktops.
Traces: USER JOURNEY 2–3 · SUCCESS (screen photo read into form) · HARD CONSTRAINTS (only the photo being read may reach the server).

## M14 — 私隱與資料使用更明確: trust stays visible
The cover page, module pages, and reporting area carry plain Traditional Chinese privacy and data-usage wording: health records stay on this device, photos are sent only for reading, summaries receive grade labels only, and the content cannot replace a doctor’s diagnosis. Value: users know exactly what happens to their data at the moment they use the app.
Traces: HARD CONSTRAINTS (local storage, server-only AI credential, allowed server data, disclaimer) · NORTHSTAR.

## M15 — 清楚而連貫的紀錄旅程: the grade and destination never disappear
The four supplied replacement illustrations load without cropping; saved history displays its grade; every module offers camera or upload; record, summary and error pages return directly to 健康紀錄簿; and the clean cover opens privacy terms from a link. Value: the core journey remains understandable after the first save, not only before it.
Traces: USER JOURNEY 1–5 · SUCCESS · HARD CONSTRAINTS (Traditional Chinese, notices, deterministic grading).

## M16 — 可信的數字與日期: every claim holds up
The summary is checked after it is written and withheld rather than shown if it contains a number
outside the bundled reference material or drops the doctor reminder; each grading table names one
official source; readings save under the device's own calendar day and re-check dates never slip
past a month end; spoken Chinese numerals are understood; and any past blood-pressure record can
produce its re-check reminder. Value: the logbook's numbers, grades and dates can be trusted
without checking them by hand.
Traces: HARD CONSTRAINTS (grounded AI, deterministic grading, no extrapolation) · Calendar Synchronization · Multimodal Input (voice) · NORTHSTAR.

## M17 — 完整身體成份分析儀數據: every Tanita reading, one record
The Tanita module captures all 21 metrics the 身體組成分析儀 produces across its six display
screens, up from the current 5: body fat mass, muscle ratio, body water (% and kg), BMR (kcal
and kJ), and segmental fat % and muscle mass for trunk, arms and legs. Photo reading extracts
whichever screen is visible; multiple photos merge into one record. The 16 new fields are
optional — a record is valid with just the original 5. Value: the logbook captures everything
the machine shows, not just the highlights.
Traces: USER JOURNEY 3–4 (records a reading, reviews and confirms) · The Four Core Health Modules (Tanita) · Data Portability (CSV) · HARD CONSTRAINTS (local-only, deterministic grading, no extrapolation).

## M18 — 結構化健康摘要: rich, grounded summary with tips and sources
The health summary is rebuilt as a structured report: each metric gets a plain-language
interpretation card with the user's value and grade badge, followed by actionable health tips
distilled from 16 government articles with clickable source links and a disclaimer. The AI
receives the latest readings alongside grade labels (no dates, age or gender) and returns
structured JSON validated against the bundled reference material. `interpretCard()` provides
deterministic card data by calling the single `gradeEntry()` authority internally.
Value: the summary reads like a clinic leaflet — every claim is traceable to its source.
Traces: NORTHSTAR · Grounded AI Advice · HARD CONSTRAINTS (grounding, disclaimer, local-only) · USER JOURNEY 7.

## M19 — 六屏身體成份分析儀: per-screen photo extraction
The Tanita module is restructured into six labelled sections matching the physical analyser's
screens (體脂率, 肌肉量, 身體水分, 內臟脂肪, 基礎代謝率, BMI). Each section has its own
camera/upload button and a narrowed AI extraction prompt (3–8 fields instead of 21), improving
accuracy. Multiple photos merge into one record. Voice input is removed from Tanita only —
per-screen photo replaces it as the fast-entry path; other modules keep voice. Shared record
state is extracted into `useRecordState`, consumed by both `TanitaRecord` and `RecordModule`.
`ScreenDef.fields` is the single source of truth for field-to-screen mapping.
Value: the logbook mirrors the physical device — users photograph each screen and see exactly
those fields fill in, instead of guessing which of 21 fields one photo might cover.
Traces: USER JOURNEY 2–4 · The Four Core Health Modules (Tanita) · Multimodal Input · HARD CONSTRAINTS (local-only, review before save) · Data Portability (CSV).

## M20 — 摘要卡片顯示紀錄日期: every summary card owns its date
Each `/summary` card shows the full recording date (with year) of the saved reading it
represents, using the same `formatChineseDate` helper that the logbook and record pages
already use. Value: users can tell at a glance which saved reading each summary card
comes from and how fresh it is, honouring the PRD promise that every saved record shows
its date-with-year — now consistently on the summary too.
Traces: USER JOURNEY 5 (「full recording date including year」) · SUCCESS (「every saved record shows the date with year」) · HARD CONSTRAINTS (Traditional Chinese, deterministic display).

## M21 — 可信的摘要卡片: every card shows name, value, grade and date, always
`/summary` guarantees a full-shape card for every saved reading it interprets — name,
value, colored grade badge, recording date and AI interpretation always render together.
Server-side card-name validation with retry ensures the AI's response mirrors the input
card names exactly (e.g. it cannot silently rename 「血壓」 to 「血壓及脈搏」); dropped
matches trip the same single strict retry pattern the tips section already uses.
Value: users trust the card because the reading they saved is what they see interpreted,
complete with its grade and date, with no silent drops.
Traces: USER JOURNEY 4-5 (「grades the reading」, 「full recording date including year」) · SUCCESS (「a blood pressure of 152/78 grades as 高血壓（第一期）・單純收縮期高血壓 with a 6-month re-check date」) · NORTHSTAR (trustworthy) · HARD CONSTRAINTS (deterministic grading).

## M22 — 生成前的預覽: know what will feed the summary before you spend a call
`/summary` shows a live preview above the generate button — which of the four modules
will contribute a card (with each latest reading's date), which are missing, whether a
recorded Tanita entry actually carries any grade-able metric, and today's remaining AI
budget. The button disables and rewords itself when the cap is reached, replacing the
after-the-click toast.
Value: users understand the summary's scope before spending an AI call — no more
"generate blind then wonder what's in there".
Traces: USER JOURNEY 7 (「reads a plain-language health summary」) · NORTHSTAR (trustworthy — know the scope before generating) · HARD CONSTRAINTS (Traditional Chinese, 50+ friendly, daily AI cap).

## M23 — 體脂率參考標準: authoritative reference for the un-gradable card
The Tanita summary card for 體脂率 (which by policy shows 「無適用參考標準」 because
the app collects no gender or age) now sits alongside (a) a grounded tips topic
sourced from the Hong Kong Hospital Authority's public "我的體重是否在健康範圍內呢？"
article, and (b) a static, collapsible 標準脂肪量 reference table (2 age rows × 2
genders, 運動員 row deliberately omitted) sourced from the same article. Users can
consult the table to self-classify — the app itself still refuses to grade because
it collects nothing personal.
Value: users get an authoritative pointer instead of silence around a card the app
by design cannot classify.
Traces: NORTHSTAR (trustworthy — authoritative pointer, not silence) · HARD CONSTRAINTS (Grounded AI Advice — extending the bundled leaflet) · USER JOURNEY 7 · ADR 0025 (new — static reference vs AI advice principle).

## M24 — 對齊磅面的體脂分級: TANITA 5-tier static reference
The static 標準脂肪量 table under the 體脂率 summary card switches source
from HA (醫管局, 2-tier × 2-age) to TANITA〈身體組成數據參考指標〉 —
the same 5-tier scheme (消瘦 / 標準健康型 / 標準警戒型 / 微胖 / 肥胖) ×
3 age buckets × gender that the user's own 身體組成分析儀 displays. AI
grounding for 體脂率 tips remains sourced from HA (ADR 0025 permits
divergent sources for static vs generated content). No storage, grading,
AI-prompt or sensitive-word logic changes; the card grade badge still
shows 「無適用參考標準」 because the app collects no gender/age.
Value: what the user reads off their own scale (「標準健康型」, 「微胖」,
…) maps directly onto a cell in the app's reference table — no
cross-scheme translation.
Traces: NORTHSTAR (trustworthy — the reference matches the device) · HARD CONSTRAINTS (no gender/age collection, deterministic grading unchanged) · USER JOURNEY 7 · ADR 0025 (Source change history).

## M25 — 體脂率讀數視覺定位: your reading, marked on the TANITA chart
The 體脂率 static reference table gains a value-overlay: each of the 30
cells (5 tiers × 3 age × 2 gender) lights up (subtle background + ★) when
the user's latest recorded 體脂率 falls within that cell's range. The user
then eyeballs the column matching their own gender + age and reads their
tier from the marked cell. The app never asks for gender or age — the
overlay just shows "your reading falls here in each column"; the user
self-identifies which column is theirs. The AI-side pointer strings in
`REFERENCE_LEAFLET` and the 體脂率 tip become source-neutral («卡片下方
之對照表»), fixing a M24 peer-review blocker where the AI was directing
users to a 醫管局 table while the JSX now renders TANITA. Grade badge
still shows 「無適用參考標準」 (PRD L51 preserved); no gender/age
collected (PRD L13/L50 preserved).
Value: users find their tier in one glance instead of scanning a 30-cell
matrix; the AI stops pointing at a source that doesn't match the visible
table.
Traces: NORTHSTAR (trustworthy — pointer matches what's shown, reading is easy to locate) · HARD CONSTRAINTS (no gender/age collection, deterministic grading unchanged) · USER JOURNEY 7 · ADR 0025 (numbers-in-JSX-only preserved).

## M26 — 體脂率卡片略去 grade badge: no more self-contradiction
The 體脂率 summary card stops rendering the 「無適用參考標準」 grade
badge chip. After M23-M25 the same card carries a full TANITA
reference matrix directly below, with each cell containing the user's
recorded value visually highlighted — showing a chip that says 「no
applicable reference standard」 above those very reference numbers is
self-contradictory. The grader itself is unchanged (`gradeEntry`
still refuses to classify body-fat without gender/age, PRD L13/L50
preserved); only the visual chip is skipped in `summary.tsx`. PRD L51
gains an Exception clause covering in-app self-lookup reference
tables.
Value: users stop seeing 「no reference exists」 two lines above a
reference table they can look themselves up in.
Traces: NORTHSTAR (trustworthy — no self-contradiction) · HARD CONSTRAINTS (no gender/age collected, deterministic grading unchanged) · USER JOURNEY 7 · ADR 0025 (Source change history: M26 badge omission + PRD L51 Exception).

## M27 — TANITA 參考完整化: BMR + 體內水分 + SMI
The self-lookup card pattern extends from 1 to 4 cards. 基礎代謝率 (BMR),
體內水分, and 肌少症指數 (SMI, 骨骼肌指數) each gain in-app TANITA static
reference tables with M25-style value overlay. SMI is a new Tanita field
extractable from the muscle-screen photo. Wire payload to the AI is
sanitized for all four self-lookup cards ("請自行對照下方對照表" replaces
"無適用參考標準" for these cards' `grade` field), reducing AI prose echo
of the negative label the summary UI already hides. `CARDS_WITH_SELF_LOOKUP`
Set in `summary.tsx` drives both the M26 badge-omission gate and the
wire-sanitize. PRD L51 Exception clause updated to name all four cards.
No new AI grounding numbers, no gender/age collection, no storage-schema
version bump (SMI joins as nullable field; old records show blank in CSV).
Value: the three remaining TANITA reference metrics that had no self-lookup
tables now get the same trustworthy user experience as body-fat did after
M25/M26, plus SMI is captured for the first time.
Traces: NORTHSTAR (trustworthy — reference matches the device) · HARD CONSTRAINTS (no gender/age collection, deterministic grading unchanged, grounded leaflet unchanged) · USER JOURNEY 3-4 (SMI in record flow), 7 (summary) · ADR 0025 (Source change history: M27 extension + wire-sanitize).

## M27a — 摘要 wire payload cap: 6 → 12 (hotfix)
Server-side Zod schema `RichSummaryInput.cards.max(6)` was rejecting
payloads with >6 cards, so any user who recorded a full Tanita reading
(6 cards after M27) plus BP or another module (7-9 cards total) had
`/summary` generate fail silently with a toast error. Cap raised to 12
— covers today's worst case (9) plus 3 slack for future additions
without another cap discussion. ARCHITECTURE.md L103 updated in-place.
No storage or wire-shape change; only the size limit.
Value: users with rich data on multiple modules can generate summaries
again.
Traces: NORTHSTAR (trustworthy — generate button works) · SUCCESS (blood-pressure demo path unblocked) · caught in M27 peer review, fixed here.

## M28 — 手握力 self-lookup card: 職安局 5-tier reference with value overlay
The 手握力 summary card gains an in-app self-lookup reference table from
職安局 (Occupational Safety and Health Council) — 5 tiers (欠佳 / 尚可 /
常 / 良好 / 優異) × 5 age bands (20-29, 30-39, 40-49, 50-59, 60-69) × 2
genders — with a ★ overlay on cells matching the user's recorded L+R
combined grip value. Same M25/M27 pattern extended to a 5th card. Field
label clarified to 「手握力（左右合計）」 and AI extraction prompt updated
so entries are unambiguously combined. Classifier `classifyHandGrip`
ships as a utility in a new `handgrip.ts` file but has no runtime caller
(PRD L13/L50 forbid programmatic classification without collected
age/gender — user self-identifies via the matrix). `matchesCell` gains a
`≤N` branch. Grade badge omitted per M26 Exception (list now 5 cards).
Wire-payload sanitize (M27) applies to 手握力 too. No storage schema
bump, no new agency, no new AI grounding numbers.
Value: 手握力 gains the same trustworthy self-lookup UX as body-fat /
BMR / water / SMI, closing the loop for one of the two previously
un-referenced modules.
Traces: NORTHSTAR (trustworthy — reference matches user's own reading path) · HARD CONSTRAINTS (no age/gender collection, deterministic grading unchanged) · USER JOURNEY 7 · ADR 0019 (職安局 already an accepted source) · ADR 0025 (Source change history: M28 extension).

## M28a — hotfix: grip 「無適用參考標準」 across pages + summary card overflow
Two post-M28 bugs caught in phone testing. (1) `gradeEntry` returned a
「無適用參考標準」 label unconditionally for grip, so `/handgrip` record
page + `/logbook` rows + CSV grade column all showed the label — now
factually wrong because M28 gave grip a 職安局 self-lookup table.
`gradeEntry` for grip now returns `[]`; label removed from record /
logbook / CSV; summary card behaviour byte-identical (interpretCard
falls back to hardcoded string; wire-sanitize preserved). (2) Summary
matrix tables bled past the white card's right edge on narrow phones —
the card's flex child lacked `min-w-0`, letting wide content expand
past the calculated flex share and drag the `overflow-x-auto` wrapper
outside the card border. Added `min-w-0` to the flex child; all summary
tables now scroll inside the card.
Value: consistent「app doesn't grade this」message across pages for
grip; matrix tables stay within card boundaries on mobile.
Traces: NORTHSTAR (trustworthy — no more contradictory labels) · HARD CONSTRAINTS (grader still refuses to classify; SSOT preserved) · caught in M28 phone testing, fixed here.

## M29 — 坐地前伸 self-lookup card: 職安局 5-tier reference with value overlay
The 坐地前伸 summary card gains an in-app self-lookup reference table
from 職安局 — 5 tiers (欠佳 / 尚可 / 常 / 良好 / 優異) × 5 age bands
(20-29 through 60-69) × 2 genders — with a ★ overlay on cells containing
the user's recorded distance (cm, can be negative). Same M25/M27/M28
pattern extended to a 6th card. `gradeEntry` for sit-reach now returns
`[]` (mirrors M28a grip), removing the misleading 「無適用參考標準」
label from record/logbook/CSV; summary-card payload byte-identical via
`interpretCard`'s hardcoded fallback (wire-sanitize preserved). Grade
badge omitted per M26 Exception (list now 6 cards). No `matchesCell`
regex change needed (M28's branches already cover). Two verbatim source
gaps (男 30-39 @ 30 cm; 男 60-69 @ 22 cm) preserved as-provided with
footer note. No storage schema bump, no new agency, no new AI grounding
numbers.
Value: 坐地前伸 gains the same trustworthy self-lookup UX as the other
5 cards; last of the initial four modules closes the loop on the
reference-completion program.
Traces: NORTHSTAR (trustworthy — reference matches user's own reading path) · HARD CONSTRAINTS (no age/gender collection, deterministic grading unchanged) · USER JOURNEY 7 · ADR 0019 (職安局 accepted source) · ADR 0025 (Source change history: M29 extension).

## M30 — 記錄後的去向: bottom-of-page 返回紀錄簿 + 查看摘要 nav
Every record page (`/blood-pressure`, `/grip`, `/sit-and-reach`,
`/tanita`) gains a bottom navigation with two links (「← 返回健康紀錄簿」
+ 「查看健康摘要 →」) rendered above the privacy notice. Surfaces
USER JOURNEY 5 and 7 destinations at the natural post-save touchpoint
— the top-of-page back-link only helps users scrolled up at the header,
but after saving and scrolling through 歷史紀錄, the user's thumb sits
at the bottom of the page. Both links are large-text (`text-lg`),
≥48px touch targets, focus-visible for keyboard, and `<nav>`-landmarked
for screen readers. Nothing else touched — no state, no storage, no
grading, no AI, no PRD change.
Value: 50+ readers see where to go next at the exact scroll position
they've reached after recording, without hunting.
Traces: NORTHSTAR (trustworthy — the app guides its user) · USER JOURNEY 5 (「can return directly to 「健康紀錄簿」 without replaying the cover」) · USER JOURNEY 7 (path to health summary explicit) · HARD CONSTRAINTS (50+ friendly touch targets, Traditional Chinese, disclaimer footer preserved).

## M34 — 摘要延時可見: server-side wall-clock diagnostics
After M33 confirmed the summary handler returns HTTP 200 successfully
every time (three consecutive POST 200 lines in Cloud Run logs for
one live 「Load failed」 report), yet iPhone Safari still shows the
network-layer 「Load failed」 toast, the failure is provably
mid-flight: the mobile carrier / intermediate proxy drops the TCP
connection before the response body finishes arriving; the server
never learns the client walked away. Latency-reduction fixes are
gated on measurement — a fix aimed at the wrong phase (base call vs
JSON-retry vs grounding-retry) would waste the round. M34 adds
per-phase and total wall-clock duration logs to
`src/lib/health/ai.functions.ts` so one deployed 生成 attempt names
the actual number and one photo drop names the extract-side number.
`generateRichSummary` logs `[generateRichSummary] <phase> ok|failed
<ms>` for each of 初次 / 格式重試 / 合規重試 plus a
`[generateRichSummary] total <ms> cards=<N>` bookend (with
`(errored)` suffix on throw). `extractFromImage` logs
`[extractFromImage] ai ok|failed <ms> module=<mod> screen=<id|all>`.
Logs contain durations, counts, module and screen IDs only — never
card values, prompts, or AI outputs (PRD L47/L48/L50 preserved). No
latency change, no timeout change, no model change, no client change
in M34 — the diagnostic IS the deliverable, and M35 picks the right
Step-2 fix from the numbers.
Full plan: [plan/37-m34-summary-latency-diagnosis.md](plan/37-m34-summary-latency-diagnosis.md).
Value: replaces guesswork with named ms per phase; the next latency
milestone can target the phase actually costing time instead of
firing blind at three candidate causes.
Traces: NORTHSTAR (trustworthy — real numbers rather than mystery timeouts) · HARD CONSTRAINTS L52 (failed generation must show a real error) · debugging support for the sole open user bug on `/summary`.

## M33 — hotfix: AI 呼叫失敗顯示 Chinese 錯誤而非「Load failed」
Two `generateText(...)` call sites in `src/lib/health/ai.functions.ts`
(`generateRichSummary` inner `run()` and `extractFromImage`'s image
call) previously ran without `try/catch`. Any Google-side failure
(auth, quota, model deprecated, transient network, Cloud Run 60s
timeout) threw uncaught, the handler 500'd with no CORS body, and
iPhone Safari surfaced the network-layer `TypeError: Load failed` in
`toast.error(e.message)`. M33 wraps both calls: server-side
`console.error` preserves the full underlying trace in Cloud Run logs;
the client toast now reads 「摘要生成暫時未能連線（初次｜格式重試｜合規重試）。請稍後再試。」
or 「圖片讀取暫時未能連線，請稍後再試或手動輸入。」 in 繁中. Phase tag
in the summary message narrows which retry died (base vs JSON-retry vs
grounding-retry) for repeat reports. No timeout, retry-count, model,
wire-payload, or grading logic change — only the failure surface.
Full plan: [plan/36-m33-ai-call-error-surface.md](plan/36-m33-ai-call-error-surface.md).
Value: PRD L52's promise 「a failed generation must show a real error
rather than invented advice」 now holds in 繁中 for the case it was
silently violating (network-layer failure surfaced as English 「Load failed」).
Traces: NORTHSTAR (trustworthy — real errors, in the user's language) · HARD CONSTRAINTS (L52 failed-generation real error, L55 繁中 throughout).

## M32 — Tanita 每項必填、部位測量下架: 收支明確
The Tanita module drops the two segmental sections (部位脂肪率 ×5 fields,
部位肌肉量 ×5 fields) entirely, and elevates the 7 previously-optional
fields (體脂量, 肌肉比率, 肌少症指數, 身體水分率, 身體水分量,
基礎代謝率 kcal, 基礎代謝率 kJ) to required. Net: 22 fields → 12,
all 必填. Removes the 選填 tag and collapsed `<details>` block from the
Tanita record page; wire payload and Zod extraction schema trimmed to
match. Save button now enforces every field is filled before storing
a record (existing `!f.optional` gate in `useRecordState.submit`).
This supersedes M17's 「16 new fields optional — a record is valid with
just the original 5」 clause. No storage schema bump — orphan
segmental keys in old localStorage entries stay in place, harmless
because history / CSV read `mod.fields.filter(...)`. No AI grounding
change; `REFERENCE_LEAFLET` / `TIPS_REFERENCE` byte-identical.
Full plan: [plan/35-m32-tanita-required-fields.md](plan/35-m32-tanita-required-fields.md).
Value: 50+ 繁中 readers no longer face a mixed 必填/選填 form with
a hidden section — if a field is on the page, it belongs on the record.
Traces: NORTHSTAR (readable — no ambiguity) · USER JOURNEY 3 (「records a reading」) · HARD CONSTRAINTS (Traditional Chinese, 50+ friendly, deterministic grading unchanged, local-only) · supersedes M17 optional-field clause.

## M31 — Tanita 6-屏加解釋文字: 用家指引
Each of the Tanita module's 6 screens (體脂率, 肌肉量, 身體水分,
內臟脂肪, 基礎代謝率, BMI) gains a short 繁中 description under its
numbered heading, telling users what the screen measures before they
record a reading. Fills the info gap that grip and sit-reach already
close via their module-level `infoText` popover — Tanita has 6 screens
so each gets an inline description instead. Descriptions live on
`ScreenDef.description` (new optional field) in `modules.ts`;
`TanitaRecord.tsx` renders them under `<h2>` before the photo-drop.
UI-only — text never enters `REFERENCE_LEAFLET` or `TIPS_REFERENCE`, so
`allowedNumbers` and AI grounding math are byte-identical. Zero storage
schema change; per-screen photo extraction (M19) unaffected because
`ScreenDef.fields[]` is untouched. Sensitive-word audit + numbers audit
(ADR 0024 / 0025) both green.
Value: 50+ 繁中 readers now understand what each Tanita screen measures
before recording, without having to guess or leave the page.
Traces: NORTHSTAR (trustworthy — the app teaches its own vocabulary) · USER JOURNEY 3 (「records a reading」) · HARD CONSTRAINTS (Traditional Chinese, 50+ friendly, no AI grounding change) · ADR 0025 (UI text stays out of AI grounding).

Each milestone ends with a live, usable product: M1 is a shell you can look at, M2 a working logbook, and every later step adds magic without breaking what's there.
