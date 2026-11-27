import type { Resolvers } from '../generated/resolvers-types';
import { authorResolvers, contentQueryResolvers, contentResolvers } from './content';
import { contentConnectionResolvers, queueQueryResolvers } from './queue';
import { dateTimeScalar } from './scalars';

// The Day 3 tasks add the queue, moderation, mod log, removal reason and health resolvers.
export const resolvers: Resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    me: (_parent, _args, { moderator }) => moderator,
    moderators: (_parent, _args, { prisma }) =>
      prisma.moderator.findMany({ orderBy: { username: 'asc' } }),
    ...queueQueryResolvers,
    ...contentQueryResolvers,
  },
  ContentConnection: contentConnectionResolvers,
  Content: contentResolvers,
  Author: authorResolvers,
};
