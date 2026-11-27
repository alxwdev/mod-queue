export const modLogTypeDefs = /* GraphQL */ `
  enum ModActionType {
    APPROVE
    REMOVE
    BAN
  }

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

  type ModActionEdge {
    cursor: String!
    node: ModAction!
  }

  type ModActionConnection {
    edges: [ModActionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input ModLogFilter {
    types: [ModActionType!]
    moderatorUsernames: [String!]
    search: String # max 100 chars; title, body, author, reason
    from: DateTime
    to: DateTime
  }

  extend type Query {
    modLog(first: Int = 50, after: String, filter: ModLogFilter): ModActionConnection!
  }
`;
