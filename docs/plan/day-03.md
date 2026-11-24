# Day 3: GraphQL API

**Goal:** a complete, tested GraphQL API: queue, moderation, undo, removal reasons, mod log and queue health, served at `/api/graphql`.
**Complexity:** High · **Must:** 7 h · **Branch:** `day-03-graphql-api`
**Demo:** in Apollo Sandbox (`pnpm dev:api`): page through the queue, approve two items, undo them, find both actions in `modLog`, read `queueHealth`.
**Read first:** [conventions.md](conventions.md), [api.md](api.md) (all of it).

All integration tests use `execute()` from `packages/api/test/execute.ts`, the factories, and a fixed clock.

## 3.1 Queue and content reads
Must · M · 2 h · Depends on: 2.5, 1.6

Steps:
1. `src/lib/cursor.ts`: `encodeCursor(values)`, `decodeCursor(cursor, length)` (throws `BAD_USER_INPUT`).
2. `src/lib/keyset.ts`: `queueOrderBy(sort)` and `queueKeysetWhere(sort, cursorValues)` for the three sort orders in [api.md](api.md) (nested `OR` conditions on the sort fields and `id`).
3. `src/services/queue-service.ts`: `buildQueueWhere(filter, now)` (status `PENDING`, `firstReportedAt <= now` for visibility, reasons → `reports: { some: { reason: { in } } }`, types, `community: { slug: { in } }`, age); `getQueuePage({ first, after, filter, sort })` takes `first + 1` rows to compute `hasNextPage`; `countQueue(filter)`; `getContent(id)` returns `null` for an item that is not visible yet.
4. Resolvers: `Query.queue` (connection; `totalCount` is a field resolver, so it runs only when requested), `Query.content`, `Query.communities`; `Content.reasonCounts/reports/author/community`; `Author.stats/activeBan/history` (DataLoaders, `first` ≤ 20).

Files: `packages/api/src/lib/{cursor.ts,keyset.ts,cursor.test.ts}`, `packages/api/src/services/{queue-service.ts,queue-service.int.test.ts}`, `packages/api/src/resolvers/{queue.ts,content.ts}` (new); `packages/api/src/resolvers/index.ts`, `packages/api/src/loaders.ts` (modify).
Tests (`queue-service.int.test.ts`): default order is oldest first; for each sort, walking three pages equals one big query (no duplicates, no gaps); every filter alone and combined; age boundaries; `totalCount` correct; invalid cursor → `BAD_USER_INPUT`; an item with `firstReportedAt` after the clock is not in the queue, not in `totalCount`, and `content(id)` is `null`, and it appears when the clock moves past its time; a page of 50 with nested fields runs ≤ 6 SQL queries (count Prisma query events). `cursor.test.ts`: round trip; wrong length and broken base64 throw.
Done when: the tests are green; the first page with nested fields returns in under 300 ms locally on the `full` seed.

## 3.2 Moderation and undo
Must · L · 2.5 h · Depends on: 3.1

Steps:
1. Shared `src/template.ts`: `TEMPLATE_PLACEHOLDERS = ['username', 'community', 'reason', 'duration']`, `renderTemplate(template, vars)` (unknown placeholders stay as they are), `findUnknownPlaceholders(template)`.
2. Shared `src/schemas/moderation.ts` (API input part): `contentIdsSchema` (1..`MAX_BULK_IDS` unique UUIDs), `messageSchema` (trimmed, ≤ 1000), `banDurationDaysSchema` (`1 | 3 | 7 | 30 | null`), `approveInputSchema`, `removeInputSchema`, `banInputSchema`.
3. `src/services/moderation-service.ts`: `moderate(ctx, command, contentIds)` following the "Moderation" and "Remove / ban" rules in [api.md](api.md) (raw `UPDATE … RETURNING` through `Prisma.sql`, then `createMany`, all in `$transaction`); messages rendered per item; `handledBy` for skipped items. `undo(ctx, batchId)` following the "Undo" rule.
4. `src/resolvers/moderation.ts`: thin resolvers that run `parseInput` with the shared schemas and map service results to payloads.

