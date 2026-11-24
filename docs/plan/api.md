# Data model and GraphQL API

The Prisma schema, the GraphQL SDL and the business rules that the API enforces.

## Data model (Prisma)

`packages/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // URL comes from prisma.config.ts (Prisma 7). On an older major add: url = env("DATABASE_URL")
}

enum ContentType   { POST COMMENT }
enum ContentStatus { PENDING APPROVED REMOVED }
enum ReportReason  { SPAM OFF_TOPIC SELF_PROMOTION LOW_EFFORT MISLEADING RULE_BREAK OTHER }
enum ModActionType { APPROVE REMOVE BAN }
enum ModeratorRole { MODERATOR ADMIN }

model Moderator {
  id          String        @id @default(uuid()) @db.Uuid
  username    String        @unique
  displayName String
  role        ModeratorRole @default(MODERATOR)
  createdAt   DateTime      @default(now())
  actions     ModAction[]
}

model Community {
  id        String    @id @default(uuid()) @db.Uuid
  slug      String    @unique
  name      String
  createdAt DateTime  @default(now())
  contents  Content[]
}

model Author {
  id        String      @id @default(uuid()) @db.Uuid
  username  String      @unique
  createdAt DateTime    @default(now())
  contents  Content[]
  actions   ModAction[]
}

/// A reported post or comment. Every row has at least one report.
/// The queue = rows with status PENDING and firstReportedAt <= now (see "Time-released reports").
model Content {
  id              String        @id @default(uuid()) @db.Uuid
  type            ContentType
  title           String?       // posts only
  body            String
  parentTitle     String?       // comments only: title of the post they reply to
  status          ContentStatus @default(PENDING)
  reportCount     Int           @default(0) // denormalized for sorting
  firstReportedAt DateTime                  // denormalized for sorting and "age"
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  communityId     String        @db.Uuid
  authorId        String        @db.Uuid
  community       Community     @relation(fields: [communityId], references: [id])
  author          Author        @relation(fields: [authorId], references: [id])
  reports         Report[]
  actions         ModAction[]

  @@index([status, firstReportedAt, id])
  @@index([status, reportCount, firstReportedAt, id])
  @@index([communityId, status])
  @@index([authorId])
}

model Report {
  id        String       @id @default(uuid()) @db.Uuid
  reason    ReportReason
  note      String?
  createdAt DateTime     @default(now())
  contentId String       @db.Uuid
  content   Content      @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@index([contentId])
  @@index([reason, contentId])
  @@index([createdAt])
}

model RemovalReason {
  id              String      @id @default(uuid()) @db.Uuid
  title           String
  messageTemplate String      // may contain {{username}} {{community}} {{reason}} {{duration}}
  sortOrder       Int         @default(0)
  archivedAt      DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  actions         ModAction[]
}

/// One row per content item per command. A bulk command shares one batchId.
/// Ban state is derived: the latest non-undone BAN action whose banExpiresAt is null (permanent) or in the future.
model ModAction {
  id              String         @id @default(uuid()) @db.Uuid
  batchId         String         @db.Uuid
  type            ModActionType
  createdAt       DateTime       @default(now())
  undoneAt        DateTime?
  contentId       String         @db.Uuid
  authorId        String         @db.Uuid // target author (denormalized for history and log filters)
  moderatorId     String         @db.Uuid
  removalReasonId String?        @db.Uuid
  reasonTitle     String?        // snapshot of the reason title at action time
  messageToUser   String?        // rendered message (placeholders already filled)
  banDurationDays Int?           // BAN only; null = permanent
  banExpiresAt    DateTime?
  content         Content        @relation(fields: [contentId], references: [id], onDelete: Cascade)
  author          Author         @relation(fields: [authorId], references: [id], onDelete: Cascade)
  moderator       Moderator      @relation(fields: [moderatorId], references: [id])
  removalReason   RemovalReason? @relation(fields: [removalReasonId], references: [id])

  @@index([createdAt, id])
  @@index([batchId])
  @@index([contentId])
  @@index([authorId, type, createdAt])
  @@index([moderatorId, createdAt])
}
```

Design notes:

