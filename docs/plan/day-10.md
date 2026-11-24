# Day 10: Mod log, queue health, E2E start

**Goal:** the two supporting screens are complete, and the main keyboard journey is proven in a real browser.
**Complexity:** Medium–High · **Must:** 7 h · **Branch:** `day-10-log-health-e2e`
**Demo:** find your actions from Day 9 in the log by searching for the author; open Queue health at phone width, where the charts stack in one column; `pnpm test:e2e --project=desktop` runs the keyboard triage spec green.
**Read first:** [conventions.md](conventions.md), [api.md](api.md) (`modLog`, `queueHealth`), [design.md](design.md) ("Charts"); [testing.md](testing.md) for 10.4–10.5.

## 10.1 Mod log UI
Must · L · 2.25 h · Depends on: 3.4, 5.2, 4.2, 4.3

Paths are inside `apps/web/src/features/mod-log/`.

Steps:
1. `mod-log-search-params.ts`: URL state `types`, `mods`, `q`, `from`, `to`, and `toModLogVariables`. `mod-log.graphql.ts`: the `ModLog` query. `use-mod-log.ts`: the data hook with `loadMore`.
2. `mod-log-filters.tsx`: action types (DropdownMenu checkbox items), moderator (native select), date range (two `<input type="date">`), search (`type="search"`, label, 300 ms debounce through `lib/hooks/use-debounced-value.ts`).
3. `mod-log-table.tsx` (≥ `md`) with `columns.tsx`: TanStack Table (`manualFiltering`, core row model only). Columns: When (relative time; absolute in a Tooltip and in `<time dateTime>`), Moderator, Action (Badge), Content (type + title/excerpt), Author, Reason, Status ("Undone" badge). A visually hidden caption "Moderator actions, newest first". The wrapper is `role="region"`, labelled, `tabIndex={0}`, `overflow-x-auto` (keyboard-scrollable).
4. `mod-log-cards.tsx` (< `md`): a `<ul>` of cards with a `<dl>`, fed by the same `table.getRowModel().rows`; CSS shows one renderer and hides the other (`hidden md:block` / `md:hidden`).
5. `mod-log-screen.tsx`: filters, the two renderers, the "Load 50 more · 1,950 left" button, `aria-busy` while loading, error and empty states. `(console)/log/page.tsx` renders it.

Files: `mod-log-search-params.ts`, `mod-log.graphql.ts`, `use-mod-log.ts`, `mod-log-filters.tsx`, `columns.tsx`, `mod-log-table.tsx`, `mod-log-cards.tsx`, `mod-log-screen.tsx`, `mod-log-screen.test.tsx`, `apps/web/src/lib/hooks/use-debounced-value.ts`, `apps/web/src/lib/format/date.ts` (new); `apps/web/src/app/(console)/log/page.tsx`, `apps/web/src/test/msw/handlers.ts` (modify).
Tests: rows render; a filter change updates the URL and the variables; the search waits for the debounce; load more appends and updates the "left" count; an undone action shows the badge; both renderers exist (E2E checks which one is visible); empty and error states; axe.
Done when: the tests are green; the day's mod log demo works in the browser.

## 10.2 Queue health UI
Must · M · 1.75 h · Depends on: 3.5, 4.1, 4.3

Paths are inside `apps/web/src/features/queue-health/`.

Steps:
1. `queue-health.graphql.ts`: the `QueueHealth` query. `health-screen.tsx`: `stat-tiles.tsx` (4 tiles in a `<dl>`), then a chart grid `grid-cols-1 lg:grid-cols-2`. `(console)/health/page.tsx` renders it.
2. Charts (`reports-per-hour-chart.tsx` area chart, `median-time-chart.tsx` bar chart, `top-reasons-chart.tsx` horizontal bar chart), each loaded with `next/dynamic(…, { ssr: false, loading: () => <Skeleton height={260} /> })` so they are separate chunks with fixed heights (no CLS). Each chart has one series in `var(--color-chart-1)`; axis text and grid lines follow [design.md](design.md); time labels in local time through `Intl.DateTimeFormat`.
3. `chart-figure.tsx`: `<figure>` + `<figcaption>` (title + one summary sentence, e.g. "Peak: 412 reports at 14:00") + `<details>` "Show data table" with a real `<table>`, the text alternative for each chart.

