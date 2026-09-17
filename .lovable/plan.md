# Product Roadmap Update — 健康紀錄簿

What I decided: your seven requested changes become the next PRD update before this roadmap is saved, so the roadmap can stay traceable to the product intent.

## Status
M1–M8 remain delivered. The next sequence updates the first-screen experience, removes profile friction, improves dated records, refreshes labels, and prepares the app for your supplied cover image and icons.

## M9 — 封面入口: a calmer first impression
The app opens with a dedicated cover page using your supplied image, the product name, the local-only privacy promise, and the medical disclaimer. Value: users understand the app before entering their health logbook, without reading a settings page.

Traces: USER JOURNEY 1; HARD CONSTRAINTS (privacy notice, disclaimer); Visual Design System.

## M10 — 四項清楚選擇: pick the check you need immediately
After entering from the cover page, users see four large choices using the final wording: 血壓、身體成份分析儀、手握力、坐地前伸測試. Your supplied icons pair directly with those Chinese labels. Value: the main path becomes obvious for older users and matches the real-world test names.

Traces: USER JOURNEY 1–2; USER; Traditional Chinese throughout.

## M11 — 少一步記錄: no age or gender gate
Recording no longer starts with age and gender. Each module lets the user record the reading directly, and where a reference chart cannot grade without age or gender, the app saves the number and states 「無適用參考標準」 instead of asking for profile details. Value: faster recording with no unnecessary personal information collected.

Traces: OUT OF SCOPE (no profiles); HARD CONSTRAINTS (anonymous, no per-user records, no extrapolation outside charts).

## M12 — 日期清楚的紀錄簿: every saved reading shows its date and year
Each saved record clearly displays the full recording date including year. Value: users can trust when a measurement happened, especially when comparing older readings or exporting history.

Traces: USER JOURNEY 3–5; SUCCESS (CSV history); Data Portability.

## M13 — 相機或相簿: easier photo entry
Where photo reading is available, users can either take a photo with the device camera or upload an existing photo. The same review-before-save step remains in place. Value: the signature “photo to form” moment works naturally on phones and desktops.

Traces: USER JOURNEY 2–3; SUCCESS (screen photo read into form); HARD CONSTRAINTS (only the photo being read may reach the server).

## M14 — 私隱與資料使用更明確: trust stays visible
The cover page, module pages, and reporting area carry plain Traditional Chinese privacy and data-usage wording: health records stay on this device, photos are sent only for reading, summaries receive grade labels only, and the content cannot replace a doctor’s diagnosis. Value: users know exactly what happens to their data at the moment they use the app.

Traces: HARD CONSTRAINTS (local storage, server-only AI credential, allowed server data, disclaimer); NORTHSTAR.

## Updated sequence
```text
M1–M8  Delivered core logbook, grading, calendar, export, photo reading, voice, and summary
M9     Cover entrance with supplied image
M10    Four clearly named areas with supplied icons
M11    Direct recording without age/gender profile
M12    Full date/year visible on records
M13    Camera-or-upload photo entry
M14    Clear privacy and data-usage wording across the experience
```

## Notes for approval
- This roadmap does not add accounts, cloud storage, sharing, new health modules, medication tracking, wearable integrations, PDF reports, or diagnosis.
- The future implementation plan should first update the PRD to match this approved product direction, then apply the UI and behaviour changes.