- **No ban table, no ban columns.** Ban state is derived from `ModAction`, so undo never has to restore old values.
- **`status = 'PENDING'` is the concurrency guard.** Only pending items can be actioned, so "already handled by someone else" is a single atomic `UPDATE … WHERE status = 'PENDING' … RETURNING`.
- **Readable identifiers.** The URL filters and the cookie use community `slug` and moderator `username`, never IDs: they are readable and stay valid when the seed or the preset changes. (The seed is fixed, so item IDs are also the same after every reset and `?item=<id>` links keep working.)
- **Time-released reports.** The demo is reset once a day and has no real traffic, so the seed also creates items whose `firstReportedAt` is in the future (the next 30 hours). An item is **visible** when `firstReportedAt <= now`; the API hides everything else (rule "Visibility" below). The queue therefore fills up during the day by itself, the "last hour" filter is never empty and the hourly chart has no gap. To keep `reportCount` exact, every report of a future item has `createdAt = firstReportedAt`. No schema or SDL change is needed.

## GraphQL API

Schema-first. The SDL lives in `packages/api/src/schema/*.graphql.ts` as `/* GraphQL */` template strings. This keeps editor highlighting, needs no `fs` reads at runtime (safe for serverless bundling), and GraphQL Codegen can load it.

```graphql
scalar DateTime

enum ContentType { POST COMMENT }
enum ContentStatus { PENDING APPROVED REMOVED }
enum ReportReason { SPAM OFF_TOPIC SELF_PROMOTION LOW_EFFORT MISLEADING RULE_BREAK OTHER }
enum ModActionType { APPROVE REMOVE BAN }
enum QueueSort { OLDEST NEWEST MOST_REPORTED }
enum QueueAge { LAST_HOUR LAST_24_HOURS OLDER_THAN_24_HOURS }
enum ModerationOutcome { APPLIED ALREADY_HANDLED NOT_FOUND }

type PageInfo { hasNextPage: Boolean! endCursor: String }

type Moderator { id: ID! username: String! displayName: String! }
type Community { id: ID! slug: String! name: String! }

type Ban { createdAt: DateTime! expiresAt: DateTime }        # expiresAt null = permanent
type AuthorStats { removals: Int! bans: Int! }               # not undone; bans counted per batch
type Author {
  id: ID!
  username: String!
  createdAt: DateTime!
  stats: AuthorStats!
  activeBan: Ban
  history(first: Int = 10): [ModAction!]!                    # REMOVE + BAN, not undone, newest first, max 20
}

type Report { id: ID! reason: ReportReason! note: String createdAt: DateTime! }
type ReasonCount { reason: ReportReason! count: Int! }

type Content {
  id: ID!
  type: ContentType!
  title: String
  body: String!
  parentTitle: String
  status: ContentStatus!
  createdAt: DateTime!
  firstReportedAt: DateTime!
  reportCount: Int!
  reasonCounts: [ReasonCount!]!                              # count desc
  reports(first: Int = 5): [Report!]!                        # newest first
  community: Community!
  author: Author!
}
type ContentEdge { cursor: String! node: Content! }
type ContentConnection { edges: [ContentEdge!]! pageInfo: PageInfo! totalCount: Int! }

input QueueFilter {
  reasons: [ReportReason!]
  types: [ContentType!]
  communitySlugs: [String!]
  age: QueueAge
}

type RemovalReason { id: ID! title: String! messageTemplate: String! sortOrder: Int! archivedAt: DateTime }

type ModAction {
  id: ID!
  batchId: ID!
  type: ModActionType!
  createdAt: DateTime!
  undoneAt: DateTime
  moderator: Moderator!
  content: Content!
  author: Author!
  reasonTitle: String
  messageToUser: String
  banDurationDays: Int
  banExpiresAt: DateTime
}
type ModActionEdge { cursor: String! node: ModAction! }
type ModActionConnection { edges: [ModActionEdge!]! pageInfo: PageInfo! totalCount: Int! }

input ModLogFilter {
  types: [ModActionType!]
  moderatorUsernames: [String!]
  search: String                                             # max 100 chars; title, body, author, reason
  from: DateTime
  to: DateTime
}

type ModerationItemResult { contentId: ID! outcome: ModerationOutcome! handledBy: Moderator content: Content }
type ModerationPayload { batchId: ID results: [ModerationItemResult!]! }   # batchId null when nothing applied
type UndoPayload { batchId: ID! restored: [Content!]! }

input ApproveInput { contentIds: [ID!]! }
input RemoveInput { contentIds: [ID!]! removalReasonId: ID! messageToUser: String }
input BanInput { contentIds: [ID!]! removalReasonId: ID! durationDays: Int messageToUser: String }  # durationDays null = permanent
input RemovalReasonInput { title: String! messageTemplate: String! }

type QueueSummary { pendingCount: Int! reportsLast24h: Int! handledLast24h: Int! medianMinutesLast24h: Float }
type HourlyCount { hour: DateTime! count: Int! }
type DailyMedian { day: DateTime! medianMinutes: Float }
type QueueHealth {
  summary: QueueSummary!
  reportsPerHour(hours: Int = 48): [HourlyCount!]!           # max 168, zero-filled, UTC buckets
  medianTimeToAction(days: Int = 14): [DailyMedian!]!        # max 30, UTC days
  topReasons(days: Int = 14, limit: Int = 6): [ReasonCount!]!
}

type Query {
  me: Moderator!
  moderators: [Moderator!]!
  communities: [Community!]!
  queue(first: Int = 50, after: String, filter: QueueFilter, sort: QueueSort = OLDEST): ContentConnection!
  content(id: ID!): Content
  modLog(first: Int = 50, after: String, filter: ModLogFilter): ModActionConnection!
  removalReasons(includeArchived: Boolean = false): [RemovalReason!]!
  queueHealth: QueueHealth!
}

type Mutation {
  approveContent(input: ApproveInput!): ModerationPayload!
  removeContent(input: RemoveInput!): ModerationPayload!
  banAuthor(input: BanInput!): ModerationPayload!            # removes the content and bans its author
  undoModeration(batchId: ID!): UndoPayload!
  createRemovalReason(input: RemovalReasonInput!): RemovalReason!
  updateRemovalReason(id: ID!, input: RemovalReasonInput!): RemovalReason!
  archiveRemovalReason(id: ID!): RemovalReason!
}
```

