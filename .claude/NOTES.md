# Notes for later tasks

What a later task must know or do. Each heading is the ID of the task that its notes are for; "General tips" applies to every task. The brackets name the task that wrote the note.

## General tips

- If an MSW update adds another dependency that ships only ES modules, the web tests fail with "Must use import to load ES Module". Add the package to `esmPackages` in `apps/web/jest.config.ts`. (from 2.1)
- `pnpm test:e2e` tests the last `pnpm build`: after a code change, build first. (from 2.2)
- If `pnpm install` warns "Ignored build scripts" for a new package, stop and ask the owner to run `pnpm approve-builds`. Do not add the package to `ignoredBuiltDependencies` by hand: pnpm then keeps the old entry in `node_modules/.modules.yaml` and repeats the warning. After the owner's choice, add the comment that says why the package needs no build. (from 2.4)
- `next.config.ts` loads the root `.env`, and Next.js does not watch that file: after a change to `.env`, restart `pnpm dev`. (from 2.5)
- `testPrisma` emits Prisma query events: count the SQL queries of an operation with `testPrisma.$on('query', …)`. A listener cannot be removed, so keep its counter in the test. Prisma batches the `findUnique` calls of one tick into one query, so a throwaway N+1 check needs another query, such as `findFirst`. (from 3.1)
- In test files, ESLint's `testing-library/render-result-naming-convention` takes a variable that holds the result of any `render…` function, also `renderTemplate`, for a render result: `const message = renderTemplate(…)` fails lint. Call the function inline. (from 3.2)
- In tests, `@typescript-eslint/no-unsafe-assignment` fails on `expect.any(…)` and `expect.objectContaining(…)` as the value of an object property (`{ batchId: expect.any(String) }`); in an array (`[expect.any(String)]`) they pass. Use `toMatchObject` with plain values, or `toHaveProperty('a.b', expect.any(String))`. (from 3.2)

## 2.4

- `README.md` starts the app with `pnpm --filter @modqueue/web dev`, because the root `dev` script did not exist yet. Change this line to `pnpm dev`. (from 2.3)

## 2.5

- Next.js reads `.env` files only from `apps/web/`, so the app does not see the root `.env`. Decide how `getPrisma()` gets `DATABASE_URL` locally. (from 1.4)
- The Prisma generator has `moduleFormat = "cjs"`, because Jest's CommonJS mode cannot load the ES-module runtime. Check that this CJS client works in Next.js. (from 1.5)

## 3.1

- `src/loaders.ts` already has all six loaders. `reasonCounts` counts all reports of a content, so the sum equals `reportCount`; `authorStats` counts each REMOVE action as one removal and each BAN batch as one ban; `activeBans` returns the latest ban among the bans that are permanent or not expired at `now()`. (from 2.5)
- `testPrisma` emits no query events, because `createPrismaClient` sets no `log` option. The test "a page of 50 runs ≤ 6 SQL queries" needs another way to count the queries. (from 2.5)

## 3.3

- `@modqueue/shared` has `findUnknownPlaceholders(template)`: it returns each unknown name once, without the braces. Any text between double braces is a placeholder, so `{{ username }}` (with spaces) is unknown. `zod` is already a dependency of `@modqueue/shared`. (from 3.2)

## 3.4

- A `totalCount` field resolver needs a codegen mapper for its connection type: `codegen.ts` maps `ContentConnection` to `QueueConnection` of `queue-service.ts`, which carries the filter. `src/lib/cursor.ts` has `encodeCursor`, `decodeCursor`, `invalidCursor` and `clampFirst`. (from 3.1)
- `Author.history` returns `ModAction` rows: their fields `moderator`, `content` and `author` fail until this task adds their resolvers. (from 3.1)

## 3.5

- `countQueue(ctx, null)` in `queue-service.ts` counts the visible pending items: the `pendingCount` of the summary. (from 3.1)

## 4.1

- `globals.css` removes Tailwind's own colours, text sizes, radii and shadows: `bg-white`, `text-2xl`, `rounded-xl` and `shadow-xl` give no CSS. The tokens and their utilities are in `docs/design-tokens.md`. (from 2.6)
- `@theme inline` does not put `--color-*` variables on `:root`: `var(--color-focus)` (the focus ring rule in `design.md`) is undefined at runtime. Use the utilities (`outline-focus`) or the `:root` variables (`var(--focus)`). (from 2.6)
- Check that `tailwind-merge` in `cn()` knows the custom utilities `duration-fast`, `duration-base`, `z-sticky`, `z-overlay`, `z-dropdown` and `z-toast`. If it does not, `cn('duration-fast', 'duration-base')` keeps both classes: extend its config (`extendTailwindMerge`) and test the merge. (from 2.6)

