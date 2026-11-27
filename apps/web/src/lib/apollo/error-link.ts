import { CombinedGraphQLErrors } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { reportClientError } from '@/lib/monitoring/report-client-error';

// The UI handles these codes itself (form errors, toasts), so they are not bugs.
const expectedCodes = new Set(['BAD_USER_INPUT', 'FORBIDDEN', 'UNDO_EXPIRED', 'NOT_FOUND']);

/** Logs every failed operation in development and reports the unexpected ones to monitoring. */
export const errorLink = new ErrorLink(({ error, operation }) => {
  const { operationName } = operation;
  if (process.env.NODE_ENV === 'development') {
    // `warn`, not `error`: the Next.js dev overlay shows each console error as an issue.
    console.warn(`GraphQL operation ${operationName ?? '(anonymous)'} failed:`, error);
  }

  const expected =
    CombinedGraphQLErrors.is(error) &&
    error.errors.every((graphQLError) => expectedCodes.has(String(graphQLError.extensions?.code)));
  if (!expected) reportClientError(error, { operationName });
});
