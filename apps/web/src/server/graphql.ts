import 'server-only';
import { createGraphQLHandler, type FetchHandler, systemClock } from '@modqueue/api';
import { captureException, flush } from '@sentry/nextjs';
import { after } from 'next/server';
import { getPrisma } from '@/server/prisma';

let handler: FetchHandler | undefined;

/** Runs a request through the GraphQL API. */
export function handleGraphQLRequest(request: Request): Promise<Response> {
  // Created on the first request, not on import: importing this module (as `next build` does)
  // then needs no DATABASE_URL.
  handler ??= createGraphQLHandler({
    prisma: getPrisma(),
    reportError: (error, { operationName }) => {
      captureException(
        error,
        operationName ? { tags: { 'graphql.operation': operationName } } : undefined,
      );
    },
    isProduction: process.env.NEXT_PUBLIC_APP_ENV === 'production',
    now: systemClock,
  });
  // Sentry wraps route handlers only in webpack builds, and Vercel can freeze the function after
  // the response: send this request's errors and spans before that.
  after(() => flush(2000));
  return handler(request);
}
