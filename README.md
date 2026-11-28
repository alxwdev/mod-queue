# ModQueue

A keyboard-first console for community moderators: work through 10,000+ reported posts and comments with one key per decision.

**Live demo:** https://mod-queue.vercel.app (synthetic data, reset every day at 05:00 UTC)

**Work in progress.** The app is built task by task from the plan in [`docs/plan/`](docs/plan/README.md). All data is synthetic.

## Local setup

You need Node.js 24, pnpm 10 (through Corepack) and Docker.

```sh
corepack enable
pnpm install
cp .env.example .env
pnpm db:up        # Postgres 17 in Docker
pnpm db:migrate   # apply the migrations
pnpm db:seed      # deterministic demo data
pnpm dev
```

Then open http://localhost:3000.
