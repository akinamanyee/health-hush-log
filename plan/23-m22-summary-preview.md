# M22 — 生成前的預覽 (Preview before generating the summary)

**Milestone value:** above the 「生成健康摘要」 button on `/summary`, show
exactly which modules will feed the summary (with each latest reading's date),
which are missing, and today's remaining AI budget — so users understand the
scope before spending an AI call. Closes the "which items are included" and
"am I about to burn a call" UX gaps from the earlier review.

## Traces

- PRD USER JOURNEY 7 (「reads a plain-language health summary」)
- PRD NORTHSTAR (trustworthy — know the scope before generating)
- PRD HARD CONSTRAINTS (Traditional Chinese, 50+ friendly, daily AI cap)

## Scope

One file: `src/routes/summary.tsx`. No new files, no new helpers.

### Client-side state
- `preview: PreviewItem[] | null` — one per module, null until hydrated.
  `PreviewItem = { moduleId, moduleTitle, hasEntry, latestDate?, cardCount, tanitaMetrics? }`.
- `usageToday: number | null` — null until hydrated.
- Both recomputed on mount + after each successful generate (via a
  `refreshTick` state bump, no `storage` event listener).

### Compute
- For each module in `MODULES`: `readEntries(mod.storageKey)`, take `[0]`,
  call `interpretCard(mod, latest.values, latest.date)`, count the returned
  cards. For Tanita, extract the returned card names → `tanitaMetrics`.
- `usageToday = getAiUsageToday()`.
- Both wrapped in `useEffect` — SSR-safe.

### Render (above generate button, inside existing glass-card)
- One-line snapshot rule: 「本摘要根據您每個項目的最新一次紀錄。未曾記錄的項目不會出現。」
- Three buckets, only rendered when non-empty:
  1. **本次將包含**：modules with `cardCount > 0`. Format:
     `血壓 · 2026年9月23日 記錄`. For Tanita: append
     `（含 BMI、內臟脂肪）`.
  2. **已紀錄但未含可評級指標（不會出現於摘要）**: modules with entry but
     `cardCount === 0` (Tanita weight-only). Comma-joined titles.
  3. **未曾記錄**：modules with no entry. Comma-joined titles.
- Cap gauge: 「今日 AI 生成剩餘 X / 20 次」.
- Gated on `preview != null` to avoid SSR flicker.

### Button behaviour
- `usageToday >= AI_DAILY_LIMIT` → disabled, text 「今日已達上限」.
- Bucket 1 empty → disabled, text 「尚未紀錄任何可摘要項目」.
- Otherwise → existing 「生成健康摘要」 / 「正在生成⋯」.
- Existing click-time toasts stay as belt-and-braces.

## Non-obvious calls (disclosed)

- **Module-level preview, not metric-level.** Tanita's 3 grade-able metrics
  collapse into one line with a 「含 …」 enumeration — they share one entry,
  one date, one source photo.
- **Compute via `interpretCard`, not entry-existence.** A Tanita entry can
  exist with 0 grade-able metrics (e.g., only weight). Preview honesty
  requires "will this actually produce a card?" — same code path as generate.
- **`mod.title`** (not `mod.label`) for module display name — verified in
  `modules.ts`, matches PRD USER JOURNEY 2 wording.
- **Recompute on mount + after generate. No `storage` event listener.**
  Cross-tab live sync deferred; user refreshes if they recorded elsewhere.
- **Cap gauge inside the preview block, not a separate widget.** Everything
  needed before deciding to generate sits together.
- **Button rewording over silent grey-out.** Tells a 50+ user WHY it's inert.
- **`refreshTick` bump vs. re-reading in render.** Reading localStorage in
  render is SSR-unsafe; the useEffect + state pattern is the app's standard.

## PRD / system reconciliation

- **PRD SSOT alignment.** No line prohibits a preview. Serves NORTHSTAR
  (trustworthy) and USER JOURNEY 7 (prep for reading a summary).
- **Duplicated state / parallel data.** None. Preview derived at
  mount + post-generate from existing sources.
- **Broken existing features.** None. Only the region above the button
  gains content; every rendered card, tip, agency credit, disclaimer,
  fallback message untouched.
- **Schema / table changes.** None. No migration.
- **Access model.** Nothing new leaves the device. AI prompt unchanged;
  wire payload unchanged (M20-fix whitelist intact).
- **HARD CONSTRAINTS** all preserved: Local-first · AI never grades · No
  extrapolation · Review before save (n/a) · Credentials server-side ·
  Only two things reach server · Dates never leave device · TC · Disclaimer ·
  Deterministic grading · Daily AI cap (now proactively surfaced) ·
  Japanese-minimalist visual system.

## Risks & mitigations

- **Preview goes stale if user records in another tab.** Recomputed on next
  mount / after next generate.
- **`readEntries × 4` + `interpretCard × N` on mount.** All synchronous,
  tiny — not a perf concern.
- **AI cap counter can be under-counted across tabs.** Server-side per-IP
  backstop is the real enforcement.
- **SSR safety.** Compute in `useEffect`; render gated on `preview != null`.
- **Existing zero-entry toast is now redundant.** Kept as belt-and-braces.

## Verification

1. `npx tsc --noEmit` clean.
2. `bun run build` clean.
3. Runtime: simulate 4-module state variations (only BP; all four; Tanita
   weight-only → cardCount 0; none) — confirm the 3-bucket split.
4. Post-deploy on phone: `/summary` → preview shows the correct state;
   generate → cards match what preview promised; hit cap → button shows
   「今日已達上限」.

## Living-docs impact on ship

- `CHANGELOG.md` — one dated entry.
- `Product_Roadmap.md` — M22 block appended below M21; status advanced.
- ADR — not required (display-only extension).
- `ARCHITECTURE.md` — no data-flow shift.
- `PRD.md` — no deviation.
