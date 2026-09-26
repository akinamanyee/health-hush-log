# M30 — Post-record 「返回健康紀錄簿」 + 「查看健康摘要」 bottom navigation

**Status:** approved 2026-09-26

## Goal

Every record page (`/blood-pressure`, `/grip`, `/sit-and-reach`, `/tanita`)
gains a bottom navigation with two links so the user's next step is
visible where their thumb naturally lands after saving:

- 「← 返回健康紀錄簿」 (`/logbook`)
- 「查看健康摘要 →」 (`/summary`)

Serves USER JOURNEY 5 (「can return directly to 「健康紀錄簿」 without
replaying the cover」) and 7 (path from record to summary) at the moment
the user actually is at the bottom of the record page, not only from
the top-of-page back-link.

## PRD alignment

| PRD | Check |
|---|---|
| L13 anonymous | ✓ No user model change |
| L47 local-only storage | ✓ No storage touched |
| L50 wire payload rules | ✓ No network |
| L51 grade rule | ✓ No grader change |
| L52 grounded AI advice | ✓ No AI text |
| L55 Traditional Chinese | ✓ 「返回健康紀錄簿」 + 「查看健康摘要」 |
| L56 disclaimer + local-only notice | ✓ `<PrivacyNotice>` footer preserved |
| L57 Japanese-minimalist visual system | ✓ Token-based colors, `text-lg` for 50+ readability, ≥48px touch target |
| USER JOURNEY 5 | ✓ Bottom link surfaces the promise where user's thumb sits |
| USER JOURNEY 7 | ✓ Summary path now explicit from record page |

## File changes

Two shared components cover all 4 record pages.

**`src/components/health/RecordModule.tsx`** (BP + grip + sit-reach)
- Import addition: `FileText` from `lucide-react` (existing imports include `ArrowLeft`)
- Insertion above `<footer>`: `<nav aria-label="下一步">` with two `<Link>`s

**`src/components/health/TanitaRecord.tsx`** (Tanita)
- Import addition: `FileText` from `lucide-react` (existing imports include `ArrowLeft`)
- Insertion above `<footer>`: identical `<nav>` block

**Nav shape (identical in both files):**
```tsx
<nav aria-label="下一步" className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 border-t border-border pt-6">
  <Link to="/logbook" className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <ArrowLeft className="size-5" aria-hidden="true" /> 返回健康紀錄簿
  </Link>
  <Link to="/summary" className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <FileText className="size-5" aria-hidden="true" /> 查看健康摘要
  </Link>
</nav>
```

## Design decisions

1. Two links (not one) — surface both USER JOURNEY 5 and 7 destinations at the natural post-save touchpoint.
2. Icons: `ArrowLeft` (echoes existing top-of-page back-link idiom) + `FileText` (matches summary-page icon idiom).
3. `<nav aria-label="下一步">` semantic landmark; screen readers announce it distinct from the top back-link.
4. `text-lg` + `py-3` — ≥48px touch target for 50+ readers.
5. Centred `flex flex-wrap` — wraps to 2 lines on iPhone SE (375px) if needed.
6. Top divider (`border-t pt-6`) separates from 歷史紀錄 without a heavy card border.
7. Not sticky — one-time bottom nav is enough after user scrolled through history.
8. Not gated on `saved` — appears always; even empty-state users benefit; below the fold on empty state so no clutter.
9. Left = back, right = forward — matches browser reading-order convention.

## Non-goals

- No sticky bottom bar
- No changes to top back-link (kept as-is)
- No changes to BP 「複查安排」 panel (complementary — task vs navigation)
- No changes to save flow / toast / form clearing / delete-entry
- No new state, no new hook, no new component extraction (2 call sites; promote to `<PostRecordNav>` only when a 3rd caller appears)
- No storage / schema / grounding / PRD change

## Risks + already-decided fixes

| Risk | Fix |
|---|---|
| Top + bottom back-links look redundant | Different affordances for different scroll positions; bottom nav uses `<nav>` landmark + divider + larger text, semantically and visually distinct |
| `<PrivacyNotice>` orphaned below new nav | PrivacyNotice reads as a legal footer beneath a nav — established web convention |
| BP 「複查安排」 competes with new nav | Complementary — 複查安排 is a task (calendar download), nav is page navigation |
| Duplicated JSX across 2 files | Accepted for 2 call sites; extract to shared component when a 3rd appears |
| Focus order | JSX order = DOM order = tab order; nav sits at bottom before footer, natural |
| Dark mode | Token-based classes (`muted-foreground`, `foreground`, `border`, `ring`) adapt automatically |
| Accessibility | `aria-label="下一步"` on `<nav>` + `aria-hidden="true"` on icons + `focus-visible:ring-*` for keyboard |

## No migration
- Storage envelope v1 unchanged
- No new persisted state
- No stored data touched

## Acceptance

1. `bunx tsc --noEmit` clean
2. `bun run build` clean
3. `/blood-pressure`, `/grip`, `/sit-and-reach`, `/tanita` — each renders the bottom nav above the privacy notice with the two links
4. Both links navigate client-side via TanStack Router (no page reload)
5. Both links have visible focus ring on keyboard Tab
6. Top-of-page 「← 返回健康紀錄簿」 still works; no visual regression
7. BP 「複查安排」 + `.ics` / Google Calendar buttons still work
8. 歷史紀錄 list, save flow, form clearing, toast, delete, `<PrivacyNotice>` — all unchanged
9. On iPhone SE width (375px), links sit side-by-side or wrap to two lines cleanly
10. Dark mode contrast holds
