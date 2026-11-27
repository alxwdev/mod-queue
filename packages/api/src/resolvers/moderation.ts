import { approveInputSchema, banInputSchema, removeInputSchema } from '@modqueue/shared';
import { parseInput } from '../errors';
import type { MutationResolvers } from '../generated/resolvers-types';
import { moderate, undo } from '../services/moderation-service';

export const moderationMutationResolvers: MutationResolvers = {
  approveContent: (_parent, { input }, ctx) => {
    const { contentIds } = parseInput(approveInputSchema, input);
    return moderate(ctx, { type: 'APPROVE' }, contentIds);
  },
  removeContent: (_parent, { input }, ctx) => {
    const { contentIds, ...command } = parseInput(removeInputSchema, input);
    return moderate(ctx, { type: 'REMOVE', ...command }, contentIds);
  },
  banAuthor: (_parent, { input }, ctx) => {
    const { contentIds, ...command } = parseInput(banInputSchema, input);
    return moderate(ctx, { type: 'BAN', ...command }, contentIds);
  },
  undoModeration: (_parent, { batchId }, ctx) => undo(ctx, batchId),
};
