# Nice-to-have backlog

Take items in this order, only when the day's Must tasks meet their Definition of Done, or on a reserve day ([schedule.md](schedule.md)). Each item follows the task Definition of Done in [conventions.md](conventions.md).

| ID | Item | Estimate | Depends on | Done when |
|---|---|---|---|---|
| N1 | **Live updates.** Query `queueUpdates(since, filter): { newCount, handledElsewhere: [ID!]!, serverTime }` polled every 15 s (paused while the tab is hidden). New items come from the time-released reports ([api.md](api.md)), so the banner works on the live demo without a traffic simulator. A "12 new reports, Show" banner in a reserved slot (no layout shift); Show refetches from the top and announces it. Items handled by other moderators are removed from the cache; if the active one is removed, focus moves to the next item and it is announced. Demo tool (only with `DEMO_TOOLS_ENABLED=1`): "Another moderator handles 3 items". E2E `live-updates.spec.ts` checks the banner and that CLS stays 0. | 3 h | 7.1, 8.2 | The banner appears without layout shift; conflicts handled |
| N2 | **Dark mode.** Dark token values, `prefers-color-scheme` as the default, a theme toggle (system / light / dark) in Settings, an inline no-flash script in `<head>`, chart colours, the contrast table for dark. | 1.5 h | 2.6, 10.2 | axe and the contrast table pass in both themes |
| N3 | **Streaming SSR of the first queue page** (only if the LCP gate fails): `@apollo/client-integration-nextjs`, `PreloadQuery` in the page with an in-process `SchemaLink` (server-only), `useSuspenseQuery` on the client. | 3 h | 11.3 | LHCI LCP gate passes |
| N4 | Phone bulk selection: a "Select" mode toggle in the toolbar, like Mail's Edit mode. | 1.5 h | 8.3 | E2E on phone |
| N5 | Playwright visual regression: screenshots of 4 screens × 3 viewports, committed baselines. | 1.5 h | 11.2 | Runs in CI |
| N6 | Storybook for `components/ui`, deployed as a static site. | 3 h | 4.2 | Public Storybook link in the README |
| N7 | Standalone API: Dockerfile for `@modqueue/api` + a compose service. | 1.5 h | 2.5 | `docker compose up` serves Sandbox |
| N8 | GraphQL hardening: depth limit (8), alias limit, simple rate limit on mutations. | 1.5 h | 2.5 | Integration tests |
| N9 | Neon branch per preview deployment through the Vercel–Neon integration. | 1 h | 5.1 | Each PR has its own database |
| N10 | Density A/B test (compact vs comfortable) through `useFlag()`, without flicker, measured by time to action. | 3 h | 7.2 | Variant stored and visible in Health |
| N11 | Analytics: client events + Web Vitals stored in Postgres, with a metrics panel. | 3 h | 10.2 | Panel shows real data |
| N12 | Mod log row virtualization. | 1.5 h | 10.1 | ≤ 60 rows in the DOM |
| N13 | Reason editor: "Insert placeholder" buttons + drag-free reordering (up/down buttons). | 1 h | 9.3 | Tests |
| N14 | Pre-commit hooks (`simple-git-hooks` + `lint-staged`) and `knip` for unused code. | 0.5 h | 1.2 | Runs on commit |
| N15 | Auth.js with GitHub sign-in and roles (moderator / admin). Post-v1. | 4 h+ | all | — |

Bugs deferred from the bug bash (task 12.1) are added below this table with the IDs B1, B2, ….
