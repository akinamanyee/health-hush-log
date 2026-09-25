# 健康紀錄簿 — Health Logbook

A local-first, Traditional Chinese health logbook for adults 50+: enter through a calm cover page,
then record 血壓, 身體成份分析儀, 手握力 and 坐地前伸測試 readings by camera/uploaded photo, voice or typing; grade readings
against bundled reference charts where applicable; get the next re-check date; export everything as CSV.

Health data stays in the browser. There is no database and no account. The only things that
reach a server are the photo being read and the grade labels used to write the summary. Age and
gender are not collected.

## The living docs

These four are authoritative. This README is derivative and must never contradict them.

| Doc | Holds |
| --- | --- |
| [PRD.md](PRD.md) | What we're building and why it exists — intent |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the code is built: modules, data flow, key choices |
| [DECISIONS.md](DECISIONS.md) + [adr/](adr/) | Why each decision was made, and what was rejected |
| [CHANGELOG.md](CHANGELOG.md) | What changed, when, and why — newest first (older half moves to `changelog-archive.md` past ~100 entries) |
| [AGENTS.md](AGENTS.md) | How AI assistants must behave in this repo — the working constitution |

Build planning: [Product_Roadmap.md](Product_Roadmap.md) (the ordered milestones) and
[plan/](plan/) (one build plan per milestone).

## Development

```sh
bun install
bun run dev
```

The AI features need a server-side credential in the environment; the browser never sees it.

## Deploying to Cloud Run (self-hosting)

The repo includes a `Dockerfile` that builds the app as a plain Node server
(`NITRO_PRESET=node-server`, output in `.output/`). The default Lovable build is
untouched — it still targets Lovable hosting.

```sh
gcloud run deploy health-logbook --source . --region asia-east1 --allow-unauthenticated
```

Cloud Run injects `PORT` automatically; the server honours it. Set the
`LOVABLE_API_KEY` env var (Cloud Run → Edit & deploy → Variables & secrets) if you
want the photo-reading and AI summary features to work there — everything else is
local-first and runs without it.

Code flow: edit in Lovable (or anywhere) → push to GitHub `main` → deploy to
Cloud Run. Never force-push or rebase `main`; it breaks the Lovable sync.

## Built with

TanStack Start · React · TypeScript · Tailwind CSS · AI SDK
