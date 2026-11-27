# Notes for later tasks

What a later task must know or do. Each heading is the ID of the task that its notes are for; "General tips" applies to every task. The brackets name the task that wrote the note.

## General tips

- If an MSW update adds another dependency that ships only ES modules, the web tests fail with "Must use import to load ES Module". Add the package to `esmPackages` in `apps/web/jest.config.ts`. (from 2.1)
- `pnpm test:e2e` tests the last `pnpm build`: after a code change, build first. (from 2.2)

## 2.4

- `README.md` starts the app with `pnpm --filter @modqueue/web dev`, because the root `dev` script did not exist yet. Change this line to `pnpm dev`. (from 2.3)

## 2.5

- Next.js reads `.env` files only from `apps/web/`, so the app does not see the root `.env`. Decide how `getPrisma()` gets `DATABASE_URL` locally. (from 1.4)
- The Prisma generator has `moduleFormat = "cjs"`, because Jest's CommonJS mode cannot load the ES-module runtime. Check that this CJS client works in Next.js. (from 1.5)

## 4.4

- The four stub pages in `apps/web/src/app/(console)/` wrap their `<h1>` in `<main>`, so the axe checks find a main landmark. Remove these `<main>` elements when `AppShell` adds `main#main`. (from 1.3)

## 5.1

- `route.test.ts`: mock `@modqueue/api` with a factory (`jest.mock('@modqueue/api', () => ({ … }))`). A plain import, `jest.mock` without a factory (automock) or `jest.requireActual` loads the real package. Its seed imports faker 10, which ships only ES modules, and the web test fails with "Must use import to load ES Module: …@faker-js/faker…". If a test needs the real package, add `@faker-js/faker` to `esmPackages` in `apps/web/jest.config.ts`. Checked with throwaway web Jest tests on 2026-11-26. (from 1.6)

## 10.4

- `route.test.ts`: mock `@modqueue/api` with a factory (`jest.mock('@modqueue/api', () => ({ … }))`). A plain import, `jest.mock` without a factory (automock) or `jest.requireActual` loads the real package. Its seed imports faker 10, which ships only ES modules, and the web test fails with "Must use import to load ES Module: …@faker-js/faker…". If a test needs the real package, add `@faker-js/faker` to `esmPackages` in `apps/web/jest.config.ts`. Checked with throwaway web Jest tests on 2026-11-26. (from 1.6)

## 11.4

- Coverage thresholds apply only when `COVERAGE_THRESHOLDS=1` (all three Jest configs). Set it for `pnpm test:coverage` in CI. (from 1.5, 2.1)
- An enforced run fails when a threshold path matches no files ("Coverage data for ./src/\*\*/hooks/\*\* was not found"). In `apps/web`, a glob threshold applies to each matching file. (from 1.5, 2.1)
