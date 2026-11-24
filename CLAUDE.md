# CLAUDE.md

ModQueue is a keyboard-first console for community moderators. A moderator works through a queue of 10,000+ reported posts and comments in a list + preview layout and handles each item with one key: approve, remove with a reason, or ban the author. Every action is optimistic and can be undone. Three supporting screens: Mod log, Queue health and Removal reasons. The repo is a pnpm monorepo: the Next.js app `apps/web` mounts the GraphQL API package `packages/api` (Apollo Server, Prisma, PostgreSQL) as the route `/api/graphql`, and `packages/shared` holds the code that both use. All data is synthetic.

## Working rules

Plan: `docs/plan/README.md`. Read it and `docs/plan/conventions.md` first. One task per session. Log in `docs/ai-log.md`. Never commit, push, merge, create branches or delete files without the owner's approval.

## Commands

Run them from the repo root. Some scripts arrive with later tasks; the full list is in `docs/plan/tooling.md`.

- `pnpm dev`: the app on :3000 with GraphQL codegen in watch mode.
- `pnpm dev:api`: the standalone API with Apollo Sandbox on :4000.
- `pnpm build` / `pnpm start`: production build / server of the app.
- `pnpm generate`: Prisma client and GraphQL types (runs on `postinstall`). `pnpm codegen`: GraphQL types only.
- `pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm typecheck`.
- `pnpm test` / `pnpm test:coverage`: Jest in every package. `pnpm test:e2e`: Playwright.
- `pnpm db:up` / `pnpm db:down`: local Postgres in Docker.
- `pnpm db:migrate`: `prisma migrate dev`. `pnpm db:seed`: seed data (`--preset full`, the default, or `--preset e2e`). `pnpm db:reset`: migrate reset + seed.
- `pnpm screenshots`: README screenshots.
- `pnpm check`: format check, lint, typecheck and tests. Run it before you report any task.

On Windows, set environment variables in scripts with `cross-env` and keep LF line endings.

## Conventions (short form of `docs/plan/conventions.md`)

- TypeScript strict: no `any`, no `@ts-ignore`; `@ts-expect-error` only in tests, with a reason.
- Files are kebab-case; components are PascalCase, functions camelCase. Named exports only, except where a default export is required (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, config files).
- Imports: `@/…` inside `apps/web/src`, packages by name (`@modqueue/shared`), no barrel files in `apps/web`. Import `@modqueue/api` only in `apps/web/src/server/**` and `apps/web/src/app/api/**`; those modules start with `import 'server-only'`.
- A feature may import another feature's root files and GraphQL documents, never its `components/`, `hooks/` or `lib/` folders.
- `'use client'` only where needed. Pages and layouts stay server components.
- GraphQL documents use `graphql()` from `@/gql` in the feature's `*.graphql.ts` file. Fragments sit next to the component that renders them. Operation names are unique and PascalCase.
- Styling: Tailwind utilities with semantic token names only (`bg-surface`), no raw hex colours. Variants through `cva`, class merging through `cn()`.
- Accessibility in every UI task: semantic HTML first, full keyboard operation, visible focus `outline`, a label on every form control, touch targets ≥ 24 px (≥ 44 px in the phone bottom bar).
- Errors: never swallow them. User-facing errors are short and say what to do next. Unexpected errors go to Sentry.
- Tests: colocated `*.test.ts(x)`, API integration tests `*.int.test.ts`, E2E in `apps/web/e2e/*.spec.ts`. Test behaviour, not implementation.
- Comments explain why, not what. Every exported hook and service function has a one-line JSDoc.
- Dependencies: only the libraries listed in the plan. A new one needs a one-line reason in `docs/ai-log.md`.
- Commits: one per task, Conventional Commits (`feat(queue): virtualized list`). The agent proposes the message; the owner commits.
- Definition of Done: the task's "Done when" line is true; `pnpm check` is green; new logic has tests and new UI has a jest-axe test; touched UI works by keyboard alone and at 320, 768 and 1280 px; no `console.log`, dead code or TODO without a backlog ID; the task has an entry in `docs/ai-log.md`.
