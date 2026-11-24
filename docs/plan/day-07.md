# Day 7: Actions, optimistic UI, undo; shortcut base

**Goal:** approve single and bulk items instantly, undo them, and roll back cleanly on errors and conflicts; the shortcut registry and the help dialog exist.
**Complexity:** High · **Must:** 6.5 h · **Branch:** `day-07-actions-undo`
**Demo:** approve an item → it disappears at once and a toast offers Undo; Undo puts it back in the same place; with the network offline in DevTools, the item comes back and an error toast appears; `?` opens the shortcut help.
**Read first:** [conventions.md](conventions.md), [architecture.md](architecture.md) ("State ownership", "Keyboard model", "Focus and announcement rules", "Optimistic action flow"), [api.md](api.md) (mutations and the "Moderation", "Undo", "Errors" rules).

Paths in 7.1–7.3 are inside `apps/web/src/features/queue/`; paths in 7.4–7.5 are inside `apps/web/src/features/shortcuts/`.

## 7.1 `useModeration` hook
Must · L · 2.5 h · Depends on: 6.4, 3.2, 4.2

Steps:
1. Mutation documents in `graphql/queue.graphql.ts`: `ApproveContent`, `RemoveContent`, `BanAuthor` (select `batchId results { contentId outcome handledBy { username } content { id status } }`) and `UndoModeration` (`batchId restored { ...QueueItemFields }`).
2. `hooks/use-undo-stack.ts`: in memory, max 20 entries `{ batchId, items, label }`, where `items` are the `QueueItemFields` snapshots taken before the action. Cleared when the moderator changes.
3. `hooks/use-moderation.ts`:

```ts
const moderation = useModeration({ queueVariables });
moderation.approve(ids): Promise<ModerationResult>;
moderation.remove(ids, values: RemoveFormValues): Promise<ModerationResult>;
moderation.ban(ids, values: BanFormValues): Promise<ModerationResult>;
moderation.undoLast(): Promise<UndoResult | null>;
moderation.canUndo: boolean;
```

   - Before the mutation: `readQueueItems(cache, ids)` takes the snapshots.
   - `optimisticResponse`: every id `APPLIED`, `batchId: 'optimistic'`, content status mapped (APPROVED / REMOVED).
   - `update`: `removeFromQueue` for APPLIED and ALREADY_HANDLED ids; for real results also `evictQueueAggregates`.
   - Success: push `{ batchId, items, label }` to the undo stack (only when `batchId` is not null, and only the snapshots of APPLIED ids); toast with the title "Approved" / "Removed 12 items" / "Banned {username}", the description "Press Z to undo" (or "Select Undo to revert" when shortcuts are off), and an Undo action.
   - `ALREADY_HANDLED` results: warning toast "2 items were already handled by mod_birch". `NOT_FOUND`: ignored (logged in development).
   - Error: Apollo drops the optimistic layer by itself; show the error toast "Couldn't approve 1 item. It's back in the queue." with a Retry action that runs the same command again.
   - `undoLast`: pop the stack; the optimistic response is built from the entry's snapshots with status PENDING (not from the cache); `update` calls `restoreToQueue` with the returned items; errors (`UNDO_EXPIRED`, `FORBIDDEN`) give an error toast and drop the entry.
   - `RemoveFormValues` and `BanFormValues` are declared here as the minimal shapes `{ removalReasonId, messageToUser? }` and `{ removalReasonId, messageToUser?, durationDays }`; task 9.1 replaces them with the types inferred from the shared form schema.

Files: `hooks/{use-undo-stack.ts,use-undo-stack.test.ts,use-moderation.ts,use-moderation.test.tsx}` (new); `graphql/queue.graphql.ts`, `apps/web/src/test/msw/handlers.ts` (modify).
Tests (`renderHook` + MSW, the handler waits 300 ms): the item leaves the cache before the response; success pushes one entry with snapshots; a server error brings the item back and shows the error toast, and Retry sends the same variables again; `ALREADY_HANDLED` → warning toast and no stack entry when `batchId` is null; undo restores the item at its sorted position; **undo of a bulk batch whose items were never previewed still restores all of them after `cache.gc()`**; `UNDO_EXPIRED` → error toast and the entry is dropped; the stack keeps at most 20 entries and is cleared when the moderator changes.
Done when: the tests are green.

## 7.2 Action bar, bulk bar, screen wiring
Must · M · 1.25 h · Depends on: 6.3, 7.1, 6.2

