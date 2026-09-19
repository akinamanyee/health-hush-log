<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Working constitution — 健康紀錄簿

Non-negotiable rules for any AI assistant or contributor working on this project.

1. **Local-first is the product.** Health records live in the browser only. Never add a database,
   an account, analytics, or server-side storage of readings. The only data allowed off the device
   is transient and user-initiated: a photo sent for one-off reading, and derived grade labels sent
   to write a summary. Neither is retained.
2. **The AI never grades and never invents numbers.** Grading is deterministic, from
   `src/lib/health/charts.ts` via the single grader `gradeEntry()`. Generated summaries are checked
   against the bundled leaflet and withheld if they fail — never shown ungrounded, never faked.
3. **No extrapolation.** Where a chart cannot apply, say 「無適用參考標準」 and still save the reading.
4. **Review before save.** Any value read from a photo or voice is editable and confirmed by the
   user before it is stored.
5. **Credentials stay server-side.** AI calls happen in server functions; the browser never sees a key.
6. **Traditional Chinese, 45+ friendly.** All user-facing copy is Traditional Chinese; errors are
   translated, type is large, targets are generous, destructive actions are separated.
7. **Documentation is part of the change.** PRD (intent), ARCHITECTURE (behaviour), DECISIONS + adr/
   (why), CHANGELOG (history), Product_Roadmap + plan/ (what and when) are updated in the same pass,
   with a real fetched Hong Kong timestamp — never a guessed one.
