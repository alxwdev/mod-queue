# Conventions and Definition of Done

## Code conventions

- **TypeScript strict** everywhere. No `any`, no `@ts-ignore`; `@ts-expect-error` only in tests and only with a reason.
- **Files**: kebab-case (`queue-list.tsx`) exporting PascalCase components and camelCase functions. Named exports only, except where a default export is required (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, config files). Route handlers in `route.ts` use named exports (`GET`, `POST`).
- **Imports**: `@/…` alias inside `apps/web/src`; packages by name (`@modqueue/shared`). No barrel files inside `apps/web` (better tree-shaking, clearer ownership). `@modqueue/api` may be imported only in `apps/web/src/server/**` and `apps/web/src/app/api/**` (ESLint `no-restricted-imports`); those modules start with `import 'server-only'`.
- **Features**: a feature may import another feature's root files and GraphQL documents (its public surface), never its `components/`, `hooks/` or `lib/` folders.
- **Client/server**: `'use client'` only on components that need it (screens, providers, interactive UI). Pages and layouts stay server components.
- **GraphQL documents**: written with `graphql()` from `@/gql` in the feature's `*.graphql.ts` file ([structure.md](structure.md)). Fragments are colocated with the component that renders them. Operation names are unique and PascalCase (`Queue`, `ApproveContent`).
- **Styling**: Tailwind utilities with semantic token names only (`bg-surface`, `text-fg-muted`), values from [design.md](design.md). No raw hex colours in components. Variants through `cva`; class merging through `cn()`.
- **Accessibility in every UI task**: semantic HTML first, ARIA only where needed; every interactive element reachable and operable by keyboard; visible focus (`outline`, so it works in forced-colors mode); labels on every form control; touch targets ≥ 24 px (≥ 44 px in the phone bottom bar).
- **Errors**: never swallow errors. User-facing errors are short and say what to do next. Unexpected errors go to Sentry.
- **Tests**: colocated `*.test.ts(x)`; API integration tests `*.int.test.ts`; E2E in `apps/web/e2e/*.spec.ts`. Test behaviour, not implementation (RTL queries by role and name).
- **Comments**: explain *why*, not *what*. Every exported hook and service function has a one-line JSDoc.
- **Dependencies**: only the libraries listed in this plan. A new dependency needs a one-line reason in `docs/ai-log.md`.

## Definition of Done (every task)

- [ ] The task's "Done when" line is true and every test listed in the task exists.
- [ ] `pnpm check` is green (format, lint, typecheck, unit + integration tests).
- [ ] New logic has tests; new UI has a jest-axe test with no violations.
- [ ] Touched UI works by keyboard alone and at 320, 768 and 1280 px widths without horizontal page scroll.
- [ ] No `console.log`, no dead code, no TODO without a backlog ID.
- [ ] Docs updated when behaviour or a decision changed (README section, ADR, `docs/architecture.md`).
- [ ] A 2–4 line entry in `docs/ai-log.md`: task ID, what the agent did, what the review changed.

## Definition of Done (every day)

- [ ] All Must tasks of the day meet the task Definition of Done.
- [ ] The day's demo (listed at the top of each day file) works in the browser.
- [ ] The day's pull request is open and CI is green on it (from Day 2 on).
- [ ] The Vercel preview of the pull request works (from Day 5 on).
- [ ] The pull request is merged into `main`; from Day 5 on, the production URL still works after the merge.