Steps:
1. `components/action-bar.tsx`: Approve, Remove…, Ban… buttons with icons, text labels and `aria-keyshortcuts`. In the preview footer on desktop and tablet; a sticky bottom bar (44 px buttons) on phone.
2. `components/bulk-bar.tsx`: visible when the selection is not empty: "12 selected", Approve, Remove…, Ban…, Clear (`Esc`). It covers the toolbar row with the same height, so the list does not move (no CLS). A header checkbox "Select all loaded (max 200)" with an indeterminate state.
3. `QueueScreen.runCommand(kind, targetIds)`: compute the next active id → dispatch `removeItems` → call `moderation.*`. On tablet and phone the open sheet moves to the next item; if there is none, it closes.
4. Remove… and Ban… stay disabled (tooltip "Available after task 9.2") until Day 9.

Files: `components/{action-bar.tsx,action-bar.test.tsx,bulk-bar.tsx,bulk-bar.test.tsx}` (new); `components/{queue-screen.tsx,preview-pane.tsx,item-sheet.tsx,queue-toolbar.tsx}` (modify).
Tests: `action-bar.test.tsx` (three buttons with accessible names; `aria-keyshortcuts` present only while shortcuts are on; Remove… and Ban… disabled); `bulk-bar.test.tsx` (the count text; the header checkbox is indeterminate for a partial selection and selects at most 200; Clear empties the selection); axe for both.
Done when: Approve in the preview removes the item at once and shows a toast with Undo; Undo puts it back at the correct position.

## 7.3 Action flow tests
Must · S · 1 h · Depends on: 7.2

RTL + MSW tests of `QueueScreen` (the MSW handler waits 500 ms, so the optimistic state is visible).

Files: `components/queue-screen.actions.test.tsx` (new).
Tests: approve → the item is gone before the response and the toast text is correct; server error → the item comes back + error toast; Undo → the item is back at its sorted position; `ALREADY_HANDLED` → warning toast; bulk approve of 3 → "Approved 3 items" and the request has 3 ids; on tablet mode the open sheet shows the next item after approve; axe with an open toast.
Done when: the tests are green; line coverage of `features/queue/lib` and `features/queue/hooks` is ≥ 80 %.

## 7.4 Shortcut registry and `useHotkeys`
Must · S · 0.75 h · Depends on: 4.4

Steps:
1. `registry.ts`: `SHORTCUTS` array `{ id, keys, label, group, singleKey }` for every row of the keyboard table in [architecture.md](architecture.md). It is the single source for the hook, the help dialog and `aria-keyshortcuts`.
2. `use-hotkeys.ts`: `useHotkeys(handlers: Partial<Record<ShortcutId, (e: KeyboardEvent) => void>>, { enabled = true })`. One `keydown` listener on `document`. Ignore the event when: `defaultPrevented`; `isComposing`; Ctrl, Meta or Alt is pressed (Shift is allowed only for `?`); the target is editable (`input`, `textarea`, `select`, `[contenteditable]`, `role=textbox|combobox|searchbox`); the target is inside `[role="dialog"]` unless that dialog has `data-hotkeys-scope="queue"`; `e.repeat` for everything except `j`/`k`. Match on `e.key` (layout-aware), lowercase, `?` as is. Single-key shortcuts run only when `settings.shortcutsEnabled` is true.
3. `shortcut-hint.tsx`: renders `<Kbd>` hints only while shortcuts are on.

Files: `registry.ts`, `use-hotkeys.ts`, `use-hotkeys.test.tsx`, `shortcut-hint.tsx`, `registry.test.ts` (new).
Tests: each ignore rule; the setting turns single-key shortcuts off; `j` repeats but `a` does not; a dialog with `data-hotkeys-scope="queue"` lets the keys through; the registry has one entry per row of the keyboard table and no duplicate keys.
Done when: the tests are green.

## 7.5 Shortcut help dialog and on/off setting
Must · S · 1 h · Depends on: 7.4, 4.2, 4.4

Steps:
1. `shortcuts-dialog.tsx` opens with `?` (a `useHotkeys` call in the app shell) and with a header button "Keyboard shortcuts". It lists the registry grouped in a `<table>` with `<kbd>`, and has a Switch "Single-key shortcuts" bound to settings.
2. When shortcuts are off: hints are hidden, `aria-keyshortcuts` is removed, toasts use button wording. The same switch is in the Settings menu, with a link that opens the dialog.
3. Add a short note in the dialog: "Actions apply to the selected items, or to the current item when nothing is selected."

Files: `shortcuts-dialog.tsx`, `shortcuts-dialog.test.tsx` (new); `apps/web/src/components/layout/{app-shell.tsx,settings-menu.tsx}` (modify).
Tests: `?` opens the dialog and the header button opens it too; the toggle persists in localStorage; with shortcuts off `?` does nothing but the button still works; the dialog has no axe violations and returns focus when it closes.
Done when: the tests are green.

## End of the day

**Owner**: run the day's demo on the preview, commit, push, merge the pull request when CI is green.
