import { removalReasonSchema } from '@modqueue/shared';
import { parseInput } from '../errors';
import type { MutationResolvers, QueryResolvers } from '../generated/resolvers-types';
import {
  archiveRemovalReason,
  createRemovalReason,
  listRemovalReasons,
  updateRemovalReason,
} from '../services/removal-reason-service';

export const removalReasonQueryResolvers: QueryResolvers = {
  // The SDL default is `false`, but a client may still send `null`.
  removalReasons: (_parent, { includeArchived }, ctx) =>
    listRemovalReasons(ctx, includeArchived === true),
};

export const removalReasonMutationResolvers: MutationResolvers = {
  createRemovalReason: (_parent, { input }, ctx) =>
    createRemovalReason(ctx, parseInput(removalReasonSchema, input)),
  updateRemovalReason: (_parent, { id, input }, ctx) =>
    updateRemovalReason(ctx, id, parseInput(removalReasonSchema, input)),
  archiveRemovalReason: (_parent, { id }, ctx) => archiveRemovalReason(ctx, id),
};
