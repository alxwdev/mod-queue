import type { FormattedExecutionResult } from 'graphql';
import type { Moderator } from '../src/generated/prisma/client';
import type { Clock } from '../src/lib/clock';
import { createLoaders } from '../src/loaders';
import { createApolloServer } from '../src/server';
import { testPrisma } from './db';

// One server per test file. executeOperation starts it on the first call.
const server = createApolloServer({ reportError: () => undefined, isProduction: false });

export interface ExecuteOptions {
  /** The acting moderator, usually from the factories. */
  moderator: Moderator;
  /** A fixed clock: API tests never depend on the wall clock. */
  now: Clock;
}

/** Runs a GraphQL operation against the test database, as `moderator` at the time of `now`. */
export async function execute<TData = Record<string, unknown>>(
  operation: string,
  variables: Record<string, unknown>,
  { moderator, now }: ExecuteOptions,
): Promise<FormattedExecutionResult<TData>> {
  const response = await server.executeOperation<TData>(
    { query: operation, variables },
    {
      contextValue: { prisma: testPrisma, moderator, loaders: createLoaders(testPrisma, now), now },
    },
  );
  if (response.body.kind !== 'single') {
    throw new Error('execute() expects a single result, not incremental delivery.');
  }
  return response.body.singleResult;
}
