# M19 — 六屏分類: each Tanita screen, one section

The Tanita module (身體成份分析儀) replaces its single generic photo upload with six clearly
labelled sections matching the physical machine's six display screens. Each section has its
own camera/upload button and its own manual fields. Voice input is removed from Tanita only.
The AI extraction prompt is narrowed per screen for higher accuracy — the model reads fewer
fields from a photo of known content instead of guessing which of 21 fields might be visible.

Existing data in `localStorage` is untouched: same field keys, same storage envelope, same
`hlb:tanita` key. A record saved before M19 loads and displays normally.

## The six screens

The Tanita 身體組成分析儀 cycles through six display screens. Each screen corresponds to a
section in the new UI. The fields below use the existing keys from `modules.ts`.

| # | Screen label | Fields (existing keys) |
|---|---|---|
| 1 | 體脂率 | `bodyFat`, `fatMass`, `weight`, `fatTrunk`, `fatArmR`, `fatArmL`, `fatLegR`, `fatLegL` |
| 2 | 肌肉量 | `muscleMass`, `muscleRatio`, `weight`, `muscleTrunk`, `muscleArmR`, `muscleArmL`, `muscleLegR`, `muscleLegL` |
| 3 | 身體水分 | `bodyWaterPct`, `bodyWaterKg`, `weight` |
| 4 | 內臟脂肪 | `visceralFat`, `weight` |
| 5 | 基礎代謝率（BMR） | `bmrKcal`, `bmrKj`, `weight` |
| 6 | BMI | `bmi`, `weight` |

`weight` appears on every screen because the machine displays it on each. The field renders
once — in the first section where it appears — and shows as read-only in subsequent sections
with a "same as above" note. Its value is shared across sections so any photo that captures
weight fills the single `weight` field.

## Files to change

### 1. `src/lib/health/modules.ts`

Add a `screen` property to `FieldDef`:

```ts
export interface FieldDef {
  key: string; label: string; unit: string;
  min: number; max: number; step?: string;
  optional?: boolean; group?: string;
  screen?: string;  // NEW — Tanita screen label
}
```

Add a `screens` array to `ModuleDef` (optional, Tanita-only):

```ts
export interface ScreenDef {
  id: string;       // slug: "bodyFat", "muscle", "water", "visceral", "bmr", "bmi"
  label: string;    // Chinese: 體脂率, 肌肉量, …
  fields: string[]; // field keys belonging to this screen
}

export interface ModuleDef {
  // … existing …
  screens?: ScreenDef[];
}
```

Set `screen` on every Tanita field (matching the 6-screen table above). The existing `group`
property stays for backward-compat in CSV and summary — `screen` is the new UI driver.

Add the `screens` array to the Tanita module definition:

```ts
screens: [
  { id: "bodyFat",  label: "體脂率",          fields: ["bodyFat","fatMass","weight","fatTrunk","fatArmR","fatArmL","fatLegR","fatLegL"] },
  { id: "muscle",   label: "肌肉量",          fields: ["muscleMass","muscleRatio","weight","muscleTrunk","muscleArmR","muscleArmL","muscleLegR","muscleLegL"] },
  { id: "water",    label: "身體水分",        fields: ["bodyWaterPct","bodyWaterKg","weight"] },
  { id: "visceral", label: "內臟脂肪",        fields: ["visceralFat","weight"] },
  { id: "bmr",      label: "基礎代謝率（BMR）", fields: ["bmrKcal","bmrKj","weight"] },
  { id: "bmi",      label: "BMI",             fields: ["bmi","weight"] },
]
```

### 2. New component: `src/components/health/TanitaRecord.tsx`

A Tanita-specific record component that replaces the generic `RecordModule` for the Tanita
route. It reuses the same state shape (`values`, `errors`, `busy`, `date`) and the same
`submit()` / `remove()` / history / trend logic from `RecordModule`, but renders a different
form layout.

**Approach: extract shared logic into a hook, keep two renderers.**

Create `src/components/health/useRecordState.ts` — a custom hook that owns:
- `entries`, `save`, `hydrated` (from `useLocalData`)
- `date`, `values`, `errors`, `busy`, `selectedId` state
- `numeric`, `grades` derived values
- `onImage(dataUrl, screenId?)` — the server-call + merge logic
- `submit()`, `remove()`, `saved`, `savedTier`, `recheck`, `trend`

`RecordModule.tsx` becomes a thin renderer that calls `useRecordState(mod)` and renders
exactly as it does today (no behaviour change for bp / grip / sitreach).

`TanitaRecord.tsx` calls `useRecordState(mod)` and renders:

