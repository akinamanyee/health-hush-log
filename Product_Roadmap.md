# Product Roadmap — 健康紀錄簿

Ordered so the product is genuinely usable at the end of every milestone. Each milestone is one slice of the magic, traceable to the PRD; the HOW lives in the per-milestone build plan under [plan/](plan/).

**Status (2026-09-19 15:56 HKT):** M1–M15 delivered. M1–M8: [plan/01-08-initial-build.md](plan/01-08-initial-build.md), followed by [plan/09-prd-reconciliation.md](plan/09-prd-reconciliation.md). M9–M14: [plan/10-m09-cover-entrance.md](plan/10-m09-cover-entrance.md), [plan/11-m10-four-clear-choices.md](plan/11-m10-four-clear-choices.md), [plan/12-m11-no-profile-gate.md](plan/12-m11-no-profile-gate.md), [plan/13-m12-full-recording-date.md](plan/13-m12-full-recording-date.md), [plan/14-m13-camera-or-upload.md](plan/14-m13-camera-or-upload.md), [plan/15-m14-privacy-data-usage.md](plan/15-m14-privacy-data-usage.md).

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

Each milestone ends with a live, usable product: M1 is a shell you can look at, M2 a working logbook, and every later step adds magic without breaking what's there.
