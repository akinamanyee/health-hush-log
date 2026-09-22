# ADR 0022 — Tanita six-screen sections with per-screen photo extraction

**Date:** 2026-09-22  
**Status:** Accepted

## Context

The Tanita body composition analyser displays readings across six physical screens
(體脂率, 肌肉量, 身體水分, 內臟脂肪, 基礎代謝率, BMI). M17 added all 21 fields but
used a single form and a single AI prompt that asked for all 21 values from one photo.
This was impractical: no single photo shows all 21 fields, and the 21-field prompt
produced lower extraction accuracy than needed.

## Decision

Restructure the Tanita module into six labelled sections matching the physical screens,
each with its own camera/upload button and a narrowed AI extraction prompt (3–8 fields
instead of 21). Extract shared record state into a `useRecordState` hook consumed by
both the new `TanitaRecord` component and the existing `RecordModule`.

Remove voice input from Tanita only (other modules keep it). Voice dictation for 21
fields across 6 screens is impractical; per-screen photo extraction replaces it as the
fast-entry path.

`ScreenDef.fields` in `modules.ts` is the single source of truth for which fields belong
to which screen. AI extraction in `ai.functions.ts` derives its Zod schema keys and
screen-hint labels from this SSOT, keeping only the AI-specific prompt text locally.

## Options rejected

1. **Keep one form, add a screen selector for photo extraction only** — simpler code but
   the UI wouldn't match the physical device, and users wouldn't know which screen to
   photograph.
2. **Keep voice input on Tanita** — speaking 21 field values across 6 sections is slower
   than photographing each screen. Voice stays available on bp/grip/sitreach where there
   are 1–3 fields.
3. **Store field-to-screen mapping on each `FieldDef`** — tried initially (`screen`
   property on `FieldDef`), but this duplicated the mapping that `ScreenDef.fields`
   already provides. Removed as dead data in the SSOT cleanup.

## Consequences

- Tanita page renders 6 glass-card sections instead of one form; weight is editable only
  in section 1 and read-only in sections 2–6.
- AI extraction accuracy should improve: narrower prompts with screen-context hints.
- PRD line 34 says "speak the numbers" — Tanita no longer offers this. Documented as an
  intentional deviation; the PRD stays unchanged (it is the SSOT for intent).
- All 6 `ImageDrop` instances share one `busy` flag (prevents concurrent extractions,
  cosmetically shows loading on all sections).
