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
| [CHANGELOG.md](CHANGELOG.md) | What changed, when, and why — newest first |

Build planning: [Product_Roadmap.md](Product_Roadmap.md) (the ordered milestones) and
[plan/](plan/) (one build plan per milestone).

## Development

```sh
bun install
bun run dev
```

The AI features need a server-side credential in the environment; the browser never sees it.

## Built with

TanStack Start · React · TypeScript · Tailwind CSS · AI SDK
