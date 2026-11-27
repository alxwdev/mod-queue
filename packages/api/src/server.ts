import { ApolloServer, type ApolloServerPlugin } from '@apollo/server';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import type { GraphQLContext } from './context';
import type { ErrorCode } from './errors';
import { resolvers } from './resolvers';
import { typeDefs } from './schema';

/** Sends an unexpected error to monitoring. */
export type ReportError = (error: Error, details: { operationName: string | null }) => void;

export interface CreateApolloServerOptions {
  reportError: ReportError;
  /** Masks the messages of unexpected errors and turns off the Sandbox landing page. */
  isProduction: boolean;
}

const INTERNAL_SERVER_ERROR: ErrorCode = 'INTERNAL_SERVER_ERROR';

// Every error that the API or Apollo throws on purpose (bad input, not found, a failed
// validation) has a code. An error without a code, or with INTERNAL_SERVER_ERROR, is a bug or an
// outage. Apollo adds INTERNAL_SERVER_ERROR only when it formats the response.
function isUnexpected(code: unknown): boolean {
  return code === undefined || code === INTERNAL_SERVER_ERROR;
}

function reportErrorsPlugin(reportError: ReportError): ApolloServerPlugin<GraphQLContext> {
  return {
    requestDidStart() {
      return Promise.resolve({
        didEncounterErrors({ errors, operationName }) {
          for (const error of errors) {
            if (isUnexpected(error.extensions.code)) {
              // The original error has the useful stack trace.
              reportError(error.originalError ?? error, { operationName: operationName ?? null });
            }
          }
          return Promise.resolve();
        },
      });
    },
    // A failed context (for example, the database is down) never reaches didEncounterErrors.
    contextCreationDidFail({ error }) {
      reportError(error, { operationName: null });
      return Promise.resolve();
    },
  };
}

/** Creates the Apollo Server with the schema and the resolvers; the caller starts it. */
export function createApolloServer({
  reportError,
  isProduction,
}: CreateApolloServerOptions): ApolloServer<GraphQLContext> {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
      isProduction
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageLocalDefault(),
      reportErrorsPlugin(reportError),
    ],
    formatError(formattedError) {
      if (!isProduction || !isUnexpected(formattedError.extensions?.code)) return formattedError;
      // The message of an unexpected error can show internals, such as SQL or file paths.
      return {
        message: 'Something went wrong on the server. Try again later.',
        locations: formattedError.locations,
        path: formattedError.path,
        extensions: { code: INTERNAL_SERVER_ERROR },
      };
    },
  });
}
