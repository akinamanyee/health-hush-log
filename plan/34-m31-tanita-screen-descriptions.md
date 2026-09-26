# M31 — Tanita 6-屏加解釋文字（用家指引）

**Status:** approved 2026-09-26

## Goal

Every one of the Tanita module's 6 screens (體脂率, 肌肉量, 身體水分,
內臟脂肪, 基礎代謝率, BMI) gains a short 繁中 description under its
numbered heading so users know what each screen measures before filling
in the reading. Fills the info gap that grip / sit-reach already close
via their module-level `infoText` popover; Tanita has 6 screens so each
gets its own inline text.

## What we build

Descriptions live on `ScreenDef` (`modules.ts`); TanitaRecord renders
them under `<h2>{idx + 1}. {screen.label}</h2>` before the photo-drop.

| screen.id | screen.label | description |
|---|---|---|
| bodyFat | 體脂率 | 脂肪佔體重的百分比。適度脂肪能保護身體，但過高會增加心血管疾病、糖尿病等風險。 |
| muscle | 肌肉量 | 包含全身肌肉及其中水分。增加肌肉能提升基礎代謝率，增加熱量消耗並幫助減脂。 |
| water | 身體水分 | 水分佔體重的百分比，與體脂肪呈反比。受日常作息影響波動，需長期觀察以維持機能正常運作。 |
| visceral | 內臟脂肪 | 腹腔器官周圍的脂肪，隨年齡易堆積。保持健康數值能有效降低心血管疾病與糖尿病風險。 |
| bmr | 基礎代謝率（BMR） | 維持靜息狀態生理運作（如心跳、呼吸）的最低熱量。肌肉量越高，BMR 越高，越易消耗熱量。 |
| bmi | BMI | 身高與體重的標準化比例，是最常見的基礎健康評估指標。 |

## Non-goals

- No AI grounding change — text stays UI-only, does not enter
  `REFERENCE_LEAFLET` or `TIPS_REFERENCE`
- No storage schema bump
- No grading logic change
- No changes to grip / sit-reach / BP or their `infoText` mechanism
- No new ADR

## PRD alignment

| PRD | Check |
|---|---|
| L13 anonymous | ✓ No user model |
| L47 local-only | ✓ No storage |
| L50 wire payload | ✓ UI-only |
| L51 grading rule + Exception | ✓ No grader change |
| L52 grounded AI advice | ✓ Text does NOT enter leaflet/tips |
| L55 Traditional Chinese, 50+ friendly | ✓ Approved 繁中 short paragraphs |
| L56 disclaimer + local-only notice | ✓ Chrome preserved |
| L57 Japanese-minimalist visual | ✓ Existing token-based classes |
| USER JOURNEY 3 | ✓ User understands what they're recording |
| ADR 0019 government-source grounding | ✓ No new grounding source |
| ADR 0024 sensitive-word filter | ✓ Zero 男士/女士/長者/學生 in any of the 6 texts |
| ADR 0025 numbers-in-JSX-only | ✓ Zero digits in all 6 texts after visceral amendment |

## File changes

- `src/lib/health/modules.ts` — `ScreenDef` interface gains `description?: string`; add description to each of the 6 tanita screens.
- `src/components/health/TanitaRecord.tsx` — after `<h2>{idx + 1}. {screen.label}</h2>`, add `{screen.description && <p className="mt-1 text-base leading-relaxed text-muted-foreground">{screen.description}</p>}`.
- `plan/34-m31-tanita-screen-descriptions.md` — this file.
- `Product_Roadmap.md` — M31 entry.
- `CHANGELOG.md` — M31 delivery entry.

## Design decisions

1. Home = `ScreenDef.description` on the same object as `label` and `fields` (SSOT co-located).
2. Per-screen, not per-field — matches how the Tanita device groups them.
3. Text is UI-only — never enters AI prompt; grounding scope preserved per ADR 0025.
4. Rendering token `text-base leading-relaxed text-muted-foreground mt-1` — matches page's subtitle idiom, 50+ friendly leading.
5. No popover — 6 screens need inline text; a single top-of-page popover would not scale.
6. `description?: string` optional — non-breaking for any future ScreenDef consumer.

## Risks + fixes

| Risk | Fix |
|---|---|
| Page grows vertically | Acceptable; each screen already has ImageDrop + inputs; descriptions add ~30-40 chars of muted copy |
| Sensitive-word audit | Manually verified — zero hits in all 6 texts |
| Numbers audit (ADR 0025) | Zero digits in all 6 texts (visceral 「1-59」 removed per amendment) |
| Per-screen photo extraction (M19) impact | `ScreenDef.fields[]` unchanged; extraction prompt reads only `fields[]`, never `description`. Zero impact. |
| Migration | None — text baked into build; no user data touched |

## No storage / schema / wire / grounding / PRD change
Envelope v1 unchanged. `REFERENCE_LEAFLET` and `TIPS_REFERENCE` byte-identical. `allowedNumbers` byte-identical. `SENSITIVE_LABEL_PATTERN` untriggered.

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/tanita` on phone: each of 6 screens shows a description `<p>` under its heading, above the photo-drop
4. Muted colour, `text-base` size, comfortable leading
5. Other 3 record pages (BP / grip / sit-reach) unchanged
6. Dark mode contrast holds
