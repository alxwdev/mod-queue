# Day 1: Foundation

**Goal:** an empty but complete workspace: repo rules, tooling, database, Jest for the packages and seed data.
**Complexity:** Medium · **Must:** 6.5 h · **Branch:** `main` (direct commits, there is no remote yet)
**Demo:** `pnpm db:seed` prints 10,500 visible pending items and 2,000 scheduled items; `pnpm check` is green.
**Read first:** [conventions.md](conventions.md), [tooling.md](tooling.md), [structure.md](structure.md), [api.md](api.md) ("Data model").

Task format in every day file: **Priority · Size (S up to 1 h, M up to 2 h, L up to 3 h) · Estimate · Depends on**, then Steps, Files, Tests, Done when.

## 1.1 Repository bootstrap
Must · S · 0.5 h · Depends on: —

Steps:
1. **Owner**: the repo has no commits and is on `master`. Rename the branch: `git branch -m master main`.
2. **Owner**: copy this plan folder into the repo as `docs/plan/`. An agent started inside the repo cannot read files outside it, so this happens before the first agent session.
3. `CLAUDE.md` for the repo: a one-paragraph project summary; "Plan: `docs/plan/README.md`. Read it and `docs/plan/conventions.md` first. One task per session. Log in `docs/ai-log.md`. Never commit, push, merge, create branches or delete files without the owner's approval."; the root commands from [tooling.md](tooling.md); the conventions in short form.
4. `docs/ai-log.md`: a title and the entry format (task ID, date, what the agent did, what the review changed, deviations).
5. Keep the existing `.claude/` and `.gitignore`.

Files: `CLAUDE.md`, `docs/ai-log.md` (new); `docs/plan/**` (copied).
Tests: none (documents only).
Done when: `git status` shows the branch `main`; `docs/plan/README.md`, `CLAUDE.md` and `docs/ai-log.md` exist.

## 1.2 Monorepo and tooling
Must · M · 1.5 h · Depends on: 1.1

