# Day 4: Design system, Apollo Client, app shell

**Goal:** our own accessible components, the Apollo client and the responsive shell.
**Complexity:** Medium · **Must:** 6.75 h · **Branch:** `day-04-design-system-shell`
**Demo:** `/dev/ui` shows every component and state; the shell works at 320, 768 and 1280 px; switching the moderator announces "Now acting as mod_birch".
**Read first:** [conventions.md](conventions.md), [design.md](design.md), [architecture.md](architecture.md) ("Frontend architecture": routes, state ownership, responsive layout).

Before starting: the owner has approved the palette (task 2.6).

All components live in `apps/web/src/components/ui/`, one file per component, styled with tokens + `cva`; sizes, colours and radii come from [design.md](design.md). Each component gets a section on `/dev/ui` showing every variant and state.

## 4.1 UI kit: controls
Must · L · 2.25 h · Depends on: 2.6, 2.1

| Component | Requirements |
|---|---|
| `cn()` in `lib/cn.ts` | `clsx` + `tailwind-merge` |
| `Button`, `IconButton` | variants primary / secondary / ghost / danger; sizes sm 32 px, md 36 px, lg 44 px; `loading` sets `aria-busy` and keeps the width; `IconButton` requires `label` (typed) and shows a Tooltip |
| `Kbd` | `<kbd>` styled with tokens |
| `Badge` | neutral / accent / success / warning / danger |
| `Checkbox` | Radix; supports `indeterminate`; label prop |
| `Switch`, `RadioGroup` | Radix, with labels and descriptions |
| `Tooltip` | Radix; 400 ms delay; never the only place for information |
| `Field`, `Input`, `Textarea`, `Select` | `Field` wires `id`, `aria-describedby` and `aria-invalid` for its child; `Select` is a styled native `<select>` |
| `Skeleton`, `Spinner`, `VisuallyHidden` | skeletons have fixed sizes; the spinner has a label |

Files: `apps/web/src/lib/cn.ts`, `apps/web/src/components/ui/{button,icon-button,kbd,badge,checkbox,switch,radio-group,tooltip,field,input,textarea,select,skeleton,spinner,visually-hidden}.tsx` and one `*.test.tsx` per component (new); `apps/web/src/app/dev/ui/page.tsx` (modify).
Tests (one file per component): renders with its accessible name; key keyboard behaviour (Button activates with `Enter` and `Space` and not while `loading`; Checkbox toggles with `Space`; Switch toggles; RadioGroup moves with arrow keys; `Field` links the error text through `aria-describedby`); `axe` has no violations.
Done when: every component and state from the table is on `/dev/ui`; the page has no horizontal scroll at 320 px; components contain no raw colour values; all tests pass.

## 4.2 UI kit: overlays
Must · L · 2.25 h · Depends on: 4.1

| Component | Requirements |
|---|---|
| `Dialog`, `AlertDialog` | Radix; required `title`, optional `description`; sizes; full-screen below `md`; passes `onCloseAutoFocus` through |
| `Sheet` | Radix Dialog; `side="right"` (tablet) or `"full"` (phone); sticky header and footer slots; accepts `data-hotkeys-scope` |
| `DropdownMenu` | Radix; item, checkbox item, radio group, separator, label |
| `Toast` | Radix Toast; `ToastProvider` + viewport (bottom-right on desktop, above the bottom bar on phone); `useToast().show({ title, description, variant, action, duration })`; `type="background"` (polite), `"foreground"` for errors |

Files: `apps/web/src/components/ui/{dialog,alert-dialog,sheet,dropdown-menu,toast}.tsx` and one `*.test.tsx` per component (new); `apps/web/src/app/dev/ui/page.tsx` (modify).
Tests (one file per component): Dialog closes on `Esc` and returns focus to its trigger; AlertDialog does not close on an outside click; Sheet keeps focus inside and forwards `data-hotkeys-scope`; DropdownMenu moves with arrow keys and toggles a checkbox item; the Toast action is reachable by keyboard and an error toast is `foreground`; `axe` has no violations with each overlay open.
Done when: every overlay can be opened from `/dev/ui` at 320, 768 and 1280 px; dialogs are full-screen below `md`; all tests pass.

## 4.3 Apollo Client
Must · S · 0.75 h · Depends on: 2.4, 2.1

