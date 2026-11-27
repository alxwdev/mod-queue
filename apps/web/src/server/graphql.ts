import 'server-only';
import { createGraphQLHandler, type FetchHandler, systemClock } from '@modqueue/api';
import { getPrisma } from '@/server/prisma';

let handler: FetchHandler | undefined;

/** Runs a request through the GraphQL API. */
export function handleGraphQLRequest(request: Request): Promise<Response> {
  // Created on the first request, not on import: importing this module (as `next build` does)
  // then needs no DATABASE_URL.
  handler ??= createGraphQLHandler({
    prisma: getPrisma(),
    // A no-op until task 5.1 connects Sentry.
    reportError: () => undefined,
    isProduction: process.env.NEXT_PUBLIC_APP_ENV === 'production',
    now: systemClock,
  });
  return handler(request);
}