**Business rules (the API enforces them; integration tests cover each one):**

| Rule | Detail |
|---|---|
| Page sizes | `first` is clamped to 1..100. Queue page size in the UI: 50 (`QUEUE_PAGE_SIZE`). |
| Queue ordering | `OLDEST` = `firstReportedAt asc, id asc`; `NEWEST` = `firstReportedAt desc, id desc`; `MOST_REPORTED` = `reportCount desc, firstReportedAt asc, id asc`. The client comparator in `queue-sort.ts` must match exactly. |
| Cursors | Opaque `base64url(JSON.stringify([...sortKeyValues, id]))`. Keyset `WHERE` built from the decoded values (not Prisma's `cursor` option), so a cursor stays valid when the row changes. An invalid cursor gives `BAD_USER_INPUT`. |
| Age filter | `LAST_HOUR`: `firstReportedAt >= now - 1h`; `LAST_24_HOURS`: `>= now - 24h`; `OLDER_THAN_24_HOURS`: `< now - 24h`. `now` comes from the injectable clock. |
| Visibility | Only items with `firstReportedAt <= now` exist for the API: `queue` and its `totalCount`, `content(id)` (otherwise `null`), moderation (otherwise `NOT_FOUND`) and `QueueSummary.pendingCount`. Report statistics (`reportsLast24h`, `reportsPerHour`, `topReasons`) count only reports with `createdAt <= now`. `now` comes from the injectable clock. |
| Bulk limit | 1..200 ids (`MAX_BULK_IDS`), validated by the shared Zod schema. |
| Moderation | One transaction: `UPDATE "Content" SET status = $s WHERE id = ANY($ids) AND status = 'PENDING' AND "firstReportedAt" <= $now RETURNING id, "authorId", "communityId"`; then `createMany` actions with one new `batchId`. Ids not returned are `ALREADY_HANDLED` (with `handledBy` = moderator of the latest non-undone action) or `NOT_FOUND`. |
| Remove / ban | `removalReasonId` must exist and must not be archived. `messageToUser` is rendered per item with `renderTemplate` (placeholders filled with that item's author, community, reason, duration). Ban: `banExpiresAt = now + durationDays` or null (permanent). |
| Undo | Only the moderator who created the batch, only within `UNDO_WINDOW_MS` (10 min), only if not undone yet. Sets `undoneAt`; content goes back to `PENDING` only if its status still equals the one the action set. Errors: `FORBIDDEN`, `UNDO_EXPIRED`, `NOT_FOUND`. |
| Errors | `extensions.code` ∈ `BAD_USER_INPUT` (with `extensions.fieldErrors`), `NOT_FOUND`, `FORBIDDEN`, `UNDO_EXPIRED`, `INTERNAL_SERVER_ERROR`. In production, unexpected errors are masked and sent to Sentry. |
| Acting moderator | Demo without auth: the cookie `mq_moderator=<username>` (or header `x-moderator`). An unknown or missing value falls back to `mod_aurora`. |
| N+1 | `author`, `community`, `reasonCounts`, `Author.stats`, `Author.activeBan` resolve through per-request DataLoaders. One queue page of 50 runs at most 6 SQL queries. |
