export const removalReasonsTypeDefs = /* GraphQL */ `
  type RemovalReason {
    id: ID!
    title: String!
    messageTemplate: String!
    sortOrder: Int!
    archivedAt: DateTime
  }

  input RemovalReasonInput {
    title: String!
    messageTemplate: String!
  }

  extend type Query {
    removalReasons(includeArchived: Boolean = false): [RemovalReason!]!
  }

  extend type Mutation {
    createRemovalReason(input: RemovalReasonInput!): RemovalReason!
    updateRemovalReason(id: ID!, input: RemovalReasonInput!): RemovalReason!
    archiveRemovalReason(id: ID!): RemovalReason!
  }
`;
