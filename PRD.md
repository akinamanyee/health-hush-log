# PRD — 健康紀錄簿 (Health Logbook)

**Version 1.2** · 2026-09-17 23:36 HKT · the single source of truth for scope.

Version 1.2 adds the next product direction: a cover page will precede the dashboard, age and
gender will no longer be collected, every saved record will show its full date and year, the
module wording will use 血壓、身體成份分析儀、手握力、坐地前伸測試, photo entry will offer camera
capture or upload, and privacy/data-usage wording will be clearer at the points of use. Version
1.1 records what the build delivered beyond Version 1's wording: the photo-reading path also
covers the blood-pressure monitor screen, not only the Tanita display; the CSV export carries a
grade column alongside the readings; and the health summary receives grade labels only. How this
is built: [ARCHITECTURE.md](ARCHITECTURE.md) · why: [DECISIONS.md](DECISIONS.md) · history:
[CHANGELOG.md](CHANGELOG.md) · roadmap: [Product_Roadmap.md](Product_Roadmap.md).

## NORTHSTAR
Make self-tracked health numbers as trustworthy and readable as a clinic report, without a single byte of medical data leaving the user's device.

## USER
Traditional-Chinese-reading adults aged 50+ in Hong Kong and Taiwan who already own a Tanita body-composition scale, a home blood-pressure monitor, or attend community fitness checks — and who keep the results on paper, in photos, or nowhere at all.

## PROBLEM
Readings sit scattered across paper notes and phone photos, so nobody can tell whether a number is normal for their age and gender, or when the next check is due.

## USER JOURNEY
1. Opens the cover page and sees the supplied image, the app name, the local-only privacy promise, the data-usage note, and 「僅供參考，不能取代醫生診斷」.
2. Enters the dashboard and sees four clearly labelled choices — 血壓、身體成份分析儀、手握力、坐地前伸測試 — paired with the supplied icons.
3. Picks a module and records a reading three ways: use the camera or upload a photo of the device screen for AI reading, speak the numbers, or type them.
3. Reviews and confirms the extracted values in an editable form, then saves — the app grades the reading against bundled reference charts and shows the tier in plain Traditional Chinese.
4. Sees the saved record with the full recording date including year.
5. Takes the calculated re-check date (6 months / 1 year / 2 years by tier) into a calendar with a one-tap `.ics` download or Google Calendar link.
6. Reads a plain-language health summary built strictly from the bundled reference leaflets, and exports the whole history as an Excel-friendly CSV.

## SUCCESS
In today's live demo: the cover page leads into four choices labelled 血壓、身體成份分析儀、手握力、坐地前伸測試; a Tanita/body-composition screen photo or a blood-pressure monitor photo can be captured by camera or uploaded, read into the form and confirmed; a blood pressure of 152/78 grades as 高血壓（第一期）・單純收縮期高血壓 with a 6-month re-check date; every saved record shows the date with year; the `.ics` file downloads and opens in a calendar; the CSV opens in Excel with legible Traditional Chinese; the browser network tab shows no health readings leaving the device apart from the photo sent for reading; and no API key appears anywhere in the browser.

## OUT OF SCOPE
No accounts, login, or profiles. No cloud storage, sync, or sharing between devices. No medication, diet, or step tracking. No wearable integrations. No PDF reports. No English or Simplified Chinese interface. No push or email notifications. No AI diagnosis.

## HARD CONSTRAINTS
- Single-user and fully anonymous: no sign-in, no roles, no per-user records. Everything the app shows belongs to whoever holds the device.
- All health data lives only in this browser's local storage. Nothing is written to any server or database, and a visible clear-all action erases it.
- The AI credential is held server-side only, inside this app's own server layer (server functions on the managed AI gateway). The browser never receives or sees the key, and the server keeps nothing.
- Only two things may reach the server: the photo being read, and the grade labels needed to write the summary. Raw readings and dates never leave the device; age and gender are not collected.
- Grading is deterministic and comes from the bundled reference tables — never from AI. Where a chart does not cover the user, the app says 「無適用參考標準」 and still saves the raw number; it never extrapolates.
- The AI summary may use the bundled reference leaflet text and nothing else; anything outside it must be declined out loud, and a failed generation must show a real error rather than invented advice.
- Voice dictation uses the browser's own speech engine and only appears where Chinese recognition exists; no audio leaves the device.
- A per-device daily AI cap keeps free-tier usage in check, backed by a coarse server-side limit.
- Traditional Chinese throughout, including validation messages, grade labels and CSV headers.
- Every screen carries 「僅供參考，不能取代醫生診斷」 and the local-only data notice.
- Japanese-minimalist visual system: soft glassmorphism, muted earth tones, rounded corners, generous whitespace, and 50+ friendly type, contrast and touch targets.
