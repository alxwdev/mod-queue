import { captureException } from '@sentry/nextjs';

/** Sends an unexpected browser error to Sentry, tagged with its GraphQL operation if it has one. */
export function reportClientError(
  error: unknown,
  { operationName }: { operationName: string | undefined },
): void {
  captureException(
    error,
    operationName ? { tags: { 'graphql.operation': operationName } } : undefined,
  );
}
