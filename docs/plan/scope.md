# Scope, priorities, assumptions

## Product in one paragraph

ModQueue is a keyboard-first console for community moderators. A moderator works through a queue of reported posts and comments (10,000+ items) in a list + preview layout and handles each item with one key: approve, remove with a reason, or ban the author. Every action is optimistic and can be undone with `z`. Three supporting screens: Mod log (every action, filterable), Queue health (charts), Removal reasons (templates for the remove/ban form). Desktop-first, fully usable on tablet and phone. All data is synthetic.

## Priorities

**Must Have** (inside the 12 days, required for the v1.0.0 release):

- Monorepo, tooling, CI (lint, types, unit + integration, E2E, Lighthouse).
- PostgreSQL + Prisma schema, deterministic seed (10,000+ queue items, plus time-released reports for the next day), daily demo reset.
- GraphQL API: queue with filters, sorting and cursor pagination; content preview with author history; approve / remove / ban (single and bulk, up to 200 items) with conflict detection; undo; mod log; queue health stats; removal reasons CRUD.
- Design tokens and our own UI kit on Radix primitives.
- Responsive app shell: desktop, tablet, phone layouts.
- Queue screen: virtualized list, filters and sort in the URL, preview pane, optimistic actions, undo, bulk actions.
- Keyboard model: shortcuts, roving focus, focus restore, live announcements, shortcut help dialog, "single-key shortcuts on/off" setting.
- Remove and ban form: React Hook Form + Zod, conditional fields, live message preview, one shared schema.
- Mod log screen (TanStack Table, filters in URL, phone cards). Queue health screen (Recharts, code-split, accessible data tables). Removal reasons screen.
- Tests: unit, component (RTL + MSW + jest-axe), API integration, Playwright E2E on desktop, tablet and phone.
- Sentry (client and server), Web Vitals reporting, Lighthouse CI budgets.
- Deployment on Vercel + Neon; README, architecture diagram, ADRs, 2-minute video, "How I built this with AI agents".

**Nice to Have** (only when a day finishes early; ordered backlog in [backlog.md](backlog.md)): live updates (polling, "N new reports" banner, "handled elsewhere" eviction), dark mode toggle, streaming SSR of the first queue page, phone bulk selection, visual regression, Storybook, Docker for the API, GraphQL hardening, Neon branch per preview, density A/B test, analytics, mod log virtualization, Auth.js.

**Out of scope:** paid features (including any LLM feature), authentication in v1, real platform names or branding, i18n.

## Assumptions

- One developer working with an AI coding agent, about 8 focused hours per day: **at most 7 h planned, the rest is buffer**. Estimates include review and fixes.
- 12 working days of Must work, then 2 reserve days (rules in [schedule.md](schedule.md)).
- Windows 11 dev machine with Docker Desktop, Node.js LTS and Git. The GitHub repo is public (free CI minutes).
- Free tiers: Vercel Hobby, Neon Free, Sentry Developer, GitHub Actions.
- Library versions are the current stable majors at project start ([tooling.md](tooling.md)). The agent checks the docs whenever an API differs from this plan.

## Owner prerequisites

| Needed before | What |
|---|---|
| Day 1 | Docker Desktop running; Node.js 24 LTS; Corepack enabled (`corepack enable`); Git; the plan folder copied into the repo as `docs/plan/` (task 1.1) |
| Day 2 (task 2.3) | GitHub account; a public repository for the project |
| Day 2 (task 2.6) | 15 minutes to review the palette on `/dev/ui` |
| Day 5 (task 5.1) | Vercel, Neon and Sentry accounts (free tiers) |
| Day 8 (task 8.4) | NVDA installed |
| Day 12 | A real phone for the manual matrix; OBS, Carnac and ScreenToGif for the video and the GIF |

## Decisions that differ from the original brief

| Original brief said | This plan does | Why |
|---|---|---|
| Thin Apollo Server "deployed as a second Vercel project" | API is a separate workspace package `@modqueue/api`, **mounted in the web app** as the route handler `/api/graphql` (one Vercel project) | Same reasons still hold (same language, free, never sleeps). A second project adds CORS, coordination of preview URLs between two projects and a Deployment Protection bypass, with no benefit for this app. The package is framework-agnostic and also runs standalone (`pnpm dev:api`), so splitting it out later is a small change (N7). |
| TanStack Table + TanStack Virtual "for the queue and mod log" | Queue: TanStack Virtual only (it is an ARIA listbox, not a grid). Mod log: TanStack Table with "Load more" pages; virtualization is N12 | A listbox gains nothing from a table model. The log never holds 10,000 rows in the DOM. |
| Live updates "through SSE or polling" | Polling (15 s); Nice to Have N1 | SSE needs long-lived connections, which serverless functions do not suit. Live updates are also the first feature to cut when time is short. |
| A two-week plan with all tests in the last three days | 12 working days + 2 reserve days; tests are written together with each feature; Days 10–11 are for E2E, performance and accessibility | Tests that come with the feature are cheaper and keep CI green every day. |
| (not specified) | Bulk selection on phone is Nice to Have (N4) | The phone layout only defines a single-item flow. |
| (not specified) | Time-released reports: the seed also creates reports for the next 30 hours and the API hides everything dated after "now" ([api.md](api.md)) | The demo is reset once a day and has no real traffic. Without this, the "last hour" filter is empty most of the day and the hourly chart shows a growing gap. |
