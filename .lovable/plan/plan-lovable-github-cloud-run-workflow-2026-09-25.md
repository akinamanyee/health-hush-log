# Plan: Lovable → GitHub → Cloud Run workflow

## Recommendation

Keep building here in Lovable. The GitHub sync is two-way and already working
(`akinamanyee/health-hush-log`, `main`), so the natural flow is:

```text
Lovable (edit + preview) ──auto-sync──▶ GitHub main ──deploy──▶ Cloud Run
```

Why this way:
- Lovable gives you the live preview and this working session's context; changes
  push to GitHub automatically, no manual export.
- Claude/local edits pushed to GitHub also sync back into Lovable, so nothing
  diverges as long as nobody force-pushes or rebases public commits.
- Cloud Run just needs to build and run the repo — one Dockerfile is enough.

## What to verify / set up (one time)

1. **Container for Cloud Run** — this is a TanStack Start app; Cloud Run needs a
   Node container that runs `bun run build` (or `npm run build`) and serves the
   built server entry. Add a `Dockerfile` + `.dockerignore` at the repo root so
   Cloud Run (source deploy or Cloud Build trigger) can build it directly.
2. **Environment variable** — the AI features read `LOVABLE_API_KEY` server-side.
   On Cloud Run this must be set as a secret/env var, or photo-reading and the AI
   summary will fail there (everything else is local-first and works without it).
3. **Deploy trigger** — either a Cloud Build trigger on `main` pushes, or manual
   `gcloud run deploy --source .` after each update.

## Rules to keep the sync healthy

- Never force push, rebase, amend, or squash pushed commits on `main`.
- Keep `main` always in a working state (build passes before pushing).

## Scope of this plan

- Add `Dockerfile` and `.dockerignore` (multi-stage: install → build → run).
- Verify the production build runs under plain Node (the same way Cloud Run will).
- Document the deploy command and required env var in README.
- No changes to app features, UI, or data logic.