## 4.3

- Apollo Client 4 needs `graphql` as a peer dependency. Add `graphql` 16.15.0 to `@modqueue/web`, not 17 (`latest`): Apollo Server 5 needs `^16.11.0`, and the repo must keep one copy of `graphql`. (from 2.4)
- `client-preset` 7 generates types only for the operations and fragments in the documents. `@/gql/graphql` has no type for every schema type, and an enum union exists only when a document uses that enum. For enum values in UI code, use the constants of `@modqueue/shared`. (from 2.4)

## 4.4

- The four stub pages in `apps/web/src/app/(console)/` wrap their `<h1>` in `<main>`, so the axe checks find a main landmark. Remove these `<main>` elements when `AppShell` adds `main#main`. (from 1.3)
- The API compares the value of the cookie `mq_moderator` as it is, without URL decoding: write the plain username. The header `x-moderator` wins over the cookie, so the app must not send that header. (from 2.5)

## 5.1

- `route.test.ts`: mock `@modqueue/api` with a factory (`jest.mock('@modqueue/api', () => ({ … }))`). A plain import, `jest.mock` without a factory (automock) or `jest.requireActual` loads the real package. Its seed imports faker 10, which ships only ES modules, and the web test fails with "Must use import to load ES Module: …@faker-js/faker…". If a test needs the real package, add `@faker-js/faker` to `esmPackages` in `apps/web/jest.config.ts`. Checked with throwaway web Jest tests on 2026-11-26. (from 1.6)
- `reportError(error, { operationName })` in `src/server/graphql.ts` gets the original error of a resolver, and also a failed context (for example, the database is down) with `operationName: null`. Apollo does not log these errors, so until Sentry is connected they appear only in the responses. (from 2.5)

## 6.4

- The API orders `id` as Postgres orders `uuid`: by bytes, which is the order of the lowercase hex strings that the API returns. In `compareQueueItems`, compare ids with `<` and `>`, not with `localeCompare`. (from 3.1)

## 7.1

- `approveContent`, `removeContent` and `banAuthor` return the `results` in the order of the input ids. The `content` of a result is `null` only for `NOT_FOUND`; `handledBy` can also be `null` for `ALREADY_HANDLED` (an item without a non-undone action). (from 3.2)
- `undoModeration` gives `NOT_FOUND` for a batch that is already undone, also when a parallel undo of the same batch won: handle it like `UNDO_EXPIRED` and `FORBIDDEN`. `restored` has no defined order and holds only the items that still had the status that the batch set. (from 3.2)

## 9.1

- `removeInputSchema` and `banInputSchema` turn a missing, null or blank `messageToUser` into `null`. `banInputSchema` requires `durationDays` (`null` = permanent): `toBanInput` must always set it. (from 3.2)

## 9.2

- `message-preview.tsx`: fill `{{duration}}` with `formatBanDuration(durationDays)` of `@modqueue/shared` only in ban mode, as the API does. In remove mode the API leaves `{{duration}}` as it is. `{{community}}` is the community name, `{{reason}}` the title of the removal reason. (from 3.2)

## 9.3

- `removalReasonSchema` trims `title` and `messageTemplate`, so its input and output types differ: with `zodResolver`, send the parsed (trimmed) values. The API returns `fieldErrors` with the keys `title` and `messageTemplate`: map them to the form fields with `setError`. `updateRemovalReason` and `archiveRemovalReason` give `NOT_FOUND` for an unknown id; archiving an archived reason returns it unchanged. New reasons go to the end of the list (highest `sortOrder` + 1). (from 3.3)

## 10.4

- `route.test.ts`: mock `@modqueue/api` with a factory (`jest.mock('@modqueue/api', () => ({ … }))`). A plain import, `jest.mock` without a factory (automock) or `jest.requireActual` loads the real package. Its seed imports faker 10, which ships only ES modules, and the web test fails with "Must use import to load ES Module: …@faker-js/faker…". If a test needs the real package, add `@faker-js/faker` to `esmPackages` in `apps/web/jest.config.ts`. Checked with throwaway web Jest tests on 2026-11-26. (from 1.6)

## 11.4

- Coverage thresholds apply only when `COVERAGE_THRESHOLDS=1` (all three Jest configs). Set it for `pnpm test:coverage` in CI. (from 1.5, 2.1)
- An enforced run fails when a threshold path matches no files ("Coverage data for ./src/\*\*/hooks/\*\* was not found"). In `apps/web`, a glob threshold applies to each matching file. (from 1.5, 2.1)
