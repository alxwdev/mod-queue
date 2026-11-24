# Day 6: Filters, preview, queue state

**Goal:** browse 10,000+ reports with filters, sorting and a preview on all three layouts; the pure state modules for actions are ready.
**Complexity:** High · **Must:** 5.75 h · **Branch:** `day-06-filters-preview-state`
**Demo:** filter to "Spam, Posts, Budget Travel", reload, the state is kept; open an item at phone width and close it with Back.
**Read first:** [conventions.md](conventions.md), [architecture.md](architecture.md) ("Frontend architecture"), [design.md](design.md); [api.md](api.md) ("Queue ordering" and "Age filter" rules) for 6.4.

All paths below are inside `apps/web/src/features/queue/` unless they start with `apps/` or `lib/`.

## 6.1 Filters and sort
Must · M · 1.25 h · Depends on: 5.2, 5.4, 4.2

Steps:
1. `components/queue-toolbar.tsx`: count ("10,512 reports", `Intl.NumberFormat`), `queue-filters.tsx` with the filter menus (Reason, Type, Community: DropdownMenu checkbox items; Age, Sort: radio items), `filter-chips.tsx` (each chip is a button "Remove filter: Spam"), "Clear all".
2. Below `md`: one "Filters" button that opens a `Sheet` with the same controls as fieldsets, and an Apply button.
3. A filter change scrolls the list to the top, sets the first item active, and announces "Showing N reports" when the results arrive.

Files: `components/{queue-toolbar.tsx,queue-filters.tsx,filter-chips.tsx,queue-toolbar.test.tsx}` (new); `components/queue-screen.tsx` (modify).
Tests: picking a reason updates `window.location.search` and the request variables (assert in the MSW handler); chips remove filters; "Clear all" resets the URL; the announcement text after results arrive; phone mode shows the Filters sheet and applies on Apply; axe.
Done when: the tests are green; the day's filter demo works in the browser.

## 6.2 Preview pane and responsive containers
Must · M · 2 h · Depends on: 5.4, 3.1, 4.2

Steps:
1. `components/preview-pane.tsx` (`contentId`): `ContentPreview` query; sections with headings: header (type, community, author, posted time, status badge), content (title, `whitespace-pre-wrap` body, "Reply to: …" for comments), `report-summary.tsx` (counts per reason + up to 5 latest notes), `author-history.tsx` (removals, bans, active-ban badge, last 10 actions), an action bar slot (wired in task 7.2). Skeleton with a fixed layout; error state. If the item is no longer pending, show "Approved by mod_birch" and disable actions.
2. Prefetch: when the active item changes, `client.query` the next item's preview with `fetchPolicy: 'cache-first'` (fire and forget).
3. `lib/hooks/use-media-query.ts` + `lib/hooks/use-layout-mode.ts` (`desktop` ≥ 1024, `tablet` ≥ 768, otherwise `phone`; server snapshot `desktop`).
4. `components/item-sheet.tsx`: tablet = `Sheet side="right"` (`min(32rem, 90vw)`); phone = `Sheet side="full"` with the bottom action bar slot. Opening on tablet/phone pushes `?item=<id>`; closing with the X button or `Esc` goes back in history if we pushed, else replaces. The sheet title gets focus when it opens; on close, focus returns to the row.
5. `components/queue-screen.tsx` puts it all together: CSS grid on desktop, inline preview only when `layoutMode === 'desktop'`.

Files: `components/{preview-pane.tsx,report-summary.tsx,author-history.tsx,item-sheet.tsx,preview-pane.test.tsx,item-sheet.test.tsx}`, `apps/web/src/lib/hooks/{use-media-query.ts,use-layout-mode.ts,use-layout-mode.test.ts}` (new); `components/queue-screen.tsx`, `apps/web/src/test/msw/handlers.ts` (modify: default `ContentPreview` handler).
Tests: sections render from MSW data; a handled item shows "Approved by …" and disabled actions; in tablet mode (mocked matchMedia) a click opens a dialog, `Esc` closes it and focus returns to the row; in phone mode the `item` parameter appears and Back closes the sheet; `useLayoutMode` returns the three modes; axe.
Done when: all three layouts work in the browser at 1280, 800, 375 and 320 px.

## 6.3 Queue reducer
Must · M · 1.25 h · Depends on: 5.4

