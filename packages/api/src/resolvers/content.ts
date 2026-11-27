import type {
  AuthorResolvers,
  ContentResolvers,
  QueryResolvers,
} from '../generated/resolvers-types';
import { clampFirst } from '../lib/cursor';
import { getContent } from '../services/queue-service';

const MAX_REPORTS = 100;
const MAX_HISTORY = 20;

export const contentQueryResolvers: QueryResolvers = {
  content: (_parent, { id }, ctx) => getContent(ctx, id),
};

// The batched fields go through the per-request loaders, so a queue page has no N+1 queries.
export const contentResolvers: ContentResolvers = {
  reasonCounts: ({ id }, _args, { loaders }) => loaders.reasonCounts.load(id),
  reports: ({ id }, { first }, { prisma }) =>
    prisma.report.findMany({
      where: { contentId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: clampFirst(first, MAX_REPORTS),
    }),
  community: ({ communityId }, _args, { loaders }) => loaders.communities.load(communityId),
  author: ({ authorId }, _args, { loaders }) => loaders.authors.load(authorId),
};

export const authorResolvers: AuthorResolvers = {
  stats: ({ id }, _args, { loaders }) => loaders.authorStats.load(id),
  activeBan: ({ id }, _args, { loaders }) => loaders.activeBans.load(id),
  // Only the preview of one item asks for the history, so it needs no loader.
  history: ({ id }, { first }, { prisma }) =>
    prisma.modAction.findMany({
      where: { authorId: id, type: { in: ['REMOVE', 'BAN'] }, undoneAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: clampFirst(first, MAX_HISTORY),
    }),
};