Files: `packages/shared/src/{template.ts,template.test.ts,schemas/moderation.ts,schemas/moderation.test.ts}`, `packages/api/src/services/{moderation-service.ts,moderation-service.int.test.ts}`, `packages/api/src/resolvers/moderation.ts` (new); `packages/shared/src/index.ts`, `packages/api/src/resolvers/index.ts` (modify).
Tests: `template.test.ts` (all placeholders filled; unknown ones kept; `findUnknownPlaceholders`). `moderation.test.ts` (0 and 201 ids rejected; duplicates rejected; message over 1000 rejected). `moderation-service.int.test.ts`: approve one; bulk of 200 → 200 actions with one `batchId`; 201 ids → `BAD_USER_INPUT`; approving an already handled item → `ALREADY_HANDLED` + `handledBy`; an unknown id and a not-yet-visible id → `NOT_FOUND`; two parallel approvals of the same ids → each id applied exactly once; remove with an archived reason → `BAD_USER_INPUT`; message rendered per author; ban sets `banExpiresAt` and `Author.activeBan`; permanent ban → `expiresAt` null; undo restores `PENDING` and marks actions as undone; undo by another moderator → `FORBIDDEN`; after the window → `UNDO_EXPIRED`; undoing twice → `NOT_FOUND`; an undone ban is no longer active.
Done when: all tests are green.

## 3.3 Removal reasons CRUD
Must · S · 0.5 h · Depends on: 2.5

Steps:
1. Shared `src/schemas/removal-reason.ts`: `removalReasonSchema` (`title` 3–60 chars, `messageTemplate` 10–1000 chars, no unknown placeholders).
2. `src/services/removal-reason-service.ts`: list ordered by `sortOrder`, create with the next `sortOrder`, update, archive = set `archivedAt`.
3. `src/resolvers/removal-reasons.ts`.

Files: `packages/shared/src/schemas/removal-reason.ts`, `packages/api/src/services/{removal-reason-service.ts,removal-reason-service.int.test.ts}`, `packages/api/src/resolvers/removal-reasons.ts` (new); `packages/shared/src/index.ts`, `packages/api/src/resolvers/index.ts` (modify).
Tests (`removal-reason-service.int.test.ts`): create, update, archive; the default list hides archived reasons and `includeArchived: true` shows them; validation returns `fieldErrors` for a short title and for an unknown placeholder.
Done when: the tests are green.

## 3.4 Mod log API
Must · S · 0.75 h · Depends on: 3.2

Steps:
1. `src/services/mod-log-service.ts`: `modLog({ first, after, filter })` ordered `createdAt desc, id desc` with a keyset cursor; filters `types`, `moderatorUsernames`, `from`, `to`; `search` (trimmed, ≤ 100 chars) with `contains` + `mode: 'insensitive'` on content title/body, author username and `reasonTitle`; `totalCount`. Undone actions are included (the UI shows a badge).
2. `src/resolvers/mod-log.ts`: `Query.modLog`, `ModAction.moderator/content/author` through the loaders.

Files: `packages/api/src/services/{mod-log-service.ts,mod-log-service.int.test.ts}`, `packages/api/src/resolvers/mod-log.ts` (new); `packages/api/src/resolvers/index.ts` (modify).
Tests (`mod-log-service.int.test.ts`): newest first; each filter alone; search matches title, body, author and reason, case-insensitively; three pages equal one big query; `totalCount`; an undone action is listed with `undoneAt`.
Done when: the tests are green.

## 3.5 Queue health API
Must · M · 1.25 h · Depends on: 2.5, 1.5

`src/services/health-service.ts` with `prisma.$queryRaw` (`Prisma.sql`), numbers cast to `int` / `float`. Every query applies the "Visibility" rule from [api.md](api.md):

- `summary`: pending count (visible items only), reports in the last 24 h (`createdAt` between `now - 24h` and `now`), handled in the last 24 h (non-undone actions), median minutes to action in the last 24 h.
- `reportsPerHour(hours ≤ 168)`: `date_trunc('hour', "createdAt")` buckets in UTC up to `now`, zero-filled with `generate_series`.
- `medianTimeToAction(days ≤ 30)`: `percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM a."createdAt" - c."firstReportedAt") / 60)` per UTC day over non-undone actions; `null` for days without actions.
- `topReasons(days ≤ 30, limit ≤ 10)`: `groupBy` on `Report.reason` for reports up to `now`.

Files: `packages/api/src/services/{health-service.ts,health-service.int.test.ts}`, `packages/api/src/resolvers/health.ts` (new); `packages/api/src/resolvers/index.ts` (modify).
Tests (`health-service.int.test.ts`, fixtures and a fixed clock): number of buckets = hours; the last bucket is the current hour; median for odd and even sets; undone actions excluded; order of top reasons; reports and items dated after the clock are not counted anywhere.
Done when: the tests are green; `queueHealth` answers in under 500 ms locally on the `full` seed.

## End of the day

Every `Query` and `Mutation` field of the SDL now has a resolver. **Owner**: commit, push, merge the pull request when CI is green.
