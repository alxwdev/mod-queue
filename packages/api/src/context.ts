import type { Moderator, PrismaClient } from './generated/prisma/client';
import type { Clock } from './lib/clock';
import { createLoaders, type Loaders } from './loaders';

export interface GraphQLContext {
  prisma: PrismaClient;
  moderator: Moderator;
  loaders: Loaders;
  now: Clock;
}

const MODERATOR_HEADER = 'x-moderator';
const MODERATOR_COOKIE = 'mq_moderator';
const DEFAULT_MODERATOR = 'mod_aurora';
const MODERATOR_CACHE_MS = 60_000;

let moderatorCache: { byUsername: Map<string, Moderator>; expiresAt: number } | undefined;

// Every request needs the acting moderator, and the moderator table rarely changes. The cache
// uses the real time, not the request clock: it is about fresh data, not about business rules.
async function loadModerators(prisma: PrismaClient): Promise<Map<string, Moderator>> {
  if (moderatorCache && moderatorCache.expiresAt > Date.now()) return moderatorCache.byUsername;
  const moderators = await prisma.moderator.findMany();
  const byUsername = new Map(moderators.map((moderator) => [moderator.username, moderator]));
  moderatorCache = { byUsername, expiresAt: Date.now() + MODERATOR_CACHE_MS };
  return byUsername;
}

function readCookie(header: string | null, name: string): string | undefined {
  const prefix = `${name}=`;
  return header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

export interface CreateContextOptions {
  request: Pick<Request, 'headers'>;
  prisma: PrismaClient;
  now: Clock;
}

/**
 * Creates the context of one request. The acting moderator comes from the header `x-moderator`,
 * else from the cookie `mq_moderator`; an unknown or missing username falls back to `mod_aurora`.
 */
export async function createContext({
  request,
  prisma,
  now,
}: CreateContextOptions): Promise<GraphQLContext> {
  const moderators = await loadModerators(prisma);
  // `||`, not `??`: an empty header falls back to the cookie.
  const requested =
    request.headers.get(MODERATOR_HEADER) ||
    readCookie(request.headers.get('cookie'), MODERATOR_COOKIE);
  const moderator =
    moderators.get(requested ?? DEFAULT_MODERATOR) ?? moderators.get(DEFAULT_MODERATOR);
  if (!moderator) {
    // Read the table again on the next request, so a seed takes effect at once.
    moderatorCache = undefined;
    throw new Error(
      `The default moderator ${DEFAULT_MODERATOR} does not exist. Seed the database: pnpm db:seed.`,
    );
  }
  return { prisma, moderator, loaders: createLoaders(prisma, now), now };
}
