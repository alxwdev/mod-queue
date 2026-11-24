# Day 9: Remove and ban form, removal reasons

**Goal:** remove and ban with reason templates, a ban duration and a message with live preview; manage the templates.
**Complexity:** Medium · **Must:** 6.5 h · **Branch:** `day-09-moderation-form-reasons`
**Demo:** press `r`, pick a reason, edit the message, watch the preview, `Ctrl+Enter`; press `b`, choose "Permanent", see the confirmation checkbox appear; create a new reason and use it right away.
**Read first:** [conventions.md](conventions.md), [api.md](api.md) (`RemoveInput`, `BanInput`, `RemovalReason`, the "Remove / ban" rule), [architecture.md](architecture.md) ("Focus and announcement rules": the two dialog rows), [design.md](design.md).

## 9.1 Shared form schema
Must · S · 0.75 h · Depends on: 3.2

Extend `packages/shared/src/schemas/moderation.ts`:

```ts
export const moderationFormSchema = z
  .discriminatedUnion('action', [
    z.object({ action: z.literal('remove'), removalReasonId: z.string().min(1, 'Choose a reason'),
               notifyUser: z.boolean(), messageToUser: messageSchema.optional() }),
    z.object({ action: z.literal('ban'), removalReasonId: z.string().min(1, 'Choose a reason'),
               notifyUser: z.boolean(), messageToUser: messageSchema.optional(),
               duration: z.enum(['1', '3', '7', '30', 'permanent']),
               confirmPermanent: z.boolean().optional() }),
  ])
  .superRefine(/* message required (10..1000) when notifyUser; no unknown placeholders;
                  confirmPermanent must be true when duration === 'permanent' */);
export type ModerationFormValues = z.infer<typeof moderationFormSchema>;
export type RemoveFormValues = Extract<ModerationFormValues, { action: 'remove' }>;
export type BanFormValues = Extract<ModerationFormValues, { action: 'ban' }>;
export function toRemoveInput(ids: string[], v: RemoveFormValues): RemoveInput;   // validated by removeInputSchema
export function toBanInput(ids: string[], v: BanFormValues): BanInput;            // 'permanent' → durationDays: null
```

The form and the API share the same field schemas (`messageSchema`, `contentIdsSchema`, `banDurationDaysSchema`); that is the "one schema for client and API". Replace the temporary `RemoveFormValues` / `BanFormValues` types in `use-moderation.ts` (task 7.1) with these and call `toRemoveInput` / `toBanInput` there.

Files: `packages/shared/src/schemas/{moderation.ts,moderation.test.ts}`, `apps/web/src/features/queue/hooks/{use-moderation.ts,use-moderation.test.tsx}` (modify).
Tests: every conditional rule (message required only when notifying; 9 and 1001 characters rejected; `confirmPermanent` required only for a permanent ban); mapping (`'permanent'` → `null`, `'7'` → `7`; no message when `notifyUser` is false); an unknown placeholder gives "Unknown placeholder {{foo}}".
Done when: the tests are green.

## 9.2 Moderation dialog
Must · L · 2.75 h · Depends on: 9.1, 7.1, 8.2, 3.3, 4.2

Steps:
1. `features/removal-reasons/removal-reasons.graphql.ts`: the `RemovalReasons` query (and fragment `RemovalReasonFields`). It is created here and reused by task 9.3.
2. `features/moderation-form/moderation-dialog.tsx`, props `{ open, mode: 'remove' | 'ban', targets: QueueItem[], onOpenChange, onSubmitted }`. Loaded with `next/dynamic`; after the first queue render the chunk is preloaded with `import()` in `requestIdleCallback`, so `r` opens instantly.
3. React Hook Form: `useForm({ resolver: zodResolver(moderationFormSchema), defaultValues: formDefaults(mode), mode: 'onTouched' })`, with `formDefaults` in `form-defaults.ts`. Fields in order:
   1. Reason: `RadioGroup` of active reasons (title + one-line excerpt), from the `RemovalReasons` query.
   2. Ban only: duration `RadioGroup` (1 day, 3 days, 7 days, 30 days, Permanent).
   3. Ban + Permanent only: Checkbox "I understand this ban is permanent" (appears and disappears with the choice).
   4. Switch "Send a message to the user" (default on).
   5. Message `Textarea` (only when notifying), prefilled from the chosen reason's template while the user has not edited it (`dirtyFields.messageToUser`); character counter linked with `aria-describedby` (not a live region).
   6. `message-preview.tsx`: `renderTemplate(message, vars of the first target)` in a message card; for bulk, the note "Placeholders are filled in for each author." The preview region is labelled and `aria-live="off"`.
