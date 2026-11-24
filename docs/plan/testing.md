# Testing strategy and quality gates

## What is tested where

| Level | Tool | Scope | Examples | Runs |
|---|---|---|---|---|
| Unit | Jest | Pure functions in `shared`, `web/**/lib`, `api/lib` | `queueReducer`, `getNextActiveId`, cursor encoding, `renderTemplate`, Zod schemas, URL parsing, sort comparator, filter matcher, seed generator | every `pnpm test`, CI |
| Hooks | Jest + RTL `renderHook` | `web/**/hooks` | `useHotkeys` ignore rules, `useUrlState`, `useUndoStack`, `useQueueState`, `useModeration` | same |
| Cache | Jest + real `InMemoryCache` | `queue-cache.ts`, type policies | remove from every variant, restore position, restore after `gc()`, page merge | same |
| API integration | Jest + Postgres `modqueue_test` | resolvers + services + SQL | pagination without gaps, filters, visibility of time-released items, bulk limit, concurrency, undo rules, stats SQL, ≤ 6 queries per page | same (CI Postgres service) |
| Component | Jest + RTL + MSW + jest-axe | screens and UI kit | approve / undo / error / conflict flows, keyboard flow, focus rules, dialog validation, axe on every component | same |
| E2E | Playwright + axe | real browser, three viewports | keyboard triage, filters in URL, tablet sheet, phone flow, reflow, touch targets, conflict, bulk INP | `pnpm test:e2e`, CI |
| Performance | Lighthouse CI, Event Timing, bundle analyzer | built app | scores, LCP, CLS, script size, bulk INP | CI from Day 11 |
| Manual | NVDA, Narrator, forced colors, zoom | whole app | the checklist of task 11.5 | Days 8, 11, 12 |

Rules for every test:

- A task's tests are written in the same session as its code ([README.md](README.md), rule 5).
- Fixed clock in API tests; MSW (never a mocked Apollo client) in web tests; real Postgres (never a mocked Prisma) in integration tests.
- E2E uses the `e2e` seed preset, which has no time-released items, so counts are deterministic.
- Web-first assertions only in Playwright (no fixed sleeps).

## Quality goals and how they are enforced

| Goal | Verified by | Enforced from |
|---|---|---|
| Lighthouse 95+ (performance, accessibility, best practices) | LHCI desktop preset, median of 3 runs; production run recorded | Day 11 (CI) |
| 0 axe violations | jest-axe in component tests; `@axe-core/playwright` in every E2E spec (WCAG 2.2 AA tags, including `target-size`) | Day 4 (components) / Day 10 (E2E) |
| INP < 200 ms, including a 200-item bulk action | `bulk-perf.spec.ts` (Event Timing); Sentry Web Vitals in production | Day 11 |
| LCP < 2.5 s, CLS < 0.1 | LHCI assertions; fixed-size skeletons; N1 banner test | Day 11 |
| 320 px without horizontal scroll (except data tables) | `phone.spec.ts` | Day 11 |
| Touch targets ≥ 24×24 px | `phone.spec.ts` size check + axe `target-size` | Day 11 |
| ≥ 80 % line coverage for hooks and utilities | Jest `coverageThreshold` | Day 11 (CI) |
