import type { ContentConnectionResolvers, QueryResolvers } from '../generated/resolvers-types';
import { countQueue, getQueuePage } from '../services/queue-service';

export const queueQueryResolvers: QueryResolvers = {
  queue: (_parent, args, ctx) => getQueuePage(ctx, args),
  communities: (_parent, _args, { prisma }) =>
    prisma.community.findMany({ orderBy: [{ name: 'asc' }, { slug: 'asc' }] }),
};

export const contentConnectionResolvers: ContentConnectionResolvers = {
  // A field resolver, so the count query runs only when a client asks for totalCount.
  totalCount: ({ filter }, _args, ctx) => countQueue(ctx, filter),
};
