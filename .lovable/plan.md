# Reconciliation: PRD vs. code — findings and the fix

## The blocking finding first

**`PRD.md` does not exist at the project root.** I checked: the root holds `Product_Roadmap.md`, `README.md`, `AGENTS.md` — no PRD. The Version 1 PRD was drafted into `.lovable/plan.md` and never saved as `PRD.md`; that draft file was later overwritten by the roadmap, and the only archive (`.lovable/plan/product-roadmap-健康紀錄簿-2026-09-16.md`) contains the roadmap, not the PRD.

So the document you asked me to re-read section by section is gone, and I will not pretend otherwise. What survives is the eight-section Version 1 content recorded in the chat transcript (NORTHSTAR, USER, PROBLEM, JOURNEY, SUCCESS, OUT OF SCOPE, HARD CONSTRAINTS, WHAT I DECIDED) — recoverable in substance, not verbatim. Everything below is reconciled against that recovered content plus `Product_Roadmap.md`, and is **provisional until `PRD.md` is restored as the SSOT**.

## Per-item reconciliation

| PRD item (recovered) | Implementing file | Verdict |
|---|---|---|
| Four modules on a dashboard | `src/routes/index.tsx`, `src/lib/health/modules.ts` | Honored — four cards, TC labels, correct paths |
| BP graded against charts, isolated systolic surfaced | `charts.ts` `gradeBloodPressure` + `isIsolatedSystolic`; shown in `RecordModule.tsx` | Honored — systolic/diastolic scored independently, worse of two wins; 152/78 → 高血壓（第一期）・單純收縮期高血壓 |
| Grip / sit-and-reach graded on age+gender matrix | `charts.ts` `GRIP_NORMS`, `SIT_REACH_NORMS`, `gradeAgainstNorms` | Honored; out-of-band age returns 「無適用參考標準」 |
| **Tanita graded against reference charts** | none | **Missing** — Tanita captures weight/體脂率/肌肉量/BMI/內臟脂肪 but assigns no grade at all. The PRD grades all four modules |
| Re-check date by tier, 6m/1y/2y, crisis → 即時就醫 | `calendar.ts`, `RecordModule.tsx` | Honored — 24/12/6 months, crisis shows urgent-care text and no calendar entry |
| Downloadable `.ics` + Google Calendar link | `calendar.ts` `downloadIcs`, `googleCalendarUrl` | Honored, client-side only |
| Drag-drop image → AI extraction → editable review before save | `ImageDrop.tsx`, `ai.functions.ts` `extractFromImage`, `RecordModule.onImage` | Honored — downscaled client-side, strict nullable schema, values land in the form, save always needs the button, honest TC errors |
| Microphone dictation | `VoiceButton.tsx` | Honored, capability-gated. **Weak spot:** spoken numbers are assigned to fields *in spoken order*, so on Tanita's five fields a mis-ordered utterance silently mis-fills. Review form catches it, but it invites wrong data |
| Manual text fallback with validation | `RecordModule.tsx` | Honored — min/max per field, TC messages |
| Local history + trend | `store.ts` `useLocalData` (versioned envelope, hydration gate), recharts in `RecordModule` | Honored |
| One-click CSV to Excel | `csv.ts` | Honored — UTF-8 BOM, TC headers. Divergence: exports raw values only, **no grade column**; no CSV field quoting (safe today, fragile if a label or note ever contains a comma) |
| Grounded AI summary, leaflet-only, fails visibly | `ai.functions.ts` `generateHealthSummary`, `charts.ts` `REFERENCE_LEAFLET`, `routes/summary.tsx` | Honored on grounding — leaflet is the sole source, out-of-scope must be declared, empty output throws |
| Disclaimer 「僅供參考，不能取代醫生診斷」 on every screen | `index.tsx` footer, `summary.tsx` | **Diverges** — the four module pages (`/tanita`, `/blood-pressure`, `/grip`, `/sit-and-reach`) show it nowhere; only a save toast mentions local storage |
| 「資料只存在此裝置」 privacy notice standing | `index.tsx` header + footer | Partial — same gap: absent on all four module pages |
| Japanese-minimalist glass / earth tones / 50+ | `styles.css`, all routes | Honored — 18px base, min-h-14 targets, glass on surfaces |
| No accounts, anonymous, local-only | no auth code, no DB | Honored |
| **Key server-side, browser never sees it** | `ai-gateway.server.ts` + two server fns | Honored in guarantee. Diverges from PRD-as-written, which names *Supabase Edge Functions holding your Google AI Studio key* — this app uses its own server layer on the managed AI gateway. Disclosed earlier and approved in practice, but the PRD text still says Supabase |
| **SUCCESS: DevTools show no health data leaving the device except the image** | `summary.tsx` → `generateHealthSummary` | **Breaks the stated demo** — the summary posts every reading, grade, age and gender to the server. Nothing is stored, but the network tab shows health data |
| Daily AI cap per device | `store.ts` (20/day), `ai-gateway.server.ts` (200/IP) | Honored. Bug: `bumpAiUsage()` fires *before* the call, so a failed extraction still burns quota |

