# Changelog

What changed, when, and why. Newest first. Times are Hong Kong Time (UTC+8).
Once this file passes ~100 entries, the older half moves to `changelog-archive.md`
(append-only). Entries here are written when the change is made, not reconstructed later.

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
