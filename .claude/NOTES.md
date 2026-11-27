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
- The focus ring is one global `:focus-visible` rule in `globals.css` (2 px `--focus` outline, offset 2 px). Components add no outline classes; an element that needs another offset overrides it with a utility (`-outline-offset-2`). (from 4.1)
- In Jest, a Radix RadioGroup selects an item on an arrow key only while the key is down, and Radix moves the focus in a timeout: `user.keyboard('{ArrowDown}')` moves the focus but selects nothing. Hold the key: `await user.keyboard('{ArrowDown>}')`, then `await user.keyboard('{/ArrowDown}')`. (from 4.1)
- Every `Tooltip` and `IconButton` needs a `TooltipProvider` (`components/ui/tooltip.tsx`, 400 ms delay) above it, or Radix throws. Until `renderWithProviders` has it (task 4.4), render with `{ wrapper: TooltipProvider }`. (from 4.1)
- `Dialog` and `Sheet` have an `IconButton` (Close), so they need a `TooltipProvider` too. `ToastProvider` brings its own for the Close buttons of the toasts. (from 4.2)
- In Jest, while a Radix `Dialog`, `AlertDialog` or `Sheet` is open, Radix sets `aria-hidden` on the rest of the page: `getByRole` finds an element there only with `{ hidden: true }`. After a close, Radix moves the focus in a timeout: check a focus that `onCloseAutoFocus` sets inside `waitFor`. (from 4.2)
- Radix Toast checks `event.code` for its `F8` key, and `user.keyboard('{F8}')` sends no code: press `user.keyboard('[F8]')`. Radix writes the text of a toast announcement (`role="status"`) on the next frame: check it inside `waitFor`. (from 4.2)
- `jest.mock('@/…')` fails with "Cannot find module": SWC resolves the `@/` alias only in imports, and the web Jest config has no `moduleNameMapper` for it. Give `jest.mock()` a relative path. (from 4.3)
- Codegen leaves out `apps/web/src/**/*.test.{ts,tsx}` (owner's choice in 4.3). A test that needs its own GraphQL document writes it with `gql` from `@apollo/client` and a hand-written `TypedDocumentNode` type; a feature test imports the feature's documents. (from 4.3)
- The codegen watcher of `pnpm dev` does not reload `codegen.ts`: after a change to it, restart `pnpm dev`, or the watcher keeps writing the old output into `apps/web/src/gql/`. (from 4.3)
- An MSW `graphql.query()` resolver must return a GraphQL body (TypeScript checks it). For a response that is not GraphQL, such as a 502 with text, use `http.post('/api/graphql', …)`. (from 4.3)
- `renderWithProviders` wraps the UI in `Providers` of `app/providers.tsx` (Apollo, Settings, Announcer, Toast, Tooltip): a test needs no `TooltipProvider` or `ToastProvider` of its own. Jest runs no App Router, so `usePathname()` returns `null`: a test of a component that uses it mocks it, as `app-shell.test.tsx` does (`jest.mock('next/navigation', () => ({ usePathname: () => window.location.pathname }))`). (from 4.4)
- A test that renders `AppShell` or `ModeratorSwitcher` sends the `ModeratorSwitcher` query: add an MSW handler for it (`app-shell.test.tsx` has one). (from 4.4)
- After `client.resetStore()`, the `data` of `useQuery` is `undefined` until the refetch returns. A control that keeps the focus (a menu trigger) must render from `data ?? previousData`, or it unmounts and the focus falls to `body`. (from 4.4)
- `useAnnounce()` of `components/feedback/announcer.tsx` returns `announce(message, 'polite' | 'assertive')`; a second message in the same frame replaces the first. The regions have an explicit `aria-live`, so they are read also while a Radix dialog or sheet is open. (from 4.4)
- With a `DropdownMenu` open, axe's best-practice rule `region` flags the Radix popper wrapper, which is outside the landmarks; the WCAG tags pass. `AxeBuilder` runs the best-practice rules by default: an E2E axe check with an open menu needs `.withTags([...])` or `.disableRules(['region'])`. (from 4.4)

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
- `/dev/ui` wraps its "Components" section in its own `TooltipProvider`. When `providers.tsx` adds the Tooltip provider to the root layout, remove that wrapper from `app/dev/ui/page.tsx`. (from 4.1)
- `/dev/ui` wraps its Toast example in its own `ToastProvider`. When `providers.tsx` adds the Toast provider, remove that wrapper from `app/dev/ui/page.tsx`. (from 4.2)
- The menu sheet: `Sheet` takes `title` (required), `description`, `side` (`"right"` or `"full"`), `trigger`, `footer`, `open`/`onOpenChange` and `data-hotkeys-scope`. On open, Radix focuses the first control of the body; Close is the last control. (from 4.2)
- `renderWithProviders` passes `ApolloProvider` (`lib/apollo/apollo-provider.tsx`) as the `wrapper` of `render`, so `rerender` keeps the providers. Put all providers into one wrapper component, in the order of step 1. Each render gets its own Apollo client and cache. (from 4.3)
- During server rendering, `useQuery` sends no request: Apollo Client 4 subscribes to a query only in the browser, so the server renders the loading state (`useQuery.js`, `useSyncExternalStore` server snapshot). (from 4.3)

## 5.1

- `route.test.ts`: mock `@modqueue/api` with a factory (`jest.mock('@modqueue/api', () => ({ … }))`). A plain import, `jest.mock` without a factory (automock) or `jest.requireActual` loads the real package. Its seed imports faker 10, which ships only ES modules, and the web test fails with "Must use import to load ES Module: …@faker-js/faker…". If a test needs the real package, add `@faker-js/faker` to `esmPackages` in `apps/web/jest.config.ts`. Checked with throwaway web Jest tests on 2026-11-26. (from 1.6)
- `reportError(error, { operationName })` in `src/server/graphql.ts` gets the original error of a resolver, and also a failed context (for example, the database is down) with `operationName: null`. Apollo does not log these errors, so until Sentry is connected they appear only in the responses. (from 2.5)
- `reportClientError(error: unknown, { operationName })` is in `apps/web/src/lib/monitoring/report-client-error.ts`, not in `error-link.ts` (owner's choice in 4.3): connect Sentry there. `error-link.test.ts` mocks that module, so test the Sentry call in its own test. `operationName` is `undefined` for an anonymous operation. (from 4.3)
- The three error boundaries (`app/error.tsx`, `app/(console)/error.tsx`, `app/global-error.tsx`) call `reportClientError(error, { operationName: undefined })`: Sentry in `report-client-error.ts` covers them too. (from 4.4)

## 5.4

- Queue rows set the focus ring offset to `-2px` (`design.md`): add `-outline-offset-2` to the row. The global `:focus-visible` rule in `globals.css` gives the rest of the ring. (from 4.1)
- The shell is an app frame (owner's choice in 4.4): `main#main` (`overflow-y-auto`, `p-4 md:p-6`) is the only scroll container of the page and has a fixed height. The queue screen fills it with `h-full`; its list and preview scroll inside. (from 4.4)

## 6.1

- A `DropdownMenuCheckboxItem` closes the menu when it is selected (Radix default). To keep a filter menu open for several choices, call `event.preventDefault()` in its `onSelect`. `DropdownMenu` is not modal (owner's choice in 4.2): a click outside closes the menu and also reaches the control under the pointer. (from 4.2)

## 6.2

- Radix's focus trap in `Sheet` skips a scroll container without focusable content: if the body holds only text, the keyboard cannot scroll it, and axe in the browser reports `scrollable-region-focusable` (owner's choice in 4.2: `Sheet` stays as it is). If the ItemSheet body can hold only text, give the body `tabIndex={0}` and a name (a new `Sheet` prop), or make sure the body has a control. (from 4.2)
- `Sheet` passes no `onOpenAutoFocus` or `onCloseAutoFocus` yet. To focus the sheet title on open, add `onOpenAutoFocus` to `Sheet` (prevent the default, then focus the title; the title needs `tabIndex={-1}`). (from 4.2)
- `Sheet` now passes `onOpenAutoFocus` (added in 4.4 for the menu sheet: Radix skips links when it focuses the first control on open). (from 4.4)

## 6.4

- The API orders `id` as Postgres orders `uuid`: by bytes, which is the order of the lowercase hex strings that the API returns. In `compareQueueItems`, compare ids with `<` and `>`, not with `localeCompare`. (from 3.1)

## 7.1

- `approveContent`, `removeContent` and `banAuthor` return the `results` in the order of the input ids. The `content` of a result is `null` only for `NOT_FOUND`; `handledBy` can also be `null` for `ALREADY_HANDLED` (an item without a non-undone action). (from 3.2)
- `undoModeration` gives `NOT_FOUND` for a batch that is already undone, also when a parallel undo of the same batch won: handle it like `UNDO_EXPIRED` and `FORBIDDEN`. `restored` has no defined order and holds only the items that still had the status that the batch set. (from 3.2)

## 7.4

- `useSettings()` of `features/settings/use-settings.ts` returns `{ shortcutsEnabled, theme, updateSettings(patch) }`; the settings are saved in localStorage under `modqueue:settings`. (from 4.4)

## 7.5

- `SettingsMenu` is a `DropdownMenu` with one `DropdownMenuCheckboxItem` "Single-key shortcuts" (owner's choice in 4.4); add the item that opens the dialog there. The item closes the menu when it is selected (Radix default). (from 4.4)
- At 320 px the header has about 10 px free. A header button "Keyboard shortcuts" next to the switcher must be an `IconButton` (32 px), and the switcher then cuts "mod_aurora" with an ellipsis; check the header at 320 px. (from 4.4)

## 9.1

- `removeInputSchema` and `banInputSchema` turn a missing, null or blank `messageToUser` into `null`. `banInputSchema` requires `durationDays` (`null` = permanent): `toBanInput` must always set it. (from 3.2)

## 9.2

- `message-preview.tsx`: fill `{{duration}}` with `formatBanDuration(durationDays)` of `@modqueue/shared` only in ban mode, as the API does. In remove mode the API leaves `{{duration}}` as it is. `{{community}}` is the community name, `{{reason}}` the title of the removal reason. (from 3.2)
- `Dialog` renders `footer` outside its `children`: a submit button in the footer needs `form={formId}` of the form in the body. `Dialog` passes `onCloseAutoFocus` through, so `focusAfterDialog` runs there after `event.preventDefault()`. On open, Radix focuses the first control of the body; the Close button is the last control. (from 4.2)

## 9.3

- `removalReasonSchema` trims `title` and `messageTemplate`, so its input and output types differ: with `zodResolver`, send the parsed (trimmed) values. The API returns `fieldErrors` with the keys `title` and `messageTemplate`: map them to the form fields with `setError`. `updateRemovalReason` and `archiveRemovalReason` give `NOT_FOUND` for an unknown id; archiving an archived reason returns it unchanged. New reasons go to the end of the list (highest `sortOrder` + 1). (from 3.3)
- `AlertDialog` takes `confirmLabel`, `confirmVariant` (`"danger"` for archive) and `onConfirm`; Cancel is built in. The confirm button always closes the dialog, so an archive error must show as a toast. (from 4.2)

## 10.1

- `modLog` filters `from <= createdAt < to`: `from` is inclusive, `to` exclusive. For a date range from `<input type="date">`, send the start of the first day as `from` and the start of the day after the last day as `to`. (from 3.4)
- `filter.search` is trimmed; a blank search filters nothing. Over 100 characters after trimming gives `BAD_USER_INPUT` with `fieldErrors['filter.search']`, so give the input `maxLength={100}`. `%`, `_` and `\` are plain characters. (from 3.4)

## 10.2

- `reportsPerHour(hours)` returns exactly `hours` UTC buckets, oldest first; the last bucket is the current hour and is incomplete, so a lower last value is not a drop. `medianTimeToAction(days)` returns exactly `days` UTC days that end with today (also incomplete); `topReasons(days)` counts the same days. The API clamps `hours` to 1..168, `days` to 1..30 and `limit` to 1..10. Each `QueueHealth` field is a field resolver, so a query for `summary` alone runs no chart queries. (from 3.5)

## 10.3

- `main-nav.tsx` renders each link as icon + label: the badge goes after the label (`ml-auto` puts it at the right edge of the sidebar). `MainNav` renders twice: in the bar and sidebar (`variant="shell"`) and in the phone menu sheet (`variant="sheet"`), so the badge shows in both. (from 4.4)

## 10.4

- `route.test.ts`: mock `@modqueue/api` with a factory (`jest.mock('@modqueue/api', () => ({ … }))`). A plain import, `jest.mock` without a factory (automock) or `jest.requireActual` loads the real package. Its seed imports faker 10, which ships only ES modules, and the web test fails with "Must use import to load ES Module: …@faker-js/faker…". If a test needs the real package, add `@faker-js/faker` to `esmPackages` in `apps/web/jest.config.ts`. Checked with throwaway web Jest tests on 2026-11-26. (from 1.6)

## 11.4

- Coverage thresholds apply only when `COVERAGE_THRESHOLDS=1` (all three Jest configs). Set it for `pnpm test:coverage` in CI. (from 1.5, 2.1)
- An enforced run fails when a threshold path matches no files ("Coverage data for ./src/\*\*/hooks/\*\* was not found"). In `apps/web`, a glob threshold applies to each matching file. (from 1.5, 2.1)