## SSOT and safety

- **Not in the PRD:** blood-pressure photo OCR (`modules.ts` sets `supportsImage: true` for `bp`) — the PRD scopes image extraction to Tanita. Small, useful, but it is added scope.
- **More than one authoritative home:** yes, three. `store.ts` `readEnvelope` is the real reader, but `csv.ts` and `summary.tsx` each re-parse `localStorage` inline and **skip the `v === 1` envelope check** — a future migration would silently mis-read there.
- **Duplicated logic:** grading is implemented twice — `gradeLabel()` in `RecordModule.tsx` and an inline copy in `summary.tsx`. They can drift apart.
- **Unbuilt PRD sections:** Tanita grading (above). Everything else has an implementation.
- **Access model:** the PRD's model is single-user, anonymous, no roles, no server-stored data — the code matches exactly: no auth, no DB, no user records, nothing persisted server-side. The two server functions are the only endpoints and are rate-limited but public, which is what an account-free app permits. No over-protection, no under-protection. Full system pass stays with TRANSMIT.
- **Data / schema:** there is **no database and no Supabase project connected** — nothing to show as SQL. The entire schema is browser `localStorage` under `hlb:` keys: `hlb:profile` `{age, gender}`, and `hlb:tanita` / `hlb:bp` / `hlb:grip` / `hlb:sitreach` each `{v:1, data: HealthEntry[]}` with `HealthEntry {id, date, values, note?, createdAt}`, plus `hlb:ai-usage` `{day, count}`. No orphaned keys; `clearAllHealthData` covers every key. No destructive change occurred — the envelope version is still 1 and no key was renamed, so existing entries are intact.
- Build is currently green (`build OK`, 14:42Z).

## Ranked against the NORTHSTAR and the SUCCESS moment

NORTHSTAR: clinic-trustworthy numbers with no medical data leaving the device. SUCCESS: Tanita photo read, 152/78 graded isolated systolic with a 6-month re-check, `.ics` downloads, CSV opens in Excel, **no health data in the network tab except the image**, no key in the browser.

**Fix now — the northstar or the demo needs it**
1. **Restore `PRD.md`** as Version 1 at the project root from the recovered eight sections (final form keeps NORTHSTAR, drops WHAT I DECIDED), with the Supabase-function line rewritten to the server-side reality this app ships. Without this there is no SSOT and every future review is guesswork.
2. **Health summary must stop posting readings.** Keep grounding server-side but send no raw values: compose the summary from tier/grade labels the client already computes, and send only those labels — no numbers, no dates, no age. This is the one item that breaks the SUCCESS demo outright.
3. **Disclaimer + 「資料只存在此裝置」 on all four module pages** — a standing footer in the shared `RecordModule`, not a toast. HARD CONSTRAINT, and the trust the northstar rests on.
4. **Tanita grading** — grade 體脂率 / 內臟脂肪 / BMI against the bundled leaflet ranges so all four modules answer "is this normal for me". Without it one of the four cards is a notebook, not a logbook that grades.
5. **Single reader, single grader** — route `csv.ts` and `summary.tsx` through `store.ts`'s versioned reader and one shared grading function. Removes the parallel truths before they drift.
6. **Don't burn AI quota on failures** — bump the counter after a successful call.

**Noted, not blocking**
- BP photo OCR is scope the PRD doesn't name — keep it, record it in the PRD on the next version rather than deleting a working feature.
- CSV has no grade column and no field quoting.
- Voice fills fields in spoken order; the review form is the safety net.
- Grip/sit-and-reach bands start at age 50, so a 45-year-old sees 「無適用參考標準」 — correct behaviour, worth stating in the PRD.

What I decided: I am restoring `PRD.md` from the transcript rather than asking you to re-supply it, and its Secure-Backend line will describe this app's own server layer instead of the Supabase Edge Function the original text named — the guarantee you asked for (key never in the browser, no cloud database) is what the code actually delivers.
