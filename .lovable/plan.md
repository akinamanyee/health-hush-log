# PRD — 健康紀錄簿 (Health Logbook) — Version 1

**NORTHSTAR**
Make self-tracked health numbers as trustworthy and readable as a clinic report, without a single byte of medical data leaving the user's own device.

**USER**
Traditional-Chinese-reading adults aged 50+ in Hong Kong/Taiwan who own a Tanita scale, a home blood-pressure monitor, and attend regular fitness checks, and who keep their readings themselves rather than in any clinic system.

**PROBLEM**
Their weight, blood-pressure, grip-strength and flexibility readings sit scattered in paper notes and photos, so nobody can tell whether a number is normal for their age or when the next check is due.

**USER JOURNEY**
1. (User) Opens the dashboard on phone or laptop and picks one of four cards: 體脂 (Tanita)、血壓、握力、坐位體前彎.
2. (User) Records a reading three ways in the same form — drops a photo of the Tanita/monitor screen for AI extraction, taps the microphone and dictates the numbers, or types them in — then reviews the extracted fields before saving.
3. (App) Grades the saved reading against the built-in official reference charts (blood-pressure tiers including isolated systolic hypertension; age- and gender-matched grip and sit-and-reach matrices) and shows the tier in plain Chinese.
4. (User) Accepts the auto-calculated blood-pressure re-check date for that tier and downloads the .ics file or opens the Google Calendar link.
5. (User) Reads the AI health summary drawn only from the built-in reference leaflets, then exports the full history as CSV — all entries stored only in this browser.

**SUCCESS**
In today's demo: a Tanita photo is dropped in, the AI fills weight/body-fat/muscle/BMI/visceral fat, a blood-pressure reading of 152/78 is graded as isolated systolic hypertension with a 6-month re-check, the .ics downloads with that date, and the CSV export opens in Excel with every entry — with DevTools showing no health data in any network request except the image sent to the server-side AI function, and no API key in the browser.

**OUT OF SCOPE**
No accounts, login, or cloud storage of health records. No sync across devices, no sharing with doctors or family, no medication/diet/step tracking, no wearable or device integrations, no PDF report, no English or Simplified Chinese interface, no notification push (calendar file only).

**HARD CONSTRAINTS**
- Single-user, anonymous, no sign-in: everyone who opens the app is the same public visitor; there are no roles, no admin, and no second actor.
- All health entries live only in this browser's local storage. No health record is ever written to a database. Clearing the browser deletes the data — stated in the UI.
- Server-side functions on the project's own Supabase project hold the Google AI Studio key; the browser calls those functions and never sees the key. The functions take an image or text in and return structured JSON out; they persist nothing.
- The AI advice section is grounded: the summary is generated only from the reference leaflets bundled with the app, and refuses/declines anything outside them. It is informational, never diagnosis, and every screen carries that notice.
- Grading is deterministic app logic from the built-in charts, never AI-authored. AI is used only for reading images/voice into fields.
- Voice dictation uses the browser's own speech recognition; no audio is uploaded or stored.
- A per-device daily cap on AI extraction calls (image + voice), enforced in the server function, with a plain-Chinese message when reached.
- Traditional Chinese interface throughout, 50+ friendly: minimum 18px body text, large touch targets, high-contrast muted earth tones over soft glassmorphism, generous whitespace, rounded corners.

**WHAT I DECIDED**
I made the app fully anonymous with no login (local-first leaves nothing to protect with an account), kept grading in deterministic code and AI only for reading photos and speech, used the browser's own speech engine so no audio leaves the device, added a per-device daily AI cap because the free-tier key is shared, chose Traditional Chinese only, dropped PDF reporting in favour of CSV plus .ics, and set the demo's proof numbers (152/78, 6-month re-check) myself.