Pure module `lib/queue-reducer.ts` (write the tests first):

```ts
export interface QueueUiState { activeId: string | null; selectedIds: ReadonlySet<string> }
export type QueueUiAction =
  | { type: 'itemsChanged'; ids: readonly string[] }      // list changed (filters, pages, evictions)
  | { type: 'move'; delta: 1 | -1; ids: readonly string[] }
  | { type: 'moveTo'; position: 'first' | 'last'; ids: readonly string[] }
  | { type: 'activate'; id: string }
  | { type: 'toggleSelect'; id: string }
  | { type: 'selectAll'; ids: readonly string[]; limit: number }
  | { type: 'clearSelection' }
  | { type: 'removeItems'; removedIds: readonly string[]; ids: readonly string[] } // ids = order BEFORE removal
  | { type: 'restoreItems'; restoredIds: readonly string[] };
export function getNextActiveId(ids: readonly string[], removed: ReadonlySet<string>, activeId: string | null): string | null;
export function queueReducer(state: QueueUiState, action: QueueUiAction): QueueUiState;
```

Rules: `move` stops at the ends (no wrap-around); `removeItems` picks the first not-removed id after the active one, else the nearest before it, else `null`, and drops removed ids from the selection; `itemsChanged` keeps the active id if it is still there, otherwise the item now at its old index, otherwise the first one, and drops selected ids that are no longer loaded; `selectAll` selects the first `limit` ids, or clears if they are all selected already; `restoreItems` makes the first restored id active.

Hook `hooks/use-queue-state.ts` wraps `useReducer` and dispatches `itemsChanged` when `items` change. `queue-screen.tsx` uses it instead of its local state.

Files: `lib/{queue-reducer.ts,queue-reducer.test.ts}`, `hooks/{use-queue-state.ts,use-queue-state.test.ts}` (new); `components/queue-screen.tsx` (modify).
Tests: table-driven for every rule and edge case (empty list; remove the last item; remove a block with the active item in the middle; remove items that are not next to each other; `activeId` null; `selectAll` at the limit and as a toggle); the hook dispatches `itemsChanged` when the list changes.
Done when: every rule above has at least one test row and all are green.

## 6.4 Queue cache helpers
Must · M · 1.25 h · Depends on: 5.3

Steps:
1. `lib/queue-sort.ts`: `compareQueueItems(sort)` matching the server order exactly ([api.md](api.md), "Queue ordering").
2. `lib/queue-filter-match.ts`: `matchesQueueFilter(item, filter, now)` (reasons via `reasonCounts`, types, community slug, age).
3. `lib/queue-cache.ts`:
   - `readQueueItems(cache, ids)`: returns the `QueueItemFields` data of each id that is in the cache. Task 7.1 calls it **before** an action to take the snapshots for undo.
   - `removeFromQueue(cache, ids)`: one `cache.modify` on `ROOT_QUERY.queue` that removes matching edges from **every** stored variant (use `readField`) and lowers `totalCount` by the number removed from that variant.
   - `restoreToQueue(cache, variables, items, now)`: for the current variant only, `cache.updateQuery` reads the list, inserts each matching item at its sorted position (skips it if it would land after the last loaded item while `hasNextPage` is true), raises `totalCount`, and writes it back. `items` are full `QueueItemFields` objects, so it works for items that are no longer in the cache.
   - `evictQueueAggregates(cache)`: `cache.evict({ id: 'ROOT_QUERY', fieldName: 'queueHealth' })`, the same for `modLog`, then `cache.gc()`. Called only for real (non-optimistic) results. Note: `gc()` also drops `Content` objects that are no longer referenced, which is why undo uses snapshots.

Files: `lib/{queue-sort.ts,queue-sort.test.ts,queue-filter-match.ts,queue-filter-match.test.ts,queue-cache.ts,queue-cache.test.ts}` (new).
Tests with a real `InMemoryCache` + type policies: removal from two variants; `totalCount`; restore position for each sort; restore skips items that do not match the filter; restore skips items beyond the loaded page; restore works for an item that was removed and garbage-collected; `readQueueItems` returns complete fragments. Comparator and matcher: one table per sort and per filter field.
Done when: the tests are green.

## End of the day

**Owner**: check the preview at the four widths, commit, push, merge the pull request when CI is green.
