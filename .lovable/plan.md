# Investigation — 健康紀錄簿 (local-first health & fitness logbook)

## 0. State of the ground truth

`PRD.md` does not exist at the project root, and the codebase is an untouched TanStack Start template: `src/routes/index.tsx` is still the blank placeholder, there is no `src/routes/api/`, no Supabase integration folder, no AI packages installed, and no secrets wired. So the drafted Version 1 spec is the working spec, and **step one of the roadmap is to save the approved PRD as `PRD.md`** and treat it as the single source of truth from then on.

What the template already gives us and we should not re-invent: shadcn/Radix UI set, Tailwind v4 tokens in `src/styles.css`, `react-hook-form` + `zod`, `recharts` for trend charts, `sonner` for toasts, `date-fns`, TanStack Query, and a CSRF-protected server-function boundary in `src/start.ts`. Nothing new is needed for the UI layer.

## 1. The backend requirement does not survive contact with the platform

The spec asks for Edge Functions on an independent Supabase project holding a Google AI Studio key. Two facts: this project has no Supabase connection, and a Supabase project cannot be linked from here — only the user can do it in Project Settings → Connectors. Meanwhile the actual requirement behind that sentence is narrow: *the model call happens server-side and no key ever reaches the browser.*

Resolved: the AI proxy lives in this app's own server layer — a TanStack server function for image extraction and one for the grounded summary — calling a Gemini vision model through Lovable AI's managed gateway. The gateway credential is server-side only and never appears in client code, which satisfies the security requirement with strictly fewer moving parts than a second cloud project, and removes the free-tier quota and key-rotation burden entirely. No database is created; the functions are stateless and persist nothing. Health records still never leave the device except the single image the user chooses to have read.

## 2. Local-first, but SSR is on

Entries live in `localStorage` only. Reading it during render would hydration-mismatch, so all history reads happen after mount behind a hydration gate, with a skeleton on first paint. Storage shape: one versioned envelope (`{ v: 1, entries: {...} }`) per module, so a later field addition migrates instead of wiping. Quota is a non-issue for numeric rows; we never store uploaded images.

## 3. OCR is the highest-risk step, and it must never write silently

Tanita screen photos vary in glare, crop, and locale. Resolved: the extraction function returns a strict validated schema (weight, body fat %, muscle mass, BMI, visceral fat, each nullable), the UI drops the values into an editable review form, and **saving always requires the user to confirm**. Fields the model couldn't read come back empty and are typed in, never guessed. A failed call shows the real error in Chinese, never a fake success or placeholder numbers. Images are downscaled in the browser before upload (long edge ~1600px, JPEG) to stay well inside request limits.

## 4. Grading must be data, not code, and must admit when it doesn't know

All four graders are deterministic table lookups in versioned JSON data files, with the reference source named on screen next to every grade:

- **Blood pressure** — category tiers evaluated on systolic and diastolic independently, taking the worse of the two, which is exactly what makes isolated systolic hypertension (e.g. 152/78) fall out correctly rather than being averaged away.
- **Grip strength / sit-and-reach** — age-band × gender matrices. If a user's age falls outside the published bands, the app shows 「無適用參考標準」 and still saves the raw number. Inventing an extrapolated grade would be the one unacceptable failure mode here.

The AI is never allowed to grade. It reads pixels and speech into fields; the charts decide the tier.

## 5. Re-check scheduling

Tier → interval is a fixed table (normal → 2 years, elevated/high-normal → 1 year, hypertensive range → 6 months, crisis-level → 「即時就醫」 with no calendar entry, because scheduling a reminder for an emergency reading is wrong). The `.ics` file is generated in the browser from that date; the Google Calendar link is a plain template URL. No scheduler, no server, no notifications.

## 6. Voice input is capability-gated

Browser speech recognition covers Chinese well in Chromium but is absent in Firefox and unreliable in iOS Safari. Resolved: feature-detect and only render the microphone when the browser supports `zh-HK`/`zh-TW` recognition; elsewhere the field is simply typed. Dictation is parsed by a small number-extraction step, shown in the same review form as OCR, and confirmed before saving. No audio is uploaded or stored, so no transcription infrastructure appears.

## 7. Grounded advice, and the cost guard

The summary function receives the user's recent entries plus the bundled reference-leaflet text, and is instructed to answer only from that text and to decline anything outside it; output is validated against a small schema, and a non-conforming generation fails visibly instead of being faked. Every screen carries 「僅供參考，不能取代醫生診斷」.

Because a paid model sits behind a public, sign-in-free page, a daily per-device cap on AI calls is included (client-side counter for the honest path, plus a coarse per-request cap in the server function as a backstop). Without accounts this is best-effort by definition, and that is the right trade rather than adding auth the product doesn't want.

## 8. Details that would otherwise bite

- CSV export writes a UTF-8 BOM, or Excel mangles Traditional Chinese headers.
- Glassmorphism is applied to background and card surfaces only; text sits on solid-enough fills to hold contrast, since 50+ legibility outranks the effect. Base body text 18px, inputs and buttons at large touch sizes, numeric keypad hints on numeric fields.
- Interface is Traditional Chinese throughout, including validation messages, grade labels, calendar event titles, and CSV headers.
- A visible 「資料只存在此裝置」 notice plus a deliberate clear-all action, so local-only storage is understood rather than discovered when a browser is cleared.
- Trend charts per module use the already-installed `recharts`; no new charting dependency.

## 9. Recommended approach (committed)

One public, sign-in-free Traditional Chinese dashboard on this app's own stack. Four modules with a shared record-and-review flow (photo → AI extract, mic → dictate, or type; always user-confirmed). Deterministic chart-based grading from versioned JSON tables with an explicit "no applicable standard" state. Local-storage history with BOM'd CSV export and client-generated `.ics` / Google Calendar links. Two stateless server functions — image extraction and leaflet-grounded summary — calling a Gemini vision model through the managed gateway with the credential server-side, plus a daily per-device usage cap. No database, no accounts, no Supabase project, no health data ever transmitted except the image the user chooses to send.

**What I decided:** the AI runs through this app's own server functions on the managed gateway instead of a separate Supabase project with your Google AI Studio key (same "key never in the browser" guarantee, no second project to maintain), voice input only appears on browsers that actually support Chinese dictation, out-of-range ages show 「無適用參考標準」 rather than an extrapolated grade, crisis-level blood pressure gets an urgent-care message instead of a calendar reminder, and the AI-usage cap is best-effort per device because the app has no accounts.
