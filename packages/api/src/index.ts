import { createContext } from './context';
import type { PrismaClient } from './generated/prisma/client';
import { createFetchHandler, type FetchHandler } from './http/fetch-handler';
import type { Clock } from './lib/clock';
import { createApolloServer, type ReportError } from './server';

export { createPrismaClient, getPrisma } from './db';
export { systemClock, type Clock } from './lib/clock';
export { resetDemoData } from './seed/reset';
export type { FetchHandler } from './http/fetch-handler';
export type { ReportError } from './server';

export interface CreateGraphQLHandlerOptions {
  prisma: PrismaClient;
  reportError: ReportError;
  isProduction: boolean;
  now: Clock;
}

/** Creates the `/api/graphql` handler for the Web Fetch API; create it once per process. */
export function createGraphQLHandler({
  prisma,
  reportError,
  isProduction,
  now,
}: CreateGraphQLHandlerOptions): FetchHandler {
  const server = createApolloServer({ reportError, isProduction });
  return createFetchHandler(server, (request) => createContext({ request, prisma, now }));
}
