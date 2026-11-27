export const queueTypeDefs = /* GraphQL */ `
  enum ContentType {
    POST
    COMMENT
  }

  enum ContentStatus {
    PENDING
    APPROVED
    REMOVED
  }

  enum ReportReason {
    SPAM
    OFF_TOPIC
    SELF_PROMOTION
    LOW_EFFORT
    MISLEADING
    RULE_BREAK
    OTHER
  }

  enum QueueSort {
    OLDEST
    NEWEST
    MOST_REPORTED
  }

  enum QueueAge {
    LAST_HOUR
    LAST_24_HOURS
    OLDER_THAN_24_HOURS
  }

  type Ban {
    createdAt: DateTime!
    expiresAt: DateTime # null = permanent
  }

  # Not undone; bans counted per batch.
  type AuthorStats {
    removals: Int!
    bans: Int!
  }

  type Author {
    id: ID!
    username: String!
    createdAt: DateTime!
    stats: AuthorStats!
    activeBan: Ban
    history(first: Int = 10): [ModAction!]! # REMOVE + BAN, not undone, newest first, max 20
  }

  type Report {
    id: ID!
    reason: ReportReason!
    note: String
    createdAt: DateTime!
  }

  type ReasonCount {
    reason: ReportReason!
    count: Int!
  }

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
    reasonCounts: [ReasonCount!]! # count desc
    reports(first: Int = 5): [Report!]! # newest first
    community: Community!
    author: Author!
  }

  type ContentEdge {
    cursor: String!
    node: Content!
  }

  type ContentConnection {
    edges: [ContentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input QueueFilter {
    reasons: [ReportReason!]
    types: [ContentType!]
    communitySlugs: [String!]
    age: QueueAge
  }

  extend type Query {
    queue(
      first: Int = 50
      after: String
      filter: QueueFilter
      sort: QueueSort = OLDEST
    ): ContentConnection!
    content(id: ID!): Content
  }
`;
