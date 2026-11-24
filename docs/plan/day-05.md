# Day 5: Deployment, queue data and list

**Goal:** a live deployment with monitoring and a daily demo reset; the queue data hook and the virtualized list.
**Complexity:** High · **Must:** 6.25 h · **Branch:** `day-05-deploy-queue-list`
**Demo:** the production URL shows the shell at 320/768/1280 px; a test error from the preview appears in Sentry with a readable stack trace; `/queue` scrolls fast through thousands of items.
**Read first:** [conventions.md](conventions.md), [tooling.md](tooling.md) (environment variables) for 5.1; [architecture.md](architecture.md) ("Frontend architecture") and [api.md](api.md) (SDL) for 5.2–5.4.

## 5.1 Deployment, monitoring, demo reset
Must · L · 2.5 h · Depends on: 2.3, 2.5, 4.4, 1.6

Steps:
1. **Owner**, guided by the agent:
   - Neon project `modqueue` in the region of the Vercel functions (default `iad1` → `aws-us-east-1`), branches `main` (production) and `preview`.
   - Vercel project from the GitHub repo: Root Directory `apps/web`, framework Next.js, production branch `main`, same Node version as `.nvmrc`, build command `pnpm --filter @modqueue/api db:migrate:deploy && pnpm --filter @modqueue/web build`, environment variables from [tooling.md](tooling.md) (Production → Neon `main`, Preview → Neon `preview`). The first production deployment builds the current `main` (Days 1–4).
   - Sentry project `modqueue-web` (Next.js).
2. Seed both Neon branches once: `pnpm db:seed --preset full --yes` with that branch's URL.
3. Sentry: `instrumentation-client.ts` (browser tracing for Web Vitals, `tracesSampleRate` 0.2 in production / 1.0 elsewhere, no Replay, `sendDefaultPii: false`, `environment` from `NEXT_PUBLIC_APP_ENV`), `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` (`register` + `onRequestError`), `withSentryConfig` in `next.config.ts` (source maps upload when `SENTRY_AUTH_TOKEN` is set). Connect `reportError` in `src/server/graphql.ts` and `reportClientError` in the error link. Add a "Throw test error" button to `/dev/ui`.
4. `app/api/cron/reset-demo/route.ts`: `GET`; 401 unless `Authorization: Bearer ${CRON_SECRET}`; calls `resetDemoData(getPrisma(), 'full', new Date())`; `maxDuration = 60`. `apps/web/vercel.json`: `{ "crons": [{ "path": "/api/cron/reset-demo", "schedule": "0 5 * * *" }] }` (Hobby allows one run per day; crons run only on production).
5. Security headers in `next.config.ts` `headers()`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
6. `lib/monitoring/web-vitals-reporter.tsx` with `useReportWebVitals`: in development `console.table` with attribution; in every environment push metrics to `window.__MODQUEUE_VITALS__` (used by E2E). Sentry collects LCP, CLS and INP in production.
7. README: add the live demo link.

Files: `apps/web/{instrumentation.ts,instrumentation-client.ts,sentry.server.config.ts,sentry.edge.config.ts,vercel.json}`, `apps/web/src/app/api/cron/reset-demo/{route.ts,route.test.ts}`, `apps/web/src/lib/monitoring/web-vitals-reporter.tsx` (new); `apps/web/next.config.ts`, `apps/web/src/server/graphql.ts`, `apps/web/src/lib/apollo/error-link.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/dev/ui/page.tsx`, `README.md` (modify).
Tests: `route.test.ts` (no header → 401; wrong secret → 401; correct secret calls `resetDemoData` once, which is mocked).
Done when, on the Vercel preview of this branch: the shell is served; `me` works through `/api/graphql`; the test error from `/dev/ui` shows a readable stack trace in Sentry; the cron route returns 401 without the secret; the security headers are present.
Done when, after the day's pull request is merged: the production URL serves the shell and `me` works; the cron job is listed in Vercel; calling the cron route once by hand with the secret reseeds the data.

## 5.2 URL state
Must · S · 0.75 h · Depends on: 2.1

Steps:
1. `lib/url/use-url-state.ts`: `useUrlState(schema, { defaults })` → `[state, setState(patch, { history: 'replace' | 'push' })]`. It reads `useSearchParams()`, parses with `safeParse` (invalid values fall back to defaults and never throw), leaves out default values, writes arrays as sorted comma-separated lists, and updates the URL with `window.history.replaceState/pushState` (Next.js keeps `useSearchParams` in sync without a server request).
2. `features/queue/lib/queue-search-params.ts`: schema `{ reasons: ReportReason[], types: ContentType[], communities: string[] (slugs), age?: QueueAge, sort: QueueSort = 'OLDEST', item?: string }` and `toQueueVariables(params)` → `{ first: QUEUE_PAGE_SIZE, filter, sort }`.
3. `features/queue/hooks/use-queue-search-params.ts` wraps both.

