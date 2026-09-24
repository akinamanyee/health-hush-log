# CLAUDE.md — 健康紀錄簿 (Health Logbook)

## Project

TanStack Start v1 (React 19, Vite 7) health logbook. Tracks body composition, blood pressure,
grip strength, and sit-and-reach. All health data stays in `localStorage` — no database, no
accounts. Two server functions hold the AI credential server-side.

See: [PRD.md](PRD.md) (scope), [ARCHITECTURE.md](ARCHITECTURE.md) (how it's built),
[DECISIONS.md](DECISIONS.md) (why), [AGENTS.md](AGENTS.md) (working constitution).

## Commands

```bash
bun install        # install deps
bun run dev        # dev server
bun run build      # production build
bun run lint       # eslint
bun run format     # prettier
```

### Deploy to production (heartcaring.fit)

Run from Cloud Shell — Claude Code sessions have no `gcloud` credentials.

```bash
cd ~/health-hush-log
git fetch origin && git pull --ff-only origin cloud-run-prep   # else Cloud Run rebuilds stale local source
gcloud run deploy heartcaring-app --source . --region asia-east1 --allow-unauthenticated
```

- Service name is **`heartcaring-app`** — NOT `health-hush-log`. `heartcaring.fit` is domain-mapped to `heartcaring-app`; deploying under the wrong name creates a separate service that never reaches the domain.
- Region: `asia-east1`.
- Verify active revision: `gcloud run services describe heartcaring-app --region asia-east1 --format="value(status.traffic[].revisionName,status.traffic[].percent)"`
- Verify content: `curl -sL https://heartcaring.fit/ | grep -c "<expected-string>"`
- Rollback: `gcloud run services update-traffic heartcaring-app --to-revisions=<prev-rev>=100 --region asia-east1`
- Incident references: see CHANGELOG entries `2026-09-22 23:42` (wrong-service-name trap), `2026-09-23 17:01` (stale-Cloud-Shell trap) and `2026-09-24 15:15` (Cloud-Shell-auth trap — session-fresh Cloud Shell lost cached GitHub credentials, so `git pull` silently failed and the deploy shipped stale local `HEAD`; fix: `gh auth status` first, if not logged in `gh auth login` via device flow + `gh auth setup-git`, then `git pull --ff-only` and confirm `git rev-parse HEAD` matches expected commit before `gcloud run deploy`).

## Coding Principles

- No assumptions. Investigate first, base everything on facts.
- No shortcuts, no workarounds, no lazy patches. Fix the root cause.
- Fix properly, not narrowly. If the clean fix spans several files, that is the right fix.
- Simple means well-structured, not fewest-lines. Never add scope the task didn't ask for.
- If something errors, show the real error. Never fake success, never use mock data.
- Never trust AI output blindly. Use structured outputs, validate against schema, retry on mismatch.
- Think about the whole system — don't break existing features.
- Protect existing data. Schema changes must migrate, never drop-and-recreate.
- Maintain Single Source of Truth (SSOT). No duplicates, no parallel truths.
- The code and maintained docs (PRD.md, CHANGELOG.md, Product_Roadmap.md, plan/) are authoritative sources.

## Non-Negotiable Rules (from AGENTS.md)

- **Local-first is the product.** Health records live in the browser only. Never add a database, account system, or server-side storage of readings.
- **The AI never grades and never invents numbers.** Grading is deterministic via `gradeEntry()` in `src/lib/health/grade.ts`.
- **No extrapolation.** Where a chart cannot apply, say 「無適用參考標準」.
- **Review before save.** Photo/voice values are editable and confirmed by user before storing.
- **Credentials stay server-side.** AI calls in server functions only; browser never sees a key.
- **Traditional Chinese, 45+ friendly.** All user-facing copy is Traditional Chinese. Large type, generous targets, destructive actions separated.
- **Documentation is part of the change.** Update PRD, ARCHITECTURE, DECISIONS, CHANGELOG, Product_Roadmap in the same pass.

## Security

- Server-side enforcement for every gate, never client-only.
- Validate and sanitise all input server-side.
- Secrets live only in the platform's secret store — never in code or commits.

## Design

- Every UI must look intentionally crafted — deliberate typography, spacing, hierarchy, restraint.
- Must be responsive (phone and desktop).
- Reject generic AI-default look (stock gradients, lone centered cards, emoji headings).

## Git (Lovable sync)

- Connected to Lovable on `main` branch.
- Never force push, rebase, amend, or squash pushed commits — it breaks Lovable's history.
- Keep the branch in a working state at all times.