```
┌─────────────────────────────────────────────────┐
│ 身體成份分析儀                                    │
│ 日期: [────────]                                 │
│                                                  │
│ ┌─ 1. 體脂率 ───────────────────────────────┐    │
│ │ [📷 用相機拍攝]  [📤 上載照片]             │    │
│ │                                            │    │
│ │ 體脂率 ____%   體脂量 ____公斤             │    │
│ │ 體重   ____公斤                            │    │
│ │ ▸ 部位脂肪率 (collapsed)                   │    │
│ └────────────────────────────────────────────┘    │
│                                                  │
│ ┌─ 2. 肌肉量 ───────────────────────────────┐    │
│ │ [📷 用相機拍攝]  [📤 上載照片]             │    │
│ │                                            │    │
│ │ 肌肉量 ____公斤  肌肉比率 ____%            │    │
│ │ 體重   ____公斤 (read-only, from above)    │    │
│ │ ▸ 部位肌肉量 (collapsed)                   │    │
│ └────────────────────────────────────────────┘    │
│                                                  │
│ ┌─ 3. 身體水分 ─────────────────────────────┐    │
│ │ [📷 用相機拍攝]  [📤 上載照片]             │    │
│ │ 身體水分率 ____%   身體水分量 ____公斤      │    │
│ └────────────────────────────────────────────┘    │
│   … 4, 5, 6 …                                   │
│                                                  │
│ 已填 12 / 21 項                                  │
│ [     儲存紀錄     ]                             │
└─────────────────────────────────────────────────┘
```

Each section is a `glass-card` with:
- A numbered heading: `1. 體脂率`
- A compact `ImageDrop` (reuse the existing component as-is, one instance per section)
- Manual fields for that screen, in a 2-column grid
- `weight` rendered read-only (greyed, non-editable) in sections 2–6 if already filled
- Segmental fields (部位脂肪率 / 部位肌肉量) collapsed inside `<details>` as today

**No VoiceButton** anywhere in `TanitaRecord`. The `VoiceButton` import and `onVoice`
callback are removed from this component. Other modules keep voice as-is.

### 3. `src/lib/health/ai.functions.ts`

**New `screen` parameter** on `ExtractInput` (optional, Tanita-only):

```ts
const ExtractInput = z.object({
  image: z.string().startsWith("data:image/"),
  module: z.enum(["tanita", "bp", "grip", "sitreach"]),
  screen: z.string().optional(),  // e.g. "bodyFat", "muscle", …
});
```

**Per-screen extraction prompts and schemas.** When `data.screen` is provided and
`data.module === "tanita"`, use a screen-specific prompt and a narrower schema. This
is the core accuracy improvement — the AI reads 3–8 fields instead of 21.

```ts
const TANITA_SCREEN_FIELDS: Record<string, { prompt: string; keys: string[] }> = {
  bodyFat:  { prompt: "weight（體重 kg）、bodyFat（體脂率 %）、fatMass（體脂量 kg）、fatTrunk（軀幹脂肪率 %）、fatArmR（右臂脂肪率 %）、fatArmL（左臂脂肪率 %）、fatLegR（右腿脂肪率 %）、fatLegL（左腿脂肪率 %）", keys: ["weight","bodyFat","fatMass","fatTrunk","fatArmR","fatArmL","fatLegR","fatLegL"] },
  muscle:   { prompt: "weight（體重 kg）、muscleMass（肌肉量 kg）、muscleRatio（肌肉比率 %）、muscleTrunk（軀幹肌肉量 kg）、muscleArmR（右臂肌肉量 kg）、muscleArmL（左臂肌肉量 kg）、muscleLegR（右腿肌肉量 kg）、muscleLegL（左腿肌肉量 kg）", keys: ["weight","muscleMass","muscleRatio","muscleTrunk","muscleArmR","muscleArmL","muscleLegR","muscleLegL"] },
  water:    { prompt: "weight（體重 kg）、bodyWaterPct（身體水分率 %）、bodyWaterKg（身體水分量 kg）", keys: ["weight","bodyWaterPct","bodyWaterKg"] },
  visceral: { prompt: "weight（體重 kg）、visceralFat（內臟脂肪等級）", keys: ["weight","visceralFat"] },
  bmr:      { prompt: "weight（體重 kg）、bmrKcal（基礎代謝率 kcal）、bmrKj（基礎代謝率 kJ）", keys: ["weight","bmrKcal","bmrKj"] },
  bmi:      { prompt: "weight（體重 kg）、bmi（BMI）", keys: ["weight","bmi"] },
};
```

