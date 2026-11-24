# Day 2: Test tooling, CI, API core, design tokens

**Goal:** all test runners and CI work; the GraphQL server answers its first query; the palette is in place and approved.
**Complexity:** Medium · **Must:** 6.5 h · **Branch:** `day-02-tooling-api-core`
**Demo:** the Day 2 pull request has green `quality` and `e2e` jobs; `{ me { username } }` returns `mod_aurora`; `/dev/ui` shows the palette and the type scale.
**Read first:** [conventions.md](conventions.md), [tooling.md](tooling.md), [structure.md](structure.md); [api.md](api.md) for 2.4–2.5; [design.md](design.md) for 2.6.

## 2.1 Web test tooling
Must · S · 1 h · Depends on: 1.3

Steps:
1. `apps/web/jest.config.ts` through `next/jest`, `testEnvironment: 'jest-fixed-jsdom'`.
2. `jest.setup.ts`: `@testing-library/jest-dom`, `jest-axe` (`toHaveNoViolations`, `region` rule off for isolated components), MSW server `listen/resetHandlers/close`, mocks for `matchMedia`, `ResizeObserver`, `scrollTo`, `Element.prototype.scrollIntoView`, `hasPointerCapture`, and element sizes (`offsetHeight` 600, `offsetWidth` 800, `getBoundingClientRect`) so TanStack Virtual renders rows in jsdom.
3. `src/test/msw/server.ts` and `src/test/msw/handlers.ts` (empty default handler list).
4. `src/test/render.tsx`: `renderWithProviders(ui, { route })` that sets `window.history` to `route`. Later tasks add providers to it (Apollo in 4.3; Settings, Announcer, Toast, Tooltip in 4.4).
5. Coverage config: thresholds of 80 % lines for `src/**/hooks/**` and `src/**/lib/**`; reported now, enforced in CI from task 11.4.
6. Package scripts `test` and `test:coverage`.

Files: `apps/web/jest.config.ts`, `apps/web/jest.setup.ts`, `apps/web/src/test/{render.tsx,msw/server.ts,msw/handlers.ts}`, the two test files below (new); `apps/web/package.json` (modify).
Tests: `src/app/(console)/queue/page.test.tsx` (the stub heading renders; axe finds no violations); `src/test/msw/server.test.ts` (a `graphql.query` handler answers a `fetch` POST made inside the test).
Done when: `pnpm test` runs the web tests together with the package tests; `pnpm check` is green.

## 2.2 Playwright setup
Must · S · 0.75 h · Depends on: 1.6, 2.1

Steps:
1. `apps/web/playwright.config.ts`: projects `desktop` (1280×800), `tablet` (768×1024, touch), `phone` (412×915, mobile, touch), all Chromium; `webServer` = `pnpm start` with `DATABASE_URL` of `modqueue_e2e` and `E2E_TEST_ROUTES=1`; trace `on-first-retry`; CI: 1 worker, 1 retry.
2. `e2e/global-setup.ts`: migrates `modqueue_e2e` and seeds the `e2e` preset.
3. `e2e/smoke.spec.ts`: the `/queue` heading is visible and axe finds no violations.
4. Package script `test:e2e`; install `@playwright/test` and `@axe-core/playwright`.

Files: `apps/web/playwright.config.ts`, `apps/web/e2e/{global-setup.ts,smoke.spec.ts}` (new); `apps/web/package.json` (modify).
Tests: the smoke spec itself.
Done when: `pnpm build && pnpm test:e2e --project=desktop` passes.

## 2.3 CI and repository docs
Must · S · 0.75 h · Depends on: 2.1, 2.2

Steps:
1. `.github/workflows/ci.yml` on `pull_request` and `push` to `main`, with `concurrency` cancelling older runs.
   - Job `quality`: checkout → `pnpm/action-setup` → `setup-node` (pnpm cache) → `pnpm install --frozen-lockfile` → `format:check` → `lint` → `typecheck` → Postgres 17 service + `psql` creates `modqueue_test` → `pnpm test:coverage` → upload the coverage artifact.
   - Job `e2e` (needs `quality`): Postgres service, create `modqueue_e2e`, cache Playwright browsers, `pnpm exec playwright install --with-deps chromium`, `pnpm build`, `pnpm test:e2e`, upload the HTML report on failure. (Lighthouse is added in task 11.3.)
