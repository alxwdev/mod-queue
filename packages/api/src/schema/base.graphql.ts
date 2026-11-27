export const baseTypeDefs = /* GraphQL */ `
  scalar DateTime

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type Moderator {
    id: ID!
    username: String!
    displayName: String!
  }

  type Community {
    id: ID!
    slug: String!
    name: String!
  }

  type Query {
    me: Moderator!
    moderators: [Moderator!]!
    communities: [Community!]!
  }
`;