Steps:
1. Create the root `package.json` (`"private": true`, `packageManager: "pnpm@10.34.9"`, `engines.node: "24.x"`) and `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
2. `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`, `module: "esnext"`, `moduleResolution: "bundler"`, `target: "es2022"`, `skipLibCheck`, `resolveJsonModule`.
3. `eslint.config.mjs` (flat config): `typescript-eslint` recommended-type-checked, react-hooks, jsx-a11y recommended, `@next/next` (scoped to `apps/web`), testing-library + jest-dom (scoped to test files), `eslint-config-prettier` last. Rules: `@typescript-eslint/consistent-type-imports`, `no-restricted-imports` for `@modqueue/api` outside `apps/web/src/server/**` and `apps/web/src/app/api/**`. Ignore generated folders, `.next`, `coverage`, `playwright-report`, `test-results`.
4. `prettier.config.mjs` (single quotes, trailing commas, width 100, `prettier-plugin-tailwindcss`), `.prettierignore`.
5. `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`), `.nvmrc` (`24`), extend `.gitignore` (`node_modules`, `.next`, `coverage`, `playwright-report`, `test-results`, `.lighthouseci`, `.vercel`, `*.tsbuildinfo`, `.env*` except `.env.example`, `apps/web/src/gql`, `packages/api/src/generated`).
6. Root scripts from [tooling.md](tooling.md), **except** `generate`, `postinstall`, `codegen` and `dev`: they are added in tasks 1.4 and 2.4, when the things they call exist. `.env.example` with all variables from [tooling.md](tooling.md).

Files: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.mjs`, `prettier.config.mjs`, `.prettierignore`, `.editorconfig`, `.gitattributes`, `.nvmrc`, `.env.example` (new); `.gitignore` (modify).
Tests: none (configuration only).
Done when: `pnpm install` succeeds; `pnpm lint` and `pnpm format:check` run without errors.

## 1.3 Next.js app scaffold
Must · S · 0.5 h · Depends on: 1.2

Steps:
1. Create `apps/web` with `create-next-app` in non-interactive mode (TypeScript, App Router, `src/` dir, Tailwind, no ESLint because the root config is used, alias `@/*`). Rename the package to `@modqueue/web`; its `tsconfig.json` extends the base.
2. Remove the boilerplate. `next.config.ts`: `transpilePackages: ['@modqueue/api', '@modqueue/shared']`, `poweredByHeader: false`.
3. Route stubs: `app/page.tsx` redirects to `/queue`; `(console)/queue|log|health|reasons/page.tsx` each render an `<h1>` and export `metadata.title` ("Queue · ModQueue", …).
4. Package scripts: `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`). The `test`, `test:coverage` and `test:e2e` scripts are added in tasks 2.1 and 2.2, so `pnpm -r test` skips this package until then.

Files: `apps/web/**` (new).
Tests: none yet (the web test runner arrives in 2.1).
Done when: `pnpm --filter @modqueue/web dev` shows the four stub pages; `pnpm build` passes.

## 1.4 Local Postgres, Prisma schema, first migration, shared package
Must · M · 1.25 h · Depends on: 1.2

Steps:
1. `docker-compose.yml`: service `db` (`postgres:17-alpine`, user/password/db `modqueue`, port 5432, named volume, `pg_isready` healthcheck) and `docker/postgres/init.sql` that creates `modqueue_test` and `modqueue_e2e`.
2. `packages/api/package.json` (`@modqueue/api`, `"exports": { ".": "./src/index.ts" }`), `tsconfig.json`. Install `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `tsx`.
3. `prisma.config.ts`: schema path, migrations path, datasource URL = `DATABASE_URL_UNPOOLED ?? DATABASE_URL ?? ''`. It must not throw when the URL is missing.
4. `prisma/schema.prisma` exactly as in [api.md](api.md). Run `prisma migrate dev --name init`.
5. `src/db.ts`: `createPrismaClient(url)` using `PrismaPg`, and `getPrisma()`, a lazy singleton cached on `globalThis` outside production. `src/index.ts` exports both.
6. `packages/shared` (`@modqueue/shared`, TS-source exports): `src/constants.ts` with `REPORT_REASONS`, `CONTENT_TYPES`, `MOD_ACTION_TYPES`, `QUEUE_SORTS`, `QUEUE_AGES` (`as const` arrays), human labels (`REPORT_REASON_LABELS`, …), `MAX_BULK_IDS = 200`, `UNDO_WINDOW_MS = 600_000`, `QUEUE_PAGE_SIZE = 50`, `BAN_DURATION_DAYS = [1, 3, 7, 30] as const`; `src/index.ts` re-exports.
7. API package scripts: `prisma:generate`, `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:reset`, `dev`, `typecheck`. Both packages get `typecheck`.
8. Root scripts: `generate` = `pnpm --filter @modqueue/api prisma:generate` (task 2.4 adds codegen to it) and `postinstall` = `pnpm generate`.

Files: `docker-compose.yml`, `docker/postgres/init.sql`, `packages/api/{package.json,tsconfig.json,prisma.config.ts,prisma/schema.prisma,src/db.ts,src/index.ts}`, `packages/shared/{package.json,tsconfig.json,src/index.ts,src/constants.ts}` (new); `package.json` (modify).
Tests: none yet (Jest for the packages arrives in 1.5; the schema is exercised by the seed and integration tests).
Done when: `pnpm db:up && pnpm db:migrate` creates all tables; `pnpm install` runs `postinstall` and creates the Prisma client, also when no database is running.

## 1.5 Jest for the packages and database test helpers
Must · S · 0.75 h · Depends on: 1.4

Steps:
1. `packages/shared/jest.config.ts` and `packages/api/jest.config.ts`: `@swc/jest`, node environment. The API config adds `globalSetup` (runs `prisma migrate deploy` against `DATABASE_URL_TEST`) and runs in band.
2. The generated Prisma client must load in Jest. If it does not (ESM-only output), choose the generator's CommonJS module format or Jest's ESM mode, and record the choice in `docs/ai-log.md`.
3. `packages/api/test/`: `global-setup.ts`; `db.ts` (`truncateAll()`); `factories.ts` (`createModerator`, `createCommunity`, `createAuthor`, `createContent({ status, firstReportedAt, reports })`, `createReason`, `createAction`).
4. Coverage config: thresholds of 80 % lines for `packages/shared/src/**` and `packages/api/src/{lib,services}/**`; reported now, enforced in CI from task 11.4.
5. Package scripts `test` and `test:coverage` in both packages.

Files: `packages/shared/jest.config.ts`, `packages/api/jest.config.ts`, `packages/api/test/{global-setup.ts,db.ts,factories.ts}`, the two test files below (new); both `package.json` files (modify).
Tests: `packages/shared/src/constants.test.ts` (`MAX_BULK_IDS` is 200; every constant array is non-empty and has no duplicates); `packages/api/test/db.int.test.ts` (`createContent` with two reports inserts one content and two reports; `truncateAll()` empties every table).
Done when: `pnpm test` runs both test files green against `modqueue_test`; `pnpm check` is green.

## 1.6 Deterministic seed generator
Must · M · 2 h · Depends on: 1.5

Steps:
1. `seed/presets.ts`: `full` = 5 moderators, 12 communities, 2,000 authors, 10,500 pending + 2,000 resolved contents, 2,000 scheduled contents, 1–8 reports per item (skewed to 1–2), 8 removal reasons; `e2e` = 3 moderators, 12 communities, 80 authors, 500 pending + 100 resolved, 0 scheduled.
2. `seed/text-bank.ts`: neutral communities ("Home Gardening", "Budget Travel", "Indie Games", "Cooking Basics", "Urban Cycling", "Board Games", "Photography Tips", "Language Learning", "Personal Finance 101", "DIY Repairs", "Pet Care", "Book Club"); per-reason sentence templates (spam, off-topic, self-promotion, low effort, misleading title, rule break) written in mild, neutral words; 8 removal reasons with templates that use `{{username}}`, `{{community}}`, `{{reason}}`; moderators `mod_aurora` (ADMIN), `mod_birch`, `mod_cedar`, `mod_dune`, `mod_ember`.
3. `seed/generate.ts`: pure `generateDataset(preset, { now, seed = 42 })` → rows for every table. Faker is seeded; IDs come from `faker.string.uuid()`. Rules:
   - 60 % posts / 40 % comments.
   - Visible items: report times spread over the last 7 days with a daily rhythm; no report is later than `now`.
   - `reportCount` = number of reports; `firstReportedAt` = earliest report.
   - Resolved items get actions spread over 14 days with a log-normal time to action (median ≈ 40 min).
   - About 5 % of authors have 2+ removals and 2 % have an active ban.
   - Scheduled items (time-released reports, [api.md](api.md)): status `PENDING`, `firstReportedAt` spread over the next 30 hours after `now` with the same daily rhythm, 1–3 reports, and every report has `createdAt = firstReportedAt`.
4. `seed/reset.ts`: `resetDemoData(prisma, preset, now)` → one interactive transaction with `{ timeout: 60_000 }` (Prisma's default of 5 s is too short): `TRUNCATE … RESTART IDENTITY CASCADE`, then `createMany` in batches of 1,000. Export it from `src/index.ts`.
5. `seed/cli.ts`: `--preset full|e2e`; refuses to run against a non-localhost database unless `--yes` is given; prints row counts (visible pending, scheduled, resolved, reports, actions) and the duration.

Files: `packages/api/src/seed/{presets.ts,text-bank.ts,generate.ts,reset.ts,cli.ts,generate.test.ts}` (new); `packages/api/src/index.ts` (modify).
Tests (`generate.test.ts`): the same seed gives the same output; counts match the preset; every content has ≥ 1 report; `reportCount` and `firstReportedAt` are consistent; visible items have no report after `now`; every scheduled item is after `now`, within 30 hours, and all its reports equal its `firstReportedAt`; no text contains denylisted real platform names.
Done when: `pnpm db:seed` finishes in under 60 s locally and prints 10,500 visible pending and 2,000 scheduled items; `pnpm check` is green.

## End of the day

**Owner**: review and commit each task to `main` (one commit per task). There is no pull request on Day 1.