Files: `queue-health.graphql.ts`, `health-screen.tsx`, `stat-tiles.tsx`, `chart-figure.tsx`, `reports-per-hour-chart.tsx`, `median-time-chart.tsx`, `top-reasons-chart.tsx`, `health-screen.test.tsx` (new); `apps/web/src/app/(console)/health/page.tsx`, `apps/web/src/test/msw/handlers.ts` (modify).
Tests: tiles and data tables render from MSW (chart modules are mocked in Jest); the summary sentence names the peak; a `null` median renders as "No actions"; loading and error states; axe.
Done when: the tests are green; at phone width the charts stack in one column without horizontal scroll.

## 10.3 Navigation badge
Must · S · 0.5 h · Depends on: 10.2, 4.4, 6.4

Steps: a pending-count badge on the "Queue" navigation item, from a `QueuePendingCount` query (`queueHealth { summary { pendingCount } }`). The label reads "Queue, 10,512 pending". It refetches after `evictQueueAggregates`.

Files: `apps/web/src/components/layout/main-nav.test.tsx` (new); `apps/web/src/components/layout/main-nav.tsx`, `apps/web/src/features/queue-health/queue-health.graphql.ts` (modify).
Tests: the badge shows the count from MSW; the accessible name of the link is "Queue, 10,512 pending"; after an approve the badge shows the new count; no badge while loading (and no layout shift: the slot has a fixed width).
Done when: the tests are green.

## 10.4 Playwright fixtures and reset route
Must · S · 0.75 h · Depends on: 2.2, 1.6

Steps:
1. `app/api/test/reset/route.ts`: `POST`; 404 unless `process.env.E2E_TEST_ROUTES === '1'` (checked at request time); calls `resetDemoData(getPrisma(), 'e2e', new Date())`.
2. `e2e/fixtures.ts`: `resetDb` (auto fixture for specs that change data), `asModerator(username)` (sets the cookie), `expectNoA11yViolations(page)` (AxeBuilder with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`), `liveRegionText(page)`.
3. Tag specs `@desktop`, `@tablet`, `@phone`; each project runs its tag through `grep`. Specs that change data run serially.

Files: `apps/web/src/app/api/test/reset/{route.ts,route.test.ts}`, `apps/web/e2e/fixtures.ts` (new); `apps/web/playwright.config.ts`, `apps/web/e2e/smoke.spec.ts` (modify: use the fixtures and tags).
Tests: `route.test.ts` (404 without the flag; with the flag it calls `resetDemoData` once, which is mocked).
Done when: `pnpm test:e2e` runs the smoke spec on all three projects through the new fixtures.

## 10.5 E2E: keyboard triage and filters
Must · M · 1.75 h · Depends on: 10.4, 9.2, 8.4, 10.1

| Spec | Projects | What it proves |
|---|---|---|
| `triage-keyboard.spec.ts` | desktop, tablet | The full flow with `page.keyboard` only (no clicks): move with `j/k`, approve, undo, remove through the dialog (Tab, arrows, typing, `Ctrl+Enter`), permanent ban needs the confirmation, bulk `x x x a`, `?` help + `Esc`, shortcuts off → `a` does nothing; checks focus, count text, toasts, live region, the `item` URL parameter; axe after each major step; the actions appear in the mod log (reached by keyboard). On tablet, `Enter` opens the sheet and the keys work inside it. |
| `filters-url.spec.ts` | desktop | Filters → URL; reload keeps them; Back/Forward; Clear all. |

Use web-first assertions only (no fixed sleeps).

Files: `apps/web/e2e/{triage-keyboard.spec.ts,filters-url.spec.ts}` (new).
Tests: the two specs.
Done when: both specs pass locally three times in a row (`--repeat-each=3`).

## End of the day

**Owner**: commit, push, merge the pull request when CI is green (the `e2e` job now runs the new specs).