4. Submit button text: "Remove 1 item" / "Remove 12 items" / "Ban {username}" / "Ban 3 authors". `Ctrl/⌘+Enter` submits. The first invalid field gets focus on submit (RHF `shouldFocusError`).
5. On submit: close at once (optimistic), call `moderation.remove/ban(ids, values)`, and move focus to the next item with `focusAfterDialog` (task 8.2). `r` / `b` and the action buttons open the dialog for the selection, or else the active item. Phone: full-screen dialog with a sticky footer.
6. Enable the Remove… and Ban… buttons from task 7.2 and the `r` / `b` handlers from task 8.1.

Files: `apps/web/src/features/removal-reasons/removal-reasons.graphql.ts`, `apps/web/src/features/moderation-form/{moderation-dialog.tsx,message-preview.tsx,form-defaults.ts,moderation-dialog.test.tsx}` (new); `apps/web/src/features/queue/components/{queue-screen.tsx,action-bar.tsx,bulk-bar.tsx}`, `apps/web/src/features/queue/hooks/use-queue-shortcuts.ts`, `apps/web/src/test/msw/handlers.ts` (modify).
Tests: conditional fields appear and disappear; validation messages; template prefill stops after the user edits the message; the preview fills placeholders; submit sends the mapped variables (MSW) for remove, timed ban and permanent ban; `Ctrl+Enter` submits; focus goes to the next item after submit; `Esc` returns focus to the row that was active; `r` opens the dialog for a selection of 3 and the button reads "Remove 3 items"; axe for both modes.
Done when: the tests are green; the day's `r` and `b` demo works in the browser.

## 9.3 Removal reasons screen
Must · L · 2.25 h · Depends on: 3.3, 4.2, 4.3

Steps:
1. `features/removal-reasons/reasons-screen.tsx`: page header with "New reason"; a `<ul>` of cards (title, template excerpt, Edit, Archive); a "Show archived" Switch bound to `?archived=1`; empty state. `(console)/reasons/page.tsx` renders it.
2. `reason-form-dialog.tsx` (create/edit): RHF + the shared `removalReasonSchema`; a placeholder help list; live preview with sample values ("sample_user", "Home Gardening").
3. `archive-reason-dialog.tsx`: `AlertDialog` confirmation.
4. Mutations `CreateRemovalReason`, `UpdateRemovalReason`, `ArchiveRemovalReason` in `removal-reasons.graphql.ts` (create the file with the query from task 9.2, step 1, if 9.2 has not run yet). Cache: `create` adds the reason to `removalReasons` with `cache.modify`; `archive` removes it from the active list; the moderation dialog uses the same query, so changes show up there immediately.

Files: `apps/web/src/features/removal-reasons/{reasons-screen.tsx,reason-form-dialog.tsx,archive-reason-dialog.tsx,reasons-screen.test.tsx}` (new); `apps/web/src/features/removal-reasons/removal-reasons.graphql.ts`, `apps/web/src/app/(console)/reasons/page.tsx`, `apps/web/src/test/msw/handlers.ts` (modify).
Tests: create, edit and archive flows with MSW; a new reason appears in the list without a refetch; "Show archived" updates the URL and the variables; the unknown placeholder error is shown at the field; server `fieldErrors` are shown at the fields; axe for the screen and both dialogs.
Done when: the tests are green; a reason created here appears in the remove dialog without a reload.

## 9.4 Form and reasons: responsive and focus-order checks
Must · S · 0.75 h · Depends on: 9.2, 9.3

Steps:
1. Add focus-order tests: with `userEvent.tab()`, the tab order in the moderation dialog (both modes) and in the reason form equals the visual order of the fields, and ends on the submit button.
2. Bring line coverage of `features/moderation-form`, `features/removal-reasons` and `packages/shared/src/schemas` to ≥ 80 %.
3. In the browser at 320 px (DevTools device mode): both dialogs and the reasons screen have no horizontal scroll, and the sticky footer of the moderation dialog stays visible while a field has focus. Fix what fails and write the three results into `docs/accessibility.md`.

Files: `apps/web/src/features/moderation-form/moderation-dialog.test.tsx`, `apps/web/src/features/removal-reasons/reasons-screen.test.tsx`, `docs/accessibility.md` (modify).
Tests: the focus-order tests of step 1.
Done when: the tests are green; the coverage numbers of step 2 are reached; the three manual results are recorded.

## End of the day

**Owner**: run the day's demo on the preview, commit, push, merge the pull request when CI is green.
