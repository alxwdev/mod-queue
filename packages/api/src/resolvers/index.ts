import type { Resolvers } from '../generated/resolvers-types';
import { dateTimeScalar } from './scalars';

// The Day 3 tasks add the queue, moderation, mod log, removal reason and health resolvers.
export const resolvers: Resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    me: (_parent, _args, { moderator }) => moderator,
    moderators: (_parent, _args, { prisma }) =>
      prisma.moderator.findMany({ orderBy: { username: 'asc' } }),
  },
};
