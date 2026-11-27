export const moderationTypeDefs = /* GraphQL */ `
  enum ModerationOutcome {
    APPLIED
    ALREADY_HANDLED
    NOT_FOUND
  }

  type ModerationItemResult {
    contentId: ID!
    outcome: ModerationOutcome!
    handledBy: Moderator
    content: Content
  }

  type ModerationPayload {
    batchId: ID # null when nothing applied
    results: [ModerationItemResult!]!
  }

  type UndoPayload {
    batchId: ID!
    restored: [Content!]!
  }

  input ApproveInput {
    contentIds: [ID!]!
  }

  input RemoveInput {
    contentIds: [ID!]!
    removalReasonId: ID!
    messageToUser: String
  }

  input BanInput {
    contentIds: [ID!]!
    removalReasonId: ID!
    durationDays: Int # null = permanent
    messageToUser: String
  }

  type Mutation {
    approveContent(input: ApproveInput!): ModerationPayload!
    removeContent(input: RemoveInput!): ModerationPayload!
    banAuthor(input: BanInput!): ModerationPayload! # removes the content and bans its author
    undoModeration(batchId: ID!): UndoPayload!
  }
`;