Steps:
1. `lib/apollo/type-policies.ts`: `Query.fields.queue = relayStylePagination(['filter', 'sort'])`, `Query.fields.modLog = relayStylePagination(['filter'])`.
2. `lib/apollo/error-link.ts`: logs in development; reports network errors and GraphQL errors whose code is not `BAD_USER_INPUT`, `FORBIDDEN`, `UNDO_EXPIRED` or `NOT_FOUND` through a small `reportClientError` function (a no-op until Sentry is wired in task 5.1).
3. `lib/apollo/client.ts`: `createApolloClient()` with `HttpLink({ uri: '/api/graphql', credentials: 'same-origin' })`, the error link, `InMemoryCache({ typePolicies })` and the default fetch policies from [architecture.md](architecture.md) ("Data fetching").
4. `lib/apollo/apollo-provider.tsx` (`'use client'`): creates the client once with `useState(() => createApolloClient())`. Never create the client at module scope on the server.
5. Add the Apollo provider to `renderWithProviders` in `src/test/render.tsx`.

Files: `apps/web/src/lib/apollo/{type-policies.ts,error-link.ts,client.ts,apollo-provider.tsx,type-policies.test.ts,apollo-provider.test.tsx}` (new); `apps/web/src/test/render.tsx` (modify).
Tests: `type-policies.test.ts` with a real `InMemoryCache`: two pages merge; different filters are stored separately; `totalCount` is kept. `apollo-provider.test.tsx`: a component with a `Me` query and an MSW handler renders the username.
Done when: both test files are green.

## 4.4 App shell
Must · M · 1.5 h · Depends on: 4.2, 4.3, 2.5

Steps:
1. Providers (`app/providers.tsx`): Apollo → Settings → Announcer → Toast → Tooltip. Add the same providers to `renderWithProviders`.
2. `SettingsProvider`: `shortcutsEnabled` (default `true`) and `theme` (for N2), persisted through `useLocalStorage` (built on `useSyncExternalStore`, SSR-safe, survives storage errors).
3. `AnnouncerProvider` + `useAnnounce()`: two visually hidden regions (`polite`, `assertive`); the message is cleared, then set on the next frame, so a repeated message is announced again.
4. `AppShell`: skip link ("Skip to main content"), `header` with the product name, `MainNav` (vertical sidebar at `lg`, horizontal bar at `md`, a menu button that opens a `Sheet` below `md`; `aria-current="page"`), `ModeratorSwitcher`, `SettingsMenu` (single-key shortcuts switch; the link to the shortcut help is added in task 7.5), `main#main`. A slot for the pending-count badge on "Queue" (filled in task 10.3).
5. `ModeratorSwitcher`: DropdownMenu radio group from the `moderators` query; selecting writes the cookie `mq_moderator` (path `/`, `SameSite=Lax`, 1 year), calls `client.resetStore()`, and announces "Now acting as mod_birch".
6. `error.tsx` (message + Retry), `not-found.tsx`, `global-error.tsx`; `PageHeader` component; page titles.

Files: `apps/web/src/app/{providers.tsx,error.tsx,global-error.tsx,not-found.tsx}`, `apps/web/src/app/(console)/layout.tsx`, `apps/web/src/components/layout/{app-shell,main-nav,mobile-nav,skip-link,moderator-switcher,settings-menu,page-header}.tsx`, `apps/web/src/components/feedback/{announcer,empty-state,error-state}.tsx`, `apps/web/src/features/settings/{settings-provider.tsx,use-settings.ts}`, `apps/web/src/lib/hooks/use-local-storage.ts`, `apps/web/src/lib/moderator-cookie.ts`, the test files below (new); `apps/web/src/app/layout.tsx`, `apps/web/src/test/render.tsx` (modify).
Tests: `app-shell.test.tsx` (navigation by keyboard; the skip link moves focus to `main`; `aria-current` follows the route; axe on the shell); `moderator-switcher.test.tsx` (selecting a moderator sets the cookie and announces it); `use-local-storage.test.ts` (reads, writes, survives a throwing storage); `announcer.test.tsx` (the same message twice is announced twice).
Done when: no horizontal scroll at 320 px on any stub page; the menu sheet works at phone width; all tests pass.

## End of the day

**Owner**: review `/dev/ui` with all components at 320, 768 and 1280 px against [design.md](design.md). Then commit, push, merge the pull request when CI is green.
