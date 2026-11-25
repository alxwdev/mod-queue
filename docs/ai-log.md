# AI log

A record of the work that AI coding agents do in this repo: one entry per task, newest last.
The agent writes the entry before it reports. The owner fills in what the review changed.

## Entry format

```text
### <task ID> <task title> (<YYYY-MM-DD>)

- Agent: what the agent did.
- Review: what the owner's review changed, or "No changes".
- Deviations: differences from the plan and why, or "None".
```

## Entries

### 1.1 Repository bootstrap (2026-11-24)

- Agent: created `CLAUDE.md` (project summary, working rules, root commands, short conventions) and this log. Owner steps 1–2 were already done: the branch is `main` and `docs/plan/` is committed.
- Review: added `docs/plan/` to `.prettierignore`, because the plan files do not follow Prettier style and stay as written. The file is created here, ahead of task 1.2, which extends it.
- Deviations: the repo already has commits and a GitHub remote (`origin`, `main` is pushed). The plan expects no remote before task 2.3; task 2.3 starts from the existing repository.

### 1.2 Monorepo and tooling (2026-11-24)

- Agent: created the root `package.json` (scripts from `tooling.md` without `generate`, `postinstall`, `codegen`, `dev`), `pnpm-workspace.yaml`, `tsconfig.base.json`, the ESLint flat config, the Prettier config, `.editorconfig`, `.gitattributes`, `.nvmrc`, `.env.example`; extended `.gitignore` and `.prettierignore` (`pnpm-lock.yaml`). Checked every lint rule group with a throwaway probe outside the repo.
- Review: approved, no changes.
- Deviations: TypeScript 6.0.3, not 7.0.2 (`latest`), because `typescript-eslint` 8.74 supports only `<6.1.0`; the plan asks for 5.9+. The range is `~6.0.3`, so `pnpm update` cannot move it to an unsupported 6.1. ESLint 10.15 (ESLint 9 is marked unsupported on npm) with a `peerDependencyRules` entry in `pnpm-workspace.yaml`: `eslint-plugin-jsx-a11y` 6.10.2 declares ESLint ≤ 9, but its rules use only `context.options`, `context.report` and `context.settings`, which ESLint 10 keeps.

### 1.3 Next.js app scaffold (2026-11-24)

- Agent: generated the app with `create-next-app@16.4.6` (`--empty`, TypeScript, App Router, `src/`, Tailwind, no linter, no AGENTS.md) in a scratch folder and copied only the needed files into `apps/web`: package `@modqueue/web`, `tsconfig.json` that extends the base, `next.config.ts` as planned, the redirect from `/` and the four stub pages. Checked in a browser: `/` redirects (307) to `/queue`; each stub page shows its title and `<h1>`, without horizontal scroll at 320, 768 and 1280 px.
- Review: approved, no changes.
- Deviations: (1) `typecheck` is `next typegen && tsc --noEmit`, because on a clean checkout the global `LayoutProps` type and `next-env.d.ts` do not exist until Next generates them. (2) Tailwind runs through `@tailwindcss/postcss` and `postcss.config.mjs` (as in `structure.md`), not the template's `@tailwindcss/turbopack` loader; `@tailwindcss/postcss` is Tailwind's own PostCSS plugin. The template's `cacheComponents` and `partialPrefetching` are dropped: the plan's `next.config.ts` lists neither, and Cache Components changes how later tasks may read cookies. (3) `agentRules: false` in `next.config.ts` (owner's choice): otherwise `next dev` writes `apps/web/AGENTS.md` in every agent session. (4) Root `.gitignore` gets `apps/web/next-env.d.ts`: Next rewrites it on every dev, build and typegen run, and Prettier rejects its style. (5) `typescript ~6.0.3` and `@types/node ^24`, to match the root and Node 24, not the template's `^5` and `^20`. (6) Each stub page wraps its `<h1>` in `<main>`, so the axe check of task 2.2 finds a main landmark; task 4.4 must remove these `<main>` elements when `AppShell` adds `main#main`.

### 1.4 Local Postgres, Prisma schema, first migration, shared package (2026-11-24)

- Agent: created `docker-compose.yml` and `docker/postgres/init.sql`; the `@modqueue/api` package (Prisma 7.10.1, `prisma.config.ts`, the schema, migration `init`, `createPrismaClient` and `getPrisma`); the `@modqueue/shared` package with the constants; the root scripts `generate` and `postinstall`. Checked from an empty volume: `pnpm db:up && pnpm db:migrate` creates the 7 tables and the databases `modqueue_test` and `modqueue_e2e`. `pnpm install` creates the client while the database is stopped; `prisma generate` also runs without any database URL. Throwaway probes outside the repo checked `getPrisma()` against the database (one instance; a clear error without `DATABASE_URL`).
- Review: approved, no changes.
- Deviations: (1) The schema puts each enum value on its own line: Prisma rejects the one-line form `enum X { A B }` in `api.md`. Values and order are unchanged. (2) Prisma 7 does not read `.env` files. `prisma.config.ts` loads the root `.env` with Node's `process.loadEnvFile` when the file exists (owner's choice, no new dependency); the tsx scripts `db:seed` and `dev` use `--env-file-if-exists=../../.env`. Variables that are already set win over the file. Next.js reads `.env` files only from `apps/web/`, so the app does not see the root `.env`: task 2.5 must decide how `getPrisma()` gets `DATABASE_URL` locally. (3) `prisma`, `@prisma/client` and `@prisma/adapter-pg` are pinned to exactly 7.10.1, because they must match; the npm `latest` tag of `prisma` is 8.0.0-rc.35. (4) `ignoredBuiltDependencies` in `pnpm-workspace.yaml` for `@prisma/engines`, `prisma` and `esbuild`: none of their build scripts is needed, because the Prisma CLI downloads its schema engine on first use. (5) Postgres listens on `127.0.0.1:5432` only, because its password is public. (6) The plan does not word the labels: the agent wrote `REPORT_REASON_LABELS`, `CONTENT_TYPE_LABELS`, `MOD_ACTION_TYPE_LABELS` (past tense, for the mod log), `QUEUE_SORT_LABELS`, `QUEUE_AGE_LABELS`, plus one union type per array. (7) `db:reset` is `prisma migrate reset && pnpm db:seed`: Prisma 7's reset has no seed step, and without `--force` it asks before it deletes data.