2. `README.md` stub (name, one-line pitch, "Work in progress", local setup commands), `LICENSE` (MIT), `docs/adr/0000-template.md`, `.github/pull_request_template.md` (summary, day and task IDs, screenshots at 3 widths, the task checklist from [conventions.md](conventions.md)).
3. **Owner**: create the public GitHub repository, add it as `origin`, push `main` and the day branch, open the pull request "Day 2: Test tooling, CI, API core, design tokens".

Files: `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `README.md`, `LICENSE`, `docs/adr/0000-template.md` (new).
Tests: none (the CI run is the check).
Done when: both CI jobs are green on the pull request.

## 2.4 SDL and code generation
Must · M · 1.25 h · Depends on: 1.4, 1.5

Steps:
1. Split the SDL from [api.md](api.md) into `src/schema/{base,queue,moderation,mod-log,removal-reasons,health}.graphql.ts`, each exporting `/* GraphQL */` strings; `src/schema/index.ts` exports `typeDefs: string[]`.
2. `src/context.ts`: only the `GraphQLContext` interface for now (`prisma`, `moderator`, `loaders`, `now`), so that the generated resolver types compile. `createContext` and the loaders come in task 2.5; until then `loaders` is typed as an empty object type.
3. `codegen.ts` at the root: `schema: 'packages/api/src/schema/*.graphql.ts'`; outputs:
   - `apps/web/src/gql/` with `preset: 'client'`, `presetConfig.fragmentMasking: false`, `enumsAsTypes: true`, `useTypeImports: true`, `scalars.DateTime: 'string'`; `documents: ['apps/web/src/**/*.{ts,tsx}', '!apps/web/src/gql/**']`, `ignoreNoDocuments: true`.
   - `packages/api/src/generated/resolvers-types.ts` with `typescript` + `typescript-resolvers`, `contextType: '../context#GraphQLContext'`, `mappers` from GraphQL types to Prisma models (`Content`, `Author`, `Community`, `Moderator`, `ModAction`, `RemovalReason`, `Report`), `scalars.DateTime: 'Date | string'`.
4. Root scripts: add `codegen`; extend `generate` to `pnpm --filter @modqueue/api prisma:generate && pnpm codegen`; add `dev` (codegen in watch mode + the web app, [tooling.md](tooling.md)).
5. Drift test: build the schema with `buildASTSchema` and assert that the GraphQL enums `ReportReason`, `ContentType`, `ModActionType`, `QueueSort`, `QueueAge` equal the matching `@modqueue/shared` constants, and that `ReportReason`, `ContentType`, `ContentStatus`, `ModActionType` equal the Prisma enums.

Files: `packages/api/src/schema/*.graphql.ts`, `packages/api/src/schema/index.ts`, `packages/api/src/context.ts`, `codegen.ts`, `packages/api/src/schema/schema-enums.test.ts` (new); `package.json` (modify).
Tests: `schema-enums.test.ts` (step 5).
Done when: `pnpm generate` produces both outputs; the drift test is green; `pnpm check` is green.

## 2.5 Server core and HTTP mounting
Must · M · 1.75 h · Depends on: 2.4, 1.3, 1.6

Steps:
1. `src/lib/clock.ts`: `type Clock = () => Date`, `systemClock`.
2. `src/errors.ts`: `ErrorCode` union; helpers `userInputError(fieldErrors)`, `notFound()`, `forbidden()`, `undoExpired()`; `parseInput(schema, value)` turns Zod issues into `BAD_USER_INPUT` with `extensions.fieldErrors`.
3. `src/loaders.ts`: `createLoaders(prisma, now)` → DataLoaders for authors, communities, moderators, reasonCounts (one `groupBy`), author stats, active bans.
4. `src/context.ts`: `GraphQLContext { prisma; moderator; loaders; now: Clock }`; `createContext({ request, prisma, now })` resolves the moderator from the cookie `mq_moderator` or the header `x-moderator`, with fallback `mod_aurora`. The moderator list is cached in memory for 60 s.
5. `src/resolvers/scalars.ts` (`DateTime`) and `src/resolvers/index.ts` with `Query.me` and `Query.moderators`. The other resolvers are added by the Day 3 tasks; nothing calls them before that.
6. `src/server.ts`: `createApolloServer({ reportError, isProduction })` with `typeDefs`, `resolvers`, introspection on, the local Sandbox landing page only outside production, `formatError` masking unexpected errors in production, and a plugin whose `didEncounterErrors` calls `reportError(error, { operationName })` for non-user errors.
7. `src/http/fetch-handler.ts`: `createFetchHandler(server, getContext): (request: Request) => Promise<Response>`. It converts headers to `HeaderMap`, parses the JSON body for POST (invalid JSON → 400), calls `server.executeHTTPGraphQLRequest`, and returns a `Response` with the status and headers from the result. Call `server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests()` once.
8. `src/index.ts`: add `createGraphQLHandler({ prisma, reportError, isProduction, now })`.
9. `src/dev-server.ts`: `startStandaloneServer` on port 4000, same context factory.
10. `test/execute.ts`: `execute(operation, variables, { moderator, now })` through `server.executeOperation`, for the integration tests of Day 3.
11. Web: `src/server/prisma.ts` (`import 'server-only'`, re-exports `getPrisma`), `src/server/graphql.ts` (creates the handler once; `reportError` stays a no-op until task 5.1), `src/app/api/graphql/route.ts` (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, exports `GET` and `POST`).

Files: `packages/api/src/{lib/clock.ts,errors.ts,loaders.ts,server.ts,http/fetch-handler.ts,dev-server.ts,resolvers/index.ts,resolvers/scalars.ts}`, `packages/api/test/execute.ts`, `apps/web/src/server/{prisma.ts,graphql.ts}`, `apps/web/src/app/api/graphql/route.ts`, the two test files below (new); `packages/api/src/{context.ts,index.ts}` (modify).
Tests: `src/http/fetch-handler.int.test.ts` (POST `{ me { username } }` → 200 + `mod_aurora`; invalid JSON → 400; GET with a query string works); `src/context.int.test.ts` (the cookie selects the moderator; the header works too; an unknown name → default).
Done when: `curl -X POST localhost:3000/api/graphql -H "content-type: application/json" -d "{\"query\":\"{ me { username } }\"}"` returns `mod_aurora`; `pnpm dev:api` opens Sandbox on :4000; `pnpm check` is green.

## 2.6 Design tokens
Must · S · 1 h · Depends on: 1.3

Steps:
1. `globals.css`: `@import "tailwindcss";` the light values from [design.md](design.md) as CSS variables on `:root`; `@theme inline` maps them to utilities. Colour names: `canvas`, `surface`, `surface-raised`, `line`, `line-strong`, `fg`, `fg-muted`, `fg-subtle`, `accent`, `accent-hover`, `accent-fg`, `accent-subtle`, `focus`, `success`, `success-subtle`, `warning`, `warning-subtle`, `danger`, `danger-hover`, `danger-fg`, `danger-subtle`, `row-active`, `row-selected`, `chart-1`…`chart-5`. Also radius `sm/md/lg`, shadows `sm/md/lg`, the overlay scrim, motion `--duration-fast` and `--duration-base` (0 under `prefers-reduced-motion`), z-index `dropdown`, `sticky`, `overlay`, `toast`.
2. Prepare dark mode without building it: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` and an empty `[data-theme="dark"]` block with a comment pointing to N2.
3. Font: Inter via `next/font` → `--font-sans`; `ui-monospace` stack for `kbd`. Type scale from [design.md](design.md).
4. `app/dev/ui/page.tsx` with a "Tokens" section: a swatch with name and value for every colour, the type scale, radii and shadows. The page calls `notFound()` when `NEXT_PUBLIC_APP_ENV === 'production'`. Tasks 4.1–4.2 add the components to this page.
5. `docs/design-tokens.md`: the token table and the contrast table, recomputed with a contrast tool or a small script. The ratios must match [design.md](design.md) (rounding differences are fine).
6. **Owner**: review `/dev/ui` and approve or change the palette. A change goes into `docs/plan/design.md`, `globals.css` and `docs/design-tokens.md` together, before task 4.1 starts.

Files: `apps/web/src/app/dev/ui/page.tsx`, `docs/design-tokens.md` (new); `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/e2e/smoke.spec.ts` (modify).
Tests: extend `e2e/smoke.spec.ts`: `/dev/ui` has no axe violations (this checks colour contrast in a real browser).
Done when: every text pair in the contrast table is ≥ 4.5:1 and every UI pair ≥ 3:1; no raw colour values exist outside `globals.css`; the owner has approved the palette.

## End of the day

**Owner**: commit each task on the branch, push, and merge the pull request when both CI jobs are green.
