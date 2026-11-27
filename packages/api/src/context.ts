import type { Moderator, PrismaClient } from './generated/prisma/client';

export interface GraphQLContext {
  prisma: PrismaClient;
  moderator: Moderator;
  // Empty until task 2.5 adds the DataLoaders.
  loaders: Record<string, never>;
  now: () => Date;
}