When `data.screen` is set, the handler:
1. Looks up `TANITA_SCREEN_FIELDS[data.screen]`
2. Uses the narrow `prompt` string instead of the full 21-field string
3. Builds a dynamic Zod schema from `keys` (all `z.number().nullable()`)
4. Parses the AI output against that schema
5. Returns only the keys for that screen (nulls for fields not visible)

The existing full-Tanita path (`data.screen` is absent) stays as a fallback — not wired in
the new UI but not deleted, so bp / grip / sitreach extraction is unaffected.

### 4. `src/components/health/useRecordState.ts` (new hook)

Extracts from `RecordModule.tsx`:

```ts
export function useRecordState(mod: ModuleDef) {
  // All existing state: entries, save, hydrated, date, values, errors, busy, selectedId
  // All derived: numeric, grades
  // onImage(dataUrl: string, screenId?: string) — passes screen to extractFromImage
  // onVoice(nums: number[])
  // submit(), remove(id)
  // saved, savedTier, recheck, trend
  return { /* all of the above */ };
}
```

The `onImage` function gains an optional `screenId` parameter:

```ts
const onImage = async (dataUrl: string, screenId?: string) => {
  // … existing cap check …
  const res = await extract({
    data: { image: dataUrl, module: mod.id, screen: screenId }
  });
  // … existing merge logic (only non-null values overwrite) …
};
```

### 5. `src/routes/tanita.tsx`

Switch from `RecordModule` to `TanitaRecord`:

```ts
import { TanitaRecord } from "@/components/health/TanitaRecord";
import { MODULE_BY_ID } from "@/lib/health/modules";

// …
component: () => <TanitaRecord mod={MODULE_BY_ID.tanita} />,
```

### 6. No changes to:

- **`store.ts`** — `Record<string, number>` accepts any keys. Same envelope `{ v: 1, data }`.
  Old records load fine.
- **`grade.ts`** — `gradeEntry()` only checks `bmi`, `bodyFat`, `visceralFat`. No new grades.
  `interpretCard()` unchanged.
- **`csv.ts`** — iterates `mod.fields` dynamically. New `screen` property is irrelevant to CSV.
  Column order is field-definition order, which is unchanged.
- **`calendar.ts`** — bp-only feature.
- **`charts.ts`** — no new grading tables or reference text needed.
- **`ImageDrop.tsx`** — reused as-is, one instance per section. No API change.
- **`VoiceButton.tsx`** — not imported in `TanitaRecord`. Still used by `RecordModule` for
  bp / grip / sitreach.
- **`dates.ts`**, **`voice.ts`** — untouched.
- **Other module routes** (`blood-pressure.tsx`, `grip.tsx`, `sit-and-reach.tsx`) — still use
  `RecordModule` with voice. No change.

## Build order

### Step 1: `useRecordState` hook

Extract shared logic from `RecordModule.tsx` into `useRecordState.ts`. Rewire `RecordModule`
to use the hook. **Verify: all four modules work identically after this refactor — no
behaviour change.**

### Step 2: `screen` on `FieldDef` and `screens` on Tanita `ModuleDef`

Add the `screen` property to all 21 Tanita fields in `modules.ts`. Add the `screens` array.
No UI change yet.

### Step 3: Per-screen AI extraction

Add `TANITA_SCREEN_FIELDS` and the `screen` parameter to `ai.functions.ts`. When `screen` is
provided, use the narrow prompt and schema. The full-Tanita fallback stays for when `screen`
is absent. **Verify: existing extraction still works (no `screen` ⇒ full 21-field prompt).**

### Step 4: `TanitaRecord` component

Build the new Tanita-specific renderer. Six sections, each with its own `ImageDrop`, its own
manual fields, and the `screen` id passed to `onImage`. Weight rendered read-only in sections
2–6. Segmental fields collapsed. No voice button. Progress counter across all 21 fields.

### Step 5: Wire the route

Switch `tanita.tsx` to import `TanitaRecord`. Update the `<meta>` description to mention the
six-screen layout.

### Step 6: End-to-end verification

- Photograph each of the 6 Tanita screens → each section fills its own fields
- Manual entry in each section → values merge into one record on save
- Weight entered in section 1 → appears read-only in sections 2–6
- A second photo in the same section → overwrites only non-null values
- Save with only screen 1 filled → record saves (all others optional)
- Old `hlb:tanita` records in history → display correctly with grades
- CSV export → all 21 columns present, old records show blanks for missing fields
- Health summary → `interpretCard()` / `gradeEntry()` still produce correct cards
- BP / grip / sitreach → unchanged, voice still works
- Mobile viewport → sections stack vertically, touch targets ≥48px

