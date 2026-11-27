import type {
  ModActionConnectionResolvers,
  ModActionResolvers,
  QueryResolvers,
} from '../generated/resolvers-types';
import { countModLog, getModLogPage } from '../services/mod-log-service';

export const modLogQueryResolvers: QueryResolvers = {
  modLog: (_parent, args, ctx) => getModLogPage(ctx, args),
};

export const modActionConnectionResolvers: ModActionConnectionResolvers = {
  // A field resolver, so the count query runs only when a client asks for totalCount.
  totalCount: ({ filter }, _args, ctx) => countModLog(ctx, filter),
};

// Through the per-request loaders, so a page of 50 actions has no N+1 queries.
export const modActionResolvers: ModActionResolvers = {
  moderator: ({ moderatorId }, _args, { loaders }) => loaders.moderators.load(moderatorId),
  content: ({ contentId }, _args, { loaders }) => loaders.contents.load(contentId),
  author: ({ authorId }, _args, { loaders }) => loaders.authors.load(authorId),
};
