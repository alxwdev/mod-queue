# Day 8: Keyboard model and focus management

**Goal:** the whole queue works without a mouse, focus is always predictable, and single-key shortcuts can be turned off.
**Complexity:** Very high (the main risk of the project) · **Must:** 6 h · **Branch:** `day-08-keyboard-focus`
**Demo:** with the mouse unplugged: `j j a z x j x a ?`, `Esc`; then turn shortcuts off and use the arrow keys and Tab.
**Read first:** [conventions.md](conventions.md), [architecture.md](architecture.md) ("Keyboard model" and "Focus and announcement rules": these two tables are the specification for this day).

Paths are inside `apps/web/src/features/queue/`.

## 8.1 Roving focus with virtualization
Must · M · 2 h · Depends on: 7.4, 6.3, 5.4

Steps:
1. `hooks/use-focus-row.ts`: `focusRow(id)` → index → `scrollToIndex(index, { align: 'auto' })` → on the next animation frames (max 10 tries) `document.getElementById('queue-row-' + id)?.focus({ preventScroll: true })`.
2. Listbox `onKeyDown` in `queue-list.tsx`: `↓/↑` move, `Home/End` go to the first/last loaded item (at `End`, also `loadMore`), `Space` toggles selection, `Enter` opens the sheet (tablet/phone) or moves focus to the preview heading (desktop; `Esc` in the preview returns to the row).
3. `hooks/use-queue-shortcuts.ts`: connects `useHotkeys` to the reducer and `moderation` for `j`, `k`, `x`, `a`, `z`. `r` and `b` are registered but do nothing until the dialog exists (task 9.2). `j/k` always bring focus into the list.
4. The active item is mirrored to `?item=` with `replaceState`, debounced by 150 ms (desktop).

Files: `hooks/{use-focus-row.ts,use-queue-shortcuts.ts}`, `components/queue-screen.keyboard.test.tsx` (new); `components/{queue-list.tsx,queue-screen.tsx,preview-pane.tsx}` (modify).
Tests: `j` three times → the third row has focus; `k` at the top stays; arrows, `Home`, `End`; `j` near the end of the loaded items triggers `loadMore`; `Enter` on desktop focuses the preview heading and `Esc` returns to the row; `?item=` follows the active row.
Done when: the tests are green; holding `j` through 500 rows in the browser never loses focus.

## 8.2 Focus rules after changes
Must · M · 2 h · Depends on: 8.1, 7.2

Implement the "Focus and announcement rules" table in [architecture.md](architecture.md):

1. A `pendingFocusRef` is set before an action; an effect focuses the target after the list renders.
2. The "only if focus was inside the queue region or on `body`" check.
3. The empty-state heading gets focus when the queue becomes empty.
4. Filter changes announce "Showing N reports" through `useAnnounce` (the text was added in task 6.1; this task makes sure it is not announced twice together with a toast).
5. Export `focusAfterDialog(nextId)` for task 9.2: it is called from the dialog's `onCloseAutoFocus` after `preventDefault()`.

Files: `components/queue-screen.focus.test.tsx` (new); `components/queue-screen.tsx`, `hooks/use-focus-row.ts` (modify).
Tests: one test per row of the rules table, except the two dialog rows (tested in task 9.2) and the N1 row: single action in the middle, on the last item, on the only item; bulk action; undo; server error keeps focus; filter change keeps focus on the filter control; focus is not moved when it was in the header.
Done when: the tests are green.

## 8.3 Bulk selection by keyboard
Must · S · 0.75 h · Depends on: 8.1, 7.2

Steps: `x` / `Space` toggle; the header checkbox selects all loaded items up to 200 and shows "200 selected (max per action)" when it hits the cap; `Esc` clears; `a` acts on the selection when it is not empty (`r` / `b` follow in task 9.2); the selection count is announced politely with a 500 ms debounce ("3 selected").

Files: `components/queue-screen.bulk.test.tsx` (new); `hooks/use-queue-shortcuts.ts`, `components/{bulk-bar.tsx,queue-screen.tsx}` (modify).
Tests: select 3 with `x`, press `a` → the mutation variables contain those 3 ids; `Esc` clears the selection; the cap message at 200; the debounced announcement.
Done when: the tests are green.

## 8.4 Keyboard flow tests
Must · M · 1.25 h · Depends on: 8.2, 8.3, 7.5

Steps:
1. One RTL integration test "triage by keyboard": `j`, `j`, `a`, `z`, `x`, `j`, `x`, `a`, `?`, `Esc`, with assertions on `document.activeElement`, toast texts, announcer texts and mutation variables, and jest-axe after each major step.
2. A second test with shortcuts off: `a` does nothing; arrows + Tab + Enter still complete an approve.
3. **Owner**: a manual NVDA + Chrome check (rows are read as "… option 3 of 10,512, not selected"; toasts and announcements are spoken once). The agent writes the checklist and the results into `docs/accessibility.md`.

Files: `components/queue-screen.triage.test.tsx`, `docs/accessibility.md` (new).
Tests: the two tests above.
Done when: both tests are green; the NVDA notes are in `docs/accessibility.md`; the day's demo works with the mouse unplugged.

## End of the day

If this day is not finished, do not start Day 9: the remove/ban dialog depends on the focus rules. Use the next morning, then a reserve day ([schedule.md](schedule.md)).
**Owner**: commit, push, merge the pull request when CI is green.