## PRD review

| PRD clause | Covered | How |
|---|---|---|
| USER JOURNEY 2 — four choices on dashboard | No change | Dashboard untouched |
| USER JOURNEY 3 — camera or upload a photo | Yes | Each section has camera + upload via `ImageDrop` |
| USER JOURNEY 3 — speak the numbers | Removed for Tanita | Voice made no sense when the user must identify which screen; other modules keep it |
| USER JOURNEY 4 — review and confirm in editable form | Yes | Same editable fields, same submit flow |
| USER JOURNEY 4 — grading against bundled charts | No change | `gradeEntry()` unchanged |
| USER JOURNEY 5 — saved record with date and grade | No change | History list and `GradeBadge` unchanged |
| HARD CONSTRAINTS — local-only storage | Yes | No server-side storage added |
| HARD CONSTRAINTS — AI credential server-side | Yes | `extractFromImage` server fn unchanged |
| HARD CONSTRAINTS — only the photo may reach the server | Yes | Each photo goes to `extractFromImage` with module + screen id only |
| HARD CONSTRAINTS — grading is deterministic | No change | `gradeEntry()` is the single grader |
| HARD CONSTRAINTS — Traditional Chinese, 50+ friendly | Yes | All labels in TC; numbered sections; large type; generous targets |
| HARD CONSTRAINTS — review before save | Yes | Same editable form before submit |
| OUT OF SCOPE — no accounts, login, profiles | Not violated | No new server state |

## Risk register

### Risk 1: Six `ImageDrop` instances on one page — camera conflicts

Each `ImageDrop` has its own `<input type="file" capture="environment">`. On mobile, only one
file picker opens at a time; there is no conflict. Each instance's `onImage` closure carries
its `screenId`, so the response merges into the correct fields. **No fix needed.**

### Risk 2: Weight duplication across sections

Weight appears on all 6 Tanita screens. In the data model there is one `weight` field. In the
UI, section 1 has the editable weight input; sections 2–6 display it read-only (greyed
`<input disabled>` or a `<span>`). When a photo is taken in section 3 and the AI returns
`weight`, it updates the single `weight` value — all sections reflect it. **Fix: the
`onImage` merge always writes to the shared `values` state; each section's read-only weight
re-renders via React state.**

### Risk 3: User skips some sections — partial records

A record is valid with just one required field (`weight`). All other Tanita fields are already
`optional: true`. The user can fill one section and save. This matches the current behaviour
and the PRD ("records a reading"). **No fix needed.**

### Risk 4: AI daily cap consumed per-section

Each per-section photo triggers one `extractFromImage` call and costs one AI usage count.
6 sections × 1 photo = 6 calls versus the current 1–6 calls for multi-photo. The daily cap
of 20 is unchanged. A user photographing all 6 screens uses 6/20 of their daily budget —
the same as M17's multi-photo flow. **No fix needed.**

### Risk 5: Per-screen AI prompt might not match the actual display

The Tanita machine's screen labels are fixed. The user picks the section that matches what
they see. If they upload a BMI screen photo into the 體脂率 section, the narrow prompt will
read the wrong fields. **Fix: the prompt includes the screen's Chinese label (e.g. "這是
身體組成分析儀「體脂率」畫面的照片") to help the AI validate; the fields are still nullable,
so mismatched values come back null and the user sees them empty. The toast says how many
fields were filled, prompting the user to try the correct section.**

### Risk 6: `RecordModule` refactor breaks other modules

Extracting `useRecordState` is a pure refactor. Build step 1 verifies all four modules
before any Tanita-specific work begins. TypeScript compilation catches any missed import or
signature change. **Fix: run the dev server and test each module after step 1.**

## Non-obvious calls

1. **Voice removed from Tanita only.** The PRD says "speak the numbers" as a general input
   method. For Tanita, voice is impractical: the user would need to dictate up to 21 numbers
   in a fixed order with no visual cue about which field is next. The per-screen design makes
   voice redundant — each section has 2–8 fields with photo or typed input. BP, grip and
   sitreach keep voice because they have 1–3 clearly ordered fields.

2. **`screen` parameter is optional on `ExtractInput`.** The existing full-Tanita extraction
   path stays as dead code rather than being removed. This avoids changing the API contract
   and keeps a fallback if a future feature needs full-photo extraction.

3. **`weight` editable only in section 1.** All 6 screens show weight, but entering it 6
   times is hostile. The first section owns the editable input; the rest show the value.
   A photo in any section that returns weight updates the shared value.
