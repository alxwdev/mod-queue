# Tooling: versions, scripts, environment

## Versions (verify at setup and pin them through the lockfile)

| Tool | Expected major | Notes for the agent |
|---|---|---|
| Node.js | 24 LTS (22 is fine) | `.nvmrc`; the same version in Vercel project settings and CI |
| pnpm | 10 | through Corepack; `packageManager` field in the root `package.json`. pnpm 10 does not run the build scripts of dependencies by default: if a dependency needs one, allow it explicitly (`pnpm approve-builds`) and record it in `docs/ai-log.md` |
| TypeScript | 5.9+ | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax` |
| Next.js | 16 | App Router; `next lint` is gone, so use the ESLint CLI; middleware is not used |
| React | 19 | `ref` is a normal prop; `forwardRef` is not needed |
| Tailwind CSS | 4 | CSS-first config with `@theme` in `globals.css`; no `tailwind.config.js` |
| Radix UI | unified `radix-ui` package | `import { Dialog } from 'radix-ui'` |
| Apollo Client | 4 | React hooks come from `@apollo/client/react`; errors are `CombinedGraphQLErrors` / `ServerError`; needs the `rxjs` peer dependency |
| GraphQL Codegen | current CLI + `client-preset`, `typescript`, `typescript-resolvers` | watch mode needs `@parcel/watcher` |
| Apollo Server | 5 | `@apollo/server`; the standalone server comes from `@apollo/server/standalone` |
| Prisma | 7 | `prisma-client` generator with `output`, `prisma.config.ts`, driver adapter `@prisma/adapter-pg` + `pg` |
| PostgreSQL | 17 | `postgres:17-alpine` locally; Neon project on Postgres 17 |
| Zod | 4 | `@hookform/resolvers` 5+ |
| React Hook Form | 7 | |
| TanStack Virtual / Table | 3 / 8 | |
| Recharts | 3 | keyboard accessibility layer is on by default |
| Jest | 30 | `next/jest` for web, `@swc/jest` for packages, `jest-fixed-jsdom` environment for MSW 2 |
| MSW | 2 | `graphql.query('Queue', …)` handlers |
| Playwright | latest 1.x | `@axe-core/playwright` |
| ESLint | 9+ flat config | `typescript-eslint`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`, `eslint-plugin-jsx-a11y`, `eslint-plugin-testing-library`, `eslint-plugin-jest-dom`, `eslint-config-prettier` |
| Sentry | `@sentry/nextjs` 10 | no Session Replay (bundle size) |

If an installed major differs from this table, follow its migration guide and record the change in `docs/ai-log.md`.

## Root scripts (`package.json`)

| Script | Command | Purpose |
|---|---|---|
| `dev` | `concurrently -k -n codegen,web "pnpm codegen --watch" "pnpm --filter @modqueue/web dev"` | App on :3000 with codegen in watch mode |
| `dev:api` | `pnpm --filter @modqueue/api dev` | Standalone API with Apollo Sandbox on :4000 |
| `build` / `start` | `pnpm --filter @modqueue/web build` / `start` | Production build / server |
| `generate` | `pnpm --filter @modqueue/api prisma:generate && pnpm codegen` | Prisma client + GraphQL types |
| `codegen` | `graphql-codegen --config codegen.ts` | |
| `postinstall` | `pnpm generate` | Generated code exists after every install (local, CI, Vercel) |
| `lint` | `eslint . --max-warnings=0` | |
| `format` / `format:check` | `prettier --write .` / `prettier --check .` | |
| `typecheck` | `pnpm -r --parallel typecheck` | `tsc --noEmit` in every package |
| `test` / `test:coverage` | `pnpm -r test` / `pnpm -r test:coverage` | Jest in every package |
| `test:e2e` | `pnpm --filter @modqueue/web test:e2e` | Playwright |
| `screenshots` | `pnpm --filter @modqueue/web screenshots` | README screenshots (task 12.3) |
| `db:up` / `db:down` | `docker compose up -d --wait db` / `docker compose down` | Local Postgres |
| `db:migrate` | `pnpm --filter @modqueue/api db:migrate` | `prisma migrate dev` |
| `db:seed` | `pnpm --filter @modqueue/api db:seed` | `--preset full` (default) or `--preset e2e` |
| `db:reset` | `pnpm --filter @modqueue/api db:reset` | Migrate reset + seed |
| `check` | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` | Run before reporting any task |

Windows note: set environment variables in scripts with `cross-env`; keep LF line endings (`.gitattributes`: `* text=auto eol=lf`).

## Environment variables (`.env.example` documents all of them)

| Variable | Used in | Example / source | Purpose |
|---|---|---|---|
| `DATABASE_URL` | local, CI, Vercel | `postgresql://modqueue:modqueue@localhost:5432/modqueue`; Neon pooled URL in Vercel | Runtime connection |
| `DATABASE_URL_UNPOOLED` | Vercel (local: same as above) | Neon direct URL | Migrations (`prisma.config.ts`) |
| `DATABASE_URL_TEST` | local, CI | `…/modqueue_test` | API integration tests |
| `CRON_SECRET` | Vercel | 32+ random characters | Protects `/api/cron/reset-demo` |
| `E2E_TEST_ROUTES` | local E2E, CI only, **never in Vercel** | `1` | Enables `/api/test/reset` |
| `NEXT_PUBLIC_APP_ENV` | all | `development` / `preview` / `production` | Sentry environment, dev-only pages |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` | Vercel | from Sentry | Client / server error reporting |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Vercel (build only) | from Sentry | Source map upload |

`prisma.config.ts` must not throw when the database URL is missing, because `prisma generate` runs in `postinstall` without a database.