Files: `apps/web/src/lib/url/{use-url-state.ts,use-url-state.test.tsx}`, `apps/web/src/features/queue/lib/{queue-search-params.ts,queue-search-params.test.ts}`, `apps/web/src/features/queue/hooks/use-queue-search-params.ts` (new).
Tests: defaults; invalid values dropped without throwing; serialize → parse round trip; stable order of arrays; `push` adds a history entry and `replace` does not; `toQueueVariables` maps every field.
Done when: the tests are green.

## 5.3 Queue data hook
Must · S · 0.75 h · Depends on: 5.2, 4.3, 3.1

Steps:
1. `features/queue/graphql/queue.graphql.ts`: fragment `QueueItemFields` (id, type, title, body, status, firstReportedAt, reportCount, reasonCounts, community { slug name }, author { id username }); fragment `ContentPreviewFields` (adds parentTitle, createdAt, reports, author stats, activeBan, history); queries `Queue`, `ContentPreview`, `QueueMeta` (communities).
2. `hooks/use-queue.ts` → `{ items, totalCount, hasNextPage, isLoading, isFetchingMore, error, loadMore, refetch }`. `loadMore` ignores calls while a fetch is running and when there is no next page.
3. `src/test/fixtures/queue.ts`: builders `buildQueueItem(overrides)`, `buildQueuePage(count, { after, hasNextPage, totalCount })`, used by every later queue test.

Files: `apps/web/src/features/queue/graphql/queue.graphql.ts`, `apps/web/src/features/queue/hooks/{use-queue.ts,use-queue.test.tsx}`, `apps/web/src/test/fixtures/queue.ts` (new); `apps/web/src/test/msw/handlers.ts` (modify: default `Queue` and `QueueMeta` handlers).
Tests (MSW): two pages; `loadMore` appends; a second `loadMore` during a fetch is ignored; error state; variables follow the URL.
Done when: the tests are green.

## 5.4 Virtualized queue list
Must · L · 2.25 h · Depends on: 5.3, 4.1

Steps:
1. `components/queue-list.tsx`: props `{ items, totalCount, activeId, selectedIds, hasNextPage, onLoadMore, onActivate, onOpen, onToggleSelect }`. `useVirtualizer` over its own scroll container (`count = items.length + (hasNextPage ? 1 : 0)`, `estimateSize` 72 px desktop / 88 px phone (fixed row heights, no measuring), `overscan: 8`, `getItemKey` = id). Call `onLoadMore` when the last rendered index is ≥ `items.length - 10`. Expose `scrollToIndex` through a ref for task 8.1.
2. ARIA from [architecture.md](architecture.md) ("Keyboard model": `listbox` / `option`, `aria-label="Report queue"`, `aria-posinset`, `aria-setsize`, roving `tabIndex`); row DOM id `queue-row-<id>`.
3. `components/queue-row.tsx` (`React.memo`, primitive props): a decorative checkbox area (`aria-hidden`, click toggles selection), type icon + text label, title or a two-line comment excerpt, community, author, the top reason badge + "+N", report count, relative age in `<time dateTime>`. Active and selected styles use `row-active` / `row-selected` tokens plus a non-colour cue (left border, check icon). `lib/format/relative-time.ts` and `lib/format/number.ts` for the age and the counts.
4. States: `queue-skeleton.tsx` (first load), a "Loading more…" loader row, the empty state ("Queue is clear", a focusable heading with `tabIndex={-1}`, plus "Clear filters" when filters are on), the error state with Retry.
5. `components/queue-screen.tsx`, first version: `useQueue` + `QueueList`; a click makes a row active (local state for now; the reducer replaces it in task 6.3). `(console)/queue/page.tsx` renders it inside a Suspense boundary.

Files: `apps/web/src/features/queue/components/{queue-list.tsx,queue-row.tsx,queue-skeleton.tsx,queue-screen.tsx,queue-list.test.tsx,queue-row.test.tsx}`, `apps/web/src/lib/format/{relative-time.ts,number.ts,relative-time.test.ts}` (new); `apps/web/src/app/(console)/queue/page.tsx`, `apps/web/src/app/(console)/queue/page.test.tsx` (modify).
Tests: with 10,000 items at most 40 rows are in the DOM; ARIA attributes; exactly one row has `tabIndex` 0; `onLoadMore` fires near the end; empty and error states; relative time formats ("just now", "5 min", "3 h", "2 d"); axe.
Done when: `/queue` lists the `full` seed; scrolling through it has no long tasks over 50 ms (Chrome Performance panel, recorded once in `docs/quality.md`).

## End of the day

**Owner**: check the preview, merge the pull request, then run the production checks of task 5.1.
