# M46 — Open Graph preview card for share links

**Status:** approved 2026-10-02

## Goal

When someone shares a `https://heartcaring.fit/...` link in WhatsApp,
Facebook, Line, Twitter, iMessage, or any OG-aware preview surface,
the recipient sees: 護心 logo thumbnail + site name 「健康紀錄簿」 +
繁中 title + the one-liner describing the app + the URL.

## Fix

**A. Static asset** — `public/images/og-cover.jpg` (1254×1254, 185KB)
copied from the attached logo. Served by Vite's static handler at
`https://heartcaring.fit/images/og-cover.jpg`.

**B. Root route head** — `src/routes/__root.tsx` meta array appended
with 9 new entries after `og:type`:
- `og:url` → `https://heartcaring.fit/`
- `og:site_name` → `健康紀錄簿`
- `og:locale` → `zh_HK`
- `og:image` → absolute URL to logo
- `og:image:width/:height` → `1254` / `1254`
- `og:image:alt` → `護心 — 健康紀錄簿標誌`
- `twitter:image` → absolute URL to logo
- `twitter:image:alt` → `護心 — 健康紀錄簿標誌`

Pre-existing `og:title` / `og:description` / `og:type` /
`twitter:card="summary_large_image"` unchanged.

**C. Per-route `og:url`** — four module routes get one new entry each:
- `/blood-pressure` → `https://heartcaring.fit/blood-pressure`
- `/grip` → `https://heartcaring.fit/grip`
- `/sit-and-reach` → `https://heartcaring.fit/sit-and-reach`
- `/tanita` → `https://heartcaring.fit/tanita`

Root's `og:image` / `og:site_name` / `og:locale` / `twitter:image` /
`twitter:card` inherit automatically via TanStack Start's property-keyed
meta merge; per-route `og:title` / `og:description` already override root.

**D. One-line description** — reuses existing root copy, no change:
「本地優先的健康紀錄簿：記錄血壓、身體成份分析儀、手握力與坐地前伸測試
讀數，資料只存在您的裝置上。」 繁中, under 100 characters, already
privacy-forward.

## PRD alignment

| PRD | Verdict |
|---|---|
| L13/L47 anonymous | ✓ static metadata; no tracking |
| L48 local-only | ✓ advertises app, not any user's data |
| L50 wire | ✓ no new server call |
| L52 grounded AI | ✓ AI untouched |
| L55 繁中 | ✓ including `og:locale = zh_HK` |
| L57 Japanese-minimalist | ✓ user-supplied brand mark |
| OUT OF SCOPE | ✓ no analytics / tracking / sync introduced |

## Risks + fixes

| Risk | Fix |
|---|---|
| WhatsApp caches scrapes aggressively | Facebook Sharing Debugger forces re-scrape; no code change needed to recover. |
| Image URL must be absolute | Decided — all three image URL entries use fully qualified `https://heartcaring.fit/images/og-cover.jpg`. |
| Square 1254×1254 vs recommended 1200×630 | Accepted — card accepts both; square gets letterbox side-padding but logo intact. |
| `og:locale = zh_HK` not universally recognised | FB accepts; others ignore gracefully. |
| `/summary` and `/logbook` shared externally | Fall back to root canonical; preview still coherent. Not worth per-route edits. |

## Verification

- `bunx tsc --noEmit` clean ✓
- `bun run build` clean ✓

## Files touched

1. **New:** `public/images/og-cover.jpg` (185KB).
2. `src/routes/__root.tsx` — 9 meta entries appended.
3. `src/routes/blood-pressure.tsx` — `og:url` added.
4. `src/routes/grip.tsx` — `og:url` added.
5. `src/routes/sit-and-reach.tsx` — `og:url` added.
6. `src/routes/tanita.tsx` — `og:url` added.
7. `plan/50-m46-open-graph-preview-card.md` (this)
8. `Product_Roadmap.md`
9. `CHANGELOG.md`

## Non-goals

- No composed 1200×630 preview — user attached the logo, ship the logo.
- No favicon.ico replacement.
- No Apple touch icon, no PWA manifest changes.
- No analytics / tracking pixels of any kind.
- No new ADR — OG tags are static meta, not a new principle.

## Acceptance

1. `tsc` + `build` clean ✓.
2. Facebook Sharing Debugger on deployed URL returns 護心 logo as og:image. **[Awaits deploy.]**
3. WhatsApp link preview on deployed URL shows logo + site name + description. **[Awaits deploy + manual test.]**
4. Each module page URL shows logo + per-page title + its own canonical. **[Awaits deploy + manual test.]**
